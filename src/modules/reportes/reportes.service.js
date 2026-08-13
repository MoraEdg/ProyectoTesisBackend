const pool = require('../../config/db');

// ── Dashboard ejecutivo ────────────────────────────────────────────────────────
// Devuelve 5 métricas globales + 4 datasets para gráficos.
// No recibe filtros: siempre refleja el estado completo de la base de datos.
async function dashboard() {
  const [
    totalEstQ, conActivQ, totalTramQ, tramFinalQ,
    porTipoQ, porOrigenQ, porModalQ, porEstadoQ,
  ] = await Promise.all([

    // M1 — Total de estudiantes registrados
    pool.query('SELECT COUNT(*) AS total FROM estudiantes'),

    // M2 — Estudiantes con actividad (≥ 1 trámite en estado ≠ INICIADO)
    pool.query(`
      SELECT COUNT(DISTINCT t.estudiante_id) AS total
      FROM tramites t
      JOIN estados es ON t.estado_id = es.id
      WHERE es.nombre <> 'INICIADO'
        AND es.categoria = 'TRAMITE'
    `),

    // M3 — Total de trámites
    pool.query(`
      SELECT COUNT(*) AS total
      FROM tramites t
      JOIN estados es ON t.estado_id = es.id
      WHERE es.categoria = 'TRAMITE'
    `),

    // M4 — Trámites finalizados
    pool.query(`
      SELECT COUNT(*) AS total
      FROM tramites t
      JOIN estados es ON t.estado_id = es.id
      WHERE es.nombre = 'FINALIZADO'
        AND es.categoria = 'TRAMITE'
    `),

    // G1 — Por tipo de proceso
    pool.query(`
      SELECT tp.nombre, COUNT(*) AS total
      FROM tramites t
      JOIN tipos_proceso tp ON t.tipo_proceso_id = tp.id
      GROUP BY tp.nombre
      ORDER BY total DESC
    `),

    // G2 — Origen de colocación (tiene_convenio)
    pool.query(`
      SELECT
        CASE
          WHEN t.tiene_convenio IS NULL THEN 'Sin especificar'
          WHEN t.tiene_convenio          THEN 'Convenio'
          ELSE                                'Gestión propia'
        END AS nombre,
        COUNT(*) AS total
      FROM tramites t
      GROUP BY 1
      ORDER BY total DESC
    `),

    // G3 — Modalidad
    pool.query(`
      SELECT COALESCE(t.modalidad, 'Sin especificar') AS nombre, COUNT(*) AS total
      FROM tramites t
      GROUP BY 1
      ORDER BY total DESC
    `),

    // G4 — Estado de los trámites
    pool.query(`
      SELECT es.nombre, COUNT(*) AS total
      FROM tramites t
      JOIN estados es ON t.estado_id = es.id
      WHERE es.categoria = 'TRAMITE'
      GROUP BY es.nombre
      ORDER BY total DESC
    `),
  ]);

  const totalEstudiantes = parseInt(totalEstQ.rows[0].total);
  const conActividad     = parseInt(conActivQ.rows[0].total);

  return {
    metricas: {
      total_estudiantes:    totalEstudiantes,
      con_actividad:        conActividad,
      sin_actividad:        totalEstudiantes - conActividad,
      total_tramites:       parseInt(totalTramQ.rows[0].total),
      tramites_finalizados: parseInt(tramFinalQ.rows[0].total),
    },
    graficos: {
      por_tipo_proceso: porTipoQ.rows.map((r) => ({ nombre: r.nombre, total: parseInt(r.total) })),
      por_origen:       porOrigenQ.rows.map((r) => ({ nombre: r.nombre, total: parseInt(r.total) })),
      por_modalidad:    porModalQ.rows.map((r) => ({ nombre: r.nombre, total: parseInt(r.total) })),
      por_estado:       porEstadoQ.rows.map((r) => ({ nombre: r.nombre, total: parseInt(r.total) })),
    },
  };
}

// ── Planificación semestral ────────────────────────────────────────────────────
// Devuelve todas las filas que coincidan con los 6 filtros opcionales.
// La paginación se resuelve en el frontend.
async function planificacion({ periodo_id, tipo_proceso_id, estado, carrera, modalidad, tiene_convenio } = {}) {
  const cond   = [];
  const params = [];
  let   idx    = 1;

  if (periodo_id) {
    cond.push(`t.periodo_id = $${idx++}`);
    params.push(parseInt(periodo_id, 10));
  }
  if (tipo_proceso_id) {
    cond.push(`t.tipo_proceso_id = $${idx++}`);
    params.push(parseInt(tipo_proceso_id, 10));
  }
  if (estado) {
    cond.push(`(es.nombre = $${idx++} AND es.categoria = 'TRAMITE')`);
    params.push(estado);
  }
  if (carrera) {
    cond.push(`e.carrera ILIKE $${idx++}`);
    params.push(`%${carrera}%`);
  }
  if (modalidad) {
    cond.push(`t.modalidad = $${idx++}`);
    params.push(modalidad);
  }
  if (tiene_convenio !== undefined && tiene_convenio !== '') {
    cond.push(`t.tiene_convenio = $${idx++}`);
    params.push(tiene_convenio === 'true' || tiene_convenio === true);
  }

  const where = cond.length ? `WHERE ${cond.join(' AND ')}` : '';

  const { rows } = await pool.query(
    `SELECT
       u.cedula,
       u.nombres,
       u.apellidos,
       e.carrera,
       tp.nombre         AS tipo_proceso,
       t.modalidad,
       t.institucion_empresa,
       t.tiene_convenio,
       es.nombre         AS estado,
       t.fecha_inicio,
       per.nombre_periodo,
       t.id_tramite
     FROM tramites t
     JOIN tipos_proceso tp ON t.tipo_proceso_id = tp.id
     JOIN estados es       ON t.estado_id       = es.id
     JOIN estudiantes e    ON t.estudiante_id   = e.id_estudiante
     JOIN usuarios u       ON e.usuario_id      = u.id_usuario
     JOIN periodos per     ON t.periodo_id      = per.id
     ${where}
     ORDER BY u.apellidos ASC, u.nombres ASC`,
    params
  );

  return rows;
}

module.exports = { dashboard, planificacion };
