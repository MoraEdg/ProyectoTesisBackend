const RE_DIACRITICOS = /[̀-ͯ]/g;

function prefijoDe(tipo_proceso_nombre) {
  const nombre = (tipo_proceso_nombre || '')
    .normalize('NFD')
    .replace(RE_DIACRITICOS, '')
    .toLowerCase();
  if (nombre.includes('pract'))          return 'PRAC';
  if (nombre.includes('reconocimiento')) return 'RLAB';
  if (nombre.includes('convalid'))       return 'CONV';
  return 'TRAM';
}

async function generarCodigo(ejecutor, tipo_proceso_nombre) {
  const prefijo = prefijoDe(tipo_proceso_nombre);
  const anio = new Date().getFullYear();

  const { rows } = await ejecutor.query(
    `SELECT COALESCE(
       MAX(CAST(SPLIT_PART(codigo_tramite, '-', 3) AS INTEGER)),
       0
     ) AS ultimo
     FROM tramites
     WHERE codigo_tramite LIKE $1`,
    [`${prefijo}-${anio}-%`]
  );

  const correlativo = String(parseInt(rows[0].ultimo) + 1).padStart(3, '0');
  return `${prefijo}-${anio}-${correlativo}`;
}

module.exports = { generarCodigo };
