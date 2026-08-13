const pool = require('../../config/db');

// Devuelve todos los convenios que cumplan los filtros opcionales.
// El frontend pagina localmente sobre el conjunto completo (D-CONV-05).
async function listar({ busqueda, estado, anio } = {}) {
  const cond   = [];
  const params = [];
  let   idx    = 1;

  if (busqueda) {
    // Búsqueda parcial sobre empresa y código (OR entre ambos)
    cond.push(`(c.institucion ILIKE $${idx} OR c.codigo_convenio ILIKE $${idx})`);
    params.push(`%${busqueda}%`);
    idx++;
  }
  if (estado) {
    cond.push(`es.nombre = $${idx++}`);
    params.push(estado);
  }
  if (anio) {
    cond.push(`c.anio = $${idx++}`);
    params.push(parseInt(anio, 10));
  }

  const where = cond.length ? `WHERE ${cond.join(' AND ')}` : '';

  const { rows } = await pool.query(
    `SELECT
       c.id_convenio,
       c.codigo_convenio,
       c.institucion,
       c.descripcion,
       c.otorgado_para,
       c.responsable_institucion,
       c.direccion,
       c.correo_contacto,
       c.telefono_contacto,
       c.anio,
       c.fecha_firma,
       c.fecha_finalizacion,
       c.duracion,
       c.proponente_universidad,
       c.posee_archivo_fisico,
       c.posee_archivo_digital,
       c.observaciones,
       tc.nombre AS tipo,
       es.nombre AS estado
     FROM convenios c
     JOIN tipos_convenio tc ON c.tipo_convenio_id = tc.id
     JOIN estados es        ON c.estado_id = es.id
     ${where}
     ORDER BY c.anio DESC, c.institucion ASC`,
    params
  );

  return rows;
}

module.exports = { listar };
