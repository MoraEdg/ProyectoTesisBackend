const pool = require('../../config/db');

async function getRoles() {
  const { rows } = await pool.query(
    'SELECT id, nombre_rol, descripcion FROM roles ORDER BY id'
  );
  return rows;
}

async function getEstados(categoria = null) {
  let query = 'SELECT id, nombre, categoria, descripcion FROM estados';
  const params = [];
  if (categoria) {
    query += ' WHERE categoria = $1';
    params.push(categoria.toUpperCase());
  }
  query += ' ORDER BY categoria, id';
  const { rows } = await pool.query(query, params);
  return rows;
}

async function getTiposProceso() {
  const { rows } = await pool.query(
    'SELECT id, nombre, descripcion FROM tipos_proceso WHERE activo = TRUE ORDER BY id'
  );
  return rows;
}

async function getTiposConvenio() {
  const { rows } = await pool.query(
    'SELECT id, nombre, descripcion FROM tipos_convenio ORDER BY nombre'
  );
  return rows;
}

async function getPeriodos() {
  const { rows } = await pool.query(
    'SELECT id, nombre_periodo, fecha_inicio, fecha_fin, activo FROM periodos ORDER BY activo DESC, id DESC'
  );
  return rows;
}

async function getPeriodoActivo() {
  const { rows } = await pool.query(
    'SELECT id, nombre_periodo FROM periodos WHERE activo = TRUE LIMIT 1'
  );
  return rows[0] ?? null;
}

async function getTiposDocumentoGenerado() {
  const { rows } = await pool.query(
    'SELECT id, nombre FROM tipos_documento_generado ORDER BY id'
  );
  return rows;
}

module.exports = {
  getRoles, getEstados, getTiposProceso,
  getTiposConvenio, getPeriodos, getPeriodoActivo,
  getTiposDocumentoGenerado,
};
