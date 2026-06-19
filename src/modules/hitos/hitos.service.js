const pool = require('../../config/db');
const { transicionValida } = require('../../helpers/estados');

async function listarPorTramite(tramite_id) {
  const { rows } = await pool.query(
    `SELECT
       h.id_hito, h.tramite_id, h.estado_id, h.fecha_aprobacion, h.aprobado_por,
       h.created_at, h.updated_at,
       ph.id AS plantilla_hito_id, ph.orden, ph.nombre, ph.descripcion,
       es.nombre AS estado,
       r.nombre_rol AS rol_responsable,
       ap.nombres AS aprobador_nombres, ap.apellidos AS aprobador_apellidos
     FROM hitos h
     JOIN plantillas_hito ph ON h.plantilla_hito_id = ph.id
     JOIN estados es         ON h.estado_id = es.id
     JOIN roles r            ON ph.rol_responsable_id = r.id
     LEFT JOIN usuarios ap   ON h.aprobado_por = ap.id_usuario
     WHERE h.tramite_id = $1
     ORDER BY ph.orden ASC`,
    [tramite_id]
  );
  return rows;
}

async function obtenerPorId(id_hito) {
  const { rows } = await pool.query(
    `SELECT
       h.id_hito, h.tramite_id, h.estado_id, h.fecha_aprobacion, h.aprobado_por,
       ph.orden, ph.nombre, ph.descripcion, ph.rol_responsable_id,
       es.nombre AS estado, es.categoria
     FROM hitos h
     JOIN plantillas_hito ph ON h.plantilla_hito_id = ph.id
     JOIN estados es         ON h.estado_id = es.id
     WHERE h.id_hito = $1`,
    [id_hito]
  );
  return rows[0] ?? null;
}

async function tieneDocumentosObligatorios(plantilla_hito_id) {
  const { rows } = await pool.query(
    `SELECT COUNT(*) FROM tipos_documento
     WHERE plantilla_hito_id = $1 AND obligatorio = TRUE`,
    [plantilla_hito_id]
  );
  return parseInt(rows[0].count) > 0;
}

async function cambiarEstado(id_hito, estadoDestino, comentario, usuario_id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const actual = await client.query(
      `SELECT h.tramite_id, es.nombre AS estado_actual
       FROM hitos h JOIN estados es ON h.estado_id = es.id
       WHERE h.id_hito = $1`, [id_hito]
    );
    if (actual.rows.length === 0) throw { status: 404, message: 'Hito no encontrado' };
    const { tramite_id, estado_actual } = actual.rows[0];

    if (!transicionValida('HITO', estado_actual, estadoDestino)) {
      throw { status: 400, message: `Transición inválida: de ${estado_actual} no se puede pasar a ${estadoDestino}` };
    }

    const estDest = await client.query(
      `SELECT id FROM estados WHERE nombre = $1 AND categoria = 'HITO'`, [estadoDestino]
    );
    if (estDest.rows.length === 0) throw { status: 400, message: 'Estado destino de hito no válido' };
    const estado_id = estDest.rows[0].id;

    if (estadoDestino === 'APROBADO') {
      await client.query(
        `UPDATE hitos SET estado_id = $1, fecha_aprobacion = CURRENT_TIMESTAMP,
                          aprobado_por = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id_hito = $3`,
        [estado_id, usuario_id, id_hito]
      );
    } else {
      await client.query(
        `UPDATE hitos SET estado_id = $1, fecha_aprobacion = NULL,
                          aprobado_por = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE id_hito = $2`,
        [estado_id, id_hito]
      );
    }

    let comentarioFinal = comentario;
    if (!comentarioFinal) {
      comentarioFinal = estadoDestino === 'APROBADO'
        ? 'Aprobado manualmente por Coordinador'
        : `Cambio de estado a ${estadoDestino}`;
    }
    await client.query(
      `INSERT INTO historial_hitos (hito_id, estado_id, usuario_id, comentario)
       VALUES ($1, $2, $3, $4)`,
      [id_hito, estado_id, usuario_id, comentarioFinal]
    );

    await verificarYAvanzarTramite(client, tramite_id);

    await client.query('COMMIT');
    return await obtenerPorId(id_hito);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function verificarYAvanzarTramite(client, tramite_id) {
  const tram = await client.query(
    `SELECT es.nombre AS estado_tramite
     FROM tramites t JOIN estados es ON t.estado_id = es.id
     WHERE t.id_tramite = $1`, [tramite_id]
  );
  if (tram.rows.length === 0) return;
  const estadoTramite = tram.rows[0].estado_tramite;

  if (estadoTramite === 'FINALIZADO') return;

  const conteo = await client.query(
    `SELECT
       COUNT(*) AS total,
       COUNT(*) FILTER (WHERE es.nombre = 'APROBADO') AS aprobados
     FROM hitos h JOIN estados es ON h.estado_id = es.id
     WHERE h.tramite_id = $1`, [tramite_id]
  );
  const total = parseInt(conteo.rows[0].total);
  const aprobados = parseInt(conteo.rows[0].aprobados);
  if (total === 0) return;

  const todosAprobados = total === aprobados;

  // Caminos válidos hacia APROBADO desde cada estado intermedio
  const CAMINO_A_APROBADO = {
    INICIADO:    ['EN_REVISION', 'APROBADO'],
    EN_REVISION: ['APROBADO'],
    OBSERVADO:   ['CORREGIDO', 'EN_REVISION', 'APROBADO'],
    CORREGIDO:   ['EN_REVISION', 'APROBADO'],
  };

  async function moverTramiteA(nombreEstadoDestino, comentarioSistema) {
    const est = await client.query(
      `SELECT id FROM estados WHERE nombre = $1 AND categoria = 'TRAMITE'`, [nombreEstadoDestino]
    );
    if (est.rows.length === 0) return;
    await client.query(
      `UPDATE tramites SET estado_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id_tramite = $2`,
      [est.rows[0].id, tramite_id]
    );
    await client.query(
      `INSERT INTO historial_tramites (tramite_id, estado_id, usuario_id, comentario)
       VALUES ($1, $2, NULL, $3)`,
      [tramite_id, est.rows[0].id, comentarioSistema]
    );
  }

  if (todosAprobados && estadoTramite !== 'APROBADO') {
    const pasos = CAMINO_A_APROBADO[estadoTramite];
    if (pasos) {
      for (const paso of pasos) {
        await moverTramiteA(paso, paso === 'APROBADO'
          ? 'Todos los hitos aprobados (avance automático del sistema)'
          : `Avance automático del sistema hacia APROBADO (paso: ${paso})`);
      }
    }
  } else if (!todosAprobados && estadoTramite === 'APROBADO') {
    await moverTramiteA('EN_REVISION', 'Un hito dejó de estar aprobado (retroceso automático del sistema)');
  }
}

async function historial(id_hito) {
  const { rows } = await pool.query(
    `SELECT
       hh.id_historial, hh.comentario, hh.fecha_cambio,
       es.nombre AS estado,
       u.nombres, u.apellidos, r.nombre_rol AS rol
     FROM historial_hitos hh
     JOIN estados es ON hh.estado_id = es.id
     LEFT JOIN usuarios u ON hh.usuario_id = u.id_usuario
     LEFT JOIN roles r    ON u.rol_id = r.id
     WHERE hh.hito_id = $1
     ORDER BY hh.fecha_cambio ASC`,
    [id_hito]
  );
  return rows.map(r => ({
    ...r,
    autor: r.nombres ? `${r.nombres} ${r.apellidos}` : 'Sistema',
    rol: r.rol || 'Sistema',
  }));
}

module.exports = {
  listarPorTramite, obtenerPorId, cambiarEstado, historial,
  verificarYAvanzarTramite, tieneDocumentosObligatorios,
};
