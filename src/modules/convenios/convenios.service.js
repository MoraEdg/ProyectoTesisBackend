const pool = require('../../config/db');

// Devuelve convenios que cumplan los filtros opcionales.
// El frontend pagina localmente sobre el conjunto completo (D-CONV-05).
//
// incluirSensibles: boolean — controlado por el controller según el permiso dinámico
//   convenios.ver_detalle_sensible del rol autenticado.
//   - true  → devuelve los cinco campos sensibles con sus valores reales.
//   - false → devuelve esos campos como NULL (misma forma del objeto, sin datos sensibles).
async function listar({
  busqueda,
  estado,
  anio,
  tipo_convenio_id,
  incluirSensibles = false,
} = {}) {
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
  if (tipo_convenio_id) {
    cond.push(`c.tipo_convenio_id = $${idx++}`);
    params.push(tipo_convenio_id);
  }

  const where = cond.length ? `WHERE ${cond.join(' AND ')}` : '';

  // Proyección condicional de campos sensibles (D-CONV-SENS).
  // Cuando incluirSensibles=false se devuelven NULLs tipados para mantener
  // la forma del objeto idéntica independientemente del permiso.
  const camposSensibles = incluirSensibles
    ? `c.responsable_institucion,
       c.direccion,
       c.correo_contacto,
       c.telefono_contacto,
       c.observaciones`
    : `NULL::varchar  AS responsable_institucion,
       NULL::varchar  AS direccion,
       NULL::text     AS correo_contacto,
       NULL::varchar  AS telefono_contacto,
       NULL::text     AS observaciones`;

  const { rows } = await pool.query(
    `SELECT
       c.id_convenio,
       c.codigo_convenio,
       c.institucion,
       c.descripcion,
       c.otorgado_para,
       ${camposSensibles},
       c.anio,
       c.fecha_firma,
       c.fecha_finalizacion,
       c.duracion,
       c.proponente_universidad,
       c.posee_archivo_fisico,
       c.posee_archivo_digital,
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
