const pool = require('../../config/db');
const { transicionValida } = require('../../helpers/estados');
const { generarCodigo } = require('../../helpers/codigoTramite');

async function listar({ pagina = 1, por_pagina = 20, tipo_proceso_id, estado, periodo_id, id_estudiante = null }) {
  pagina = Math.max(1, parseInt(pagina) || 1);
  por_pagina = Math.min(100, Math.max(1, parseInt(por_pagina) || 20));
  const offset = (pagina - 1) * por_pagina;

  const cond = [];
  const params = [];
  let idx = 1;

  if (id_estudiante) {
    cond.push(`t.estudiante_id = $${idx++}`);
    params.push(id_estudiante);
  }
  if (tipo_proceso_id) {
    cond.push(`t.tipo_proceso_id = $${idx++}`);
    params.push(tipo_proceso_id);
  }
  if (periodo_id) {
    cond.push(`t.periodo_id = $${idx++}`);
    params.push(periodo_id);
  }
  if (estado) {
    cond.push(`(es.nombre = $${idx++} AND es.categoria = 'TRAMITE')`);
    params.push(estado);
  }

  const where = cond.length ? `WHERE ${cond.join(' AND ')}` : '';

  const totalQ = await pool.query(
    `SELECT COUNT(*) FROM tramites t
     JOIN estados es ON t.estado_id = es.id
     ${where}`, params
  );
  const total = parseInt(totalQ.rows[0].count);

  const dataQ = await pool.query(
    `SELECT
       t.id_tramite, t.codigo_tramite, t.fecha_inicio, t.fecha_cierre,
       t.created_at, t.updated_at,
       tp.nombre AS tipo_proceso,
       per.nombre_periodo AS periodo,
       es.nombre AS estado,
       u.nombres, u.apellidos, u.cedula,
       e.id_estudiante, e.carrera, e.matricula
     FROM tramites t
     JOIN tipos_proceso tp ON t.tipo_proceso_id = tp.id
     JOIN periodos per      ON t.periodo_id = per.id
     JOIN estados es        ON t.estado_id = es.id
     JOIN estudiantes e     ON t.estudiante_id = e.id_estudiante
     JOIN usuarios u        ON e.usuario_id = u.id_usuario
     ${where}
     ORDER BY t.created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, por_pagina, offset]
  );

  return {
    data: dataQ.rows,
    meta: { total, pagina, por_pagina, total_paginas: Math.ceil(total / por_pagina) },
  };
}

async function obtenerPorId(id_tramite) {
  const { rows } = await pool.query(
    `SELECT
       t.id_tramite, t.codigo_tramite, t.fecha_inicio, t.fecha_cierre,
       t.created_at, t.updated_at,
       tp.id AS tipo_proceso_id, tp.nombre AS tipo_proceso,
       per.id AS periodo_id, per.nombre_periodo AS periodo,
       es.id AS estado_id, es.nombre AS estado,
       u.nombres, u.apellidos, u.cedula, u.correo,
       e.id_estudiante, e.carrera, e.matricula
     FROM tramites t
     JOIN tipos_proceso tp ON t.tipo_proceso_id = tp.id
     JOIN periodos per      ON t.periodo_id = per.id
     JOIN estados es        ON t.estado_id = es.id
     JOIN estudiantes e     ON t.estudiante_id = e.id_estudiante
     JOIN usuarios u        ON e.usuario_id = u.id_usuario
     WHERE t.id_tramite = $1`,
    [id_tramite]
  );
  return rows[0] ?? null;
}

async function crear({ estudiante_id, tipo_proceso_id, periodo_id }, usuario_id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const est = await client.query(
      `SELECT 1 FROM estudiantes WHERE id_estudiante = $1`, [estudiante_id]
    );
    if (est.rows.length === 0) throw { status: 404, message: 'El estudiante no existe' };

    const proc = await client.query(
      `SELECT nombre FROM tipos_proceso WHERE id = $1 AND activo = TRUE`, [tipo_proceso_id]
    );
    if (proc.rows.length === 0) throw { status: 400, message: 'El tipo de proceso no es válido o está inactivo' };
    const nombreProceso = proc.rows[0].nombre;

    const per = await client.query(
      `SELECT 1 FROM periodos WHERE id = $1 AND activo = TRUE`, [periodo_id]
    );
    if (per.rows.length === 0) throw { status: 400, message: 'El período no es válido o no está activo' };

    const activo = await client.query(
      `SELECT 1 FROM tramites t
       JOIN estados es ON t.estado_id = es.id
       WHERE t.estudiante_id = $1
         AND t.tipo_proceso_id = $2
         AND es.categoria = 'TRAMITE'
         AND es.nombre <> 'FINALIZADO'`,
      [estudiante_id, tipo_proceso_id]
    );
    if (activo.rows.length > 0) {
      throw { status: 400, message: 'El estudiante ya tiene un trámite activo de este tipo de proceso' };
    }

    const estadoIni = await client.query(
      `SELECT id FROM estados WHERE nombre = 'INICIADO' AND categoria = 'TRAMITE'`
    );
    if (estadoIni.rows.length === 0) {
      throw { status: 500, message: 'Configuración inválida: no existe el estado INICIADO para la categoría TRAMITE' };
    }
    const estado_id = estadoIni.rows[0].id;

    const codigo_tramite = await generarCodigo(client, nombreProceso);

    const ins = await client.query(
      `INSERT INTO tramites (codigo_tramite, estudiante_id, tipo_proceso_id, periodo_id, estado_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_tramite`,
      [codigo_tramite, estudiante_id, tipo_proceso_id, periodo_id, estado_id]
    );
    const id_tramite = ins.rows[0].id_tramite;

    await client.query(
      `INSERT INTO historial_tramites (tramite_id, estado_id, usuario_id, comentario)
       VALUES ($1, $2, $3, $4)`,
      [id_tramite, estado_id, usuario_id, 'Trámite creado']
    );

    // D-HITOS-01/02: instanciar los hitos del proceso
    const estadoHitoPend = await client.query(
      `SELECT id FROM estados WHERE nombre = 'PENDIENTE' AND categoria = 'HITO'`
    );
    if (estadoHitoPend.rows.length === 0) {
      throw { status: 500, message: 'Configuración inválida: no existe el estado PENDIENTE para la categoría HITO' };
    }
    const estadoHitoPendienteId = estadoHitoPend.rows[0].id;

    const plantillas = await client.query(
      `SELECT id FROM plantillas_hito WHERE tipo_proceso_id = $1 ORDER BY orden ASC`,
      [tipo_proceso_id]
    );
    if (plantillas.rows.length === 0) {
      throw { status: 400, message: 'El tipo de proceso no tiene hitos definidos. Contacte al coordinador.' };
    }

    for (const plantilla of plantillas.rows) {
      const hitoIns = await client.query(
        `INSERT INTO hitos (tramite_id, plantilla_hito_id, estado_id)
         VALUES ($1, $2, $3)
         RETURNING id_hito`,
        [id_tramite, plantilla.id, estadoHitoPendienteId]
      );
      await client.query(
        `INSERT INTO historial_hitos (hito_id, estado_id, usuario_id, comentario)
         VALUES ($1, $2, $3, $4)`,
        [hitoIns.rows[0].id_hito, estadoHitoPendienteId, usuario_id, 'Hito creado. Estado inicial: PENDIENTE']
      );
    }

    await client.query('COMMIT');
    return await obtenerPorId(id_tramite);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function cambiarEstado(id_tramite, estadoDestino, comentario, usuario_id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const actual = await client.query(
      `SELECT es.nombre AS estado_actual
       FROM tramites t JOIN estados es ON t.estado_id = es.id
       WHERE t.id_tramite = $1`, [id_tramite]
    );
    if (actual.rows.length === 0) throw { status: 404, message: 'Trámite no encontrado' };
    const estadoActual = actual.rows[0].estado_actual;

    if (!transicionValida('TRAMITE', estadoActual, estadoDestino)) {
      throw { status: 400, message: `Transición inválida: de ${estadoActual} no se puede pasar a ${estadoDestino}` };
    }

    const estDest = await client.query(
      `SELECT id FROM estados WHERE nombre = $1 AND categoria = 'TRAMITE'`, [estadoDestino]
    );
    if (estDest.rows.length === 0) throw { status: 400, message: 'Estado destino no válido' };
    const estado_id = estDest.rows[0].id;

    await client.query(
      `UPDATE tramites SET estado_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id_tramite = $2`,
      [estado_id, id_tramite]
    );

    await client.query(
      `INSERT INTO historial_tramites (tramite_id, estado_id, usuario_id, comentario)
       VALUES ($1, $2, $3, $4)`,
      [id_tramite, estado_id, usuario_id, comentario || `Cambio de estado a ${estadoDestino}`]
    );

    await client.query('COMMIT');
    return await obtenerPorId(id_tramite);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function cerrar(id_tramite, usuario_id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const actual = await client.query(
      `SELECT es.nombre AS estado_actual
       FROM tramites t JOIN estados es ON t.estado_id = es.id
       WHERE t.id_tramite = $1`, [id_tramite]
    );
    if (actual.rows.length === 0) throw { status: 404, message: 'Trámite no encontrado' };

    if (!transicionValida('TRAMITE', actual.rows[0].estado_actual, 'FINALIZADO')) {
      throw { status: 400, message: 'El trámite solo puede finalizarse desde el estado APROBADO' };
    }

    const estFin = await client.query(
      `SELECT id FROM estados WHERE nombre = 'FINALIZADO' AND categoria = 'TRAMITE'`
    );
    const estado_id = estFin.rows[0].id;

    await client.query(
      `UPDATE tramites SET estado_id = $1, fecha_cierre = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id_tramite = $2`,
      [estado_id, id_tramite]
    );

    await client.query(
      `INSERT INTO historial_tramites (tramite_id, estado_id, usuario_id, comentario)
       VALUES ($1, $2, $3, $4)`,
      [id_tramite, estado_id, usuario_id, 'Trámite finalizado']
    );

    await client.query('COMMIT');
    return await obtenerPorId(id_tramite);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function historial(id_tramite) {
  const { rows } = await pool.query(
    `SELECT
       h.id_historial, h.comentario, h.fecha_cambio,
       es.nombre AS estado, es.categoria,
       u.nombres, u.apellidos, r.nombre_rol AS rol
     FROM historial_tramites h
     JOIN estados es ON h.estado_id = es.id
     LEFT JOIN usuarios u ON h.usuario_id = u.id_usuario
     LEFT JOIN roles r    ON u.rol_id = r.id
     WHERE h.tramite_id = $1
     ORDER BY h.fecha_cambio ASC`,
    [id_tramite]
  );
  return rows.map(r => ({
    ...r,
    nombres: r.nombres || null,
    apellidos: r.apellidos || null,
    rol: r.rol || 'Sistema',
  }));
}

module.exports = { listar, obtenerPorId, crear, cambiarEstado, cerrar, historial };
