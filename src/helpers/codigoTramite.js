const pool = require('../config/db');

// Genera código de trámite único: PRAC-2026-001
async function generarCodigo(tipo_proceso_nombre) {
  const prefijos = {
    'Prácticas Preprofesionales': 'PRAC',
    'Reconocimiento Laboral':     'RLAB',
    'Convalidación':              'CONV',
  };

  const prefijo = prefijos[tipo_proceso_nombre] || 'TRAM';
  const anio = new Date().getFullYear();

  const { rows } = await pool.query(
    `SELECT COUNT(*) FROM tramites WHERE codigo_tramite LIKE $1`,
    [`${prefijo}-${anio}-%`]
  );

  const correlativo = String(parseInt(rows[0].count) + 1).padStart(3, '0');
  return `${prefijo}-${anio}-${correlativo}`;
}

module.exports = { generarCodigo };
