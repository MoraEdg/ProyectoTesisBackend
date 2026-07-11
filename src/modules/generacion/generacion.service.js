const fs   = require('fs');
const path = require('path');
const PizZip        = require('pizzip');
const Docxtemplater = require('docxtemplater');
const pool = require('../../config/db');

// Raiz del backend: src/modules/generacion/ → ../../.. → backend/
const RAIZ = path.join(__dirname, '../../..');

// Formato institucional: "Quito, 10 de julio de 2026"
function fechaInstitucional() {
  const MESES = [
    'enero','febrero','marzo','abril','mayo','junio',
    'julio','agosto','septiembre','octubre','noviembre','diciembre',
  ];
  const d = new Date();
  return `Quito, ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

// Normaliza texto para nombre de archivo: sin tildes, sin espacios, solo alfanumérico.
function slug(texto) {
  return (texto || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '');
}

// ─── GENERAR DOCUMENTO ────────────────────────────────────────────────────────
// datos = { tipo_documento_generado_id, empresa?, semestre?, gerente?, cargo? }
// Devuelve { buffer, nombre_archivo, registro }
async function generar(tramite_id, datos, usuario_id) {
  const tipoId = parseInt(datos.tipo_documento_generado_id, 10);

  // 1. Datos del trámite y el estudiante
  const tQ = await pool.query(
    `SELECT t.codigo_tramite,
            u.nombres, u.apellidos, u.cedula,
            e.id_estudiante, e.carrera
     FROM tramites t
     JOIN estudiantes e ON t.estudiante_id = e.id_estudiante
     JOIN usuarios u    ON e.usuario_id = u.id_usuario
     WHERE t.id_tramite = $1`,
    [tramite_id]
  );
  if (tQ.rows.length === 0) throw { status: 404, message: 'Tramite no encontrado' };
  const tr = tQ.rows[0];

  // 2. Plantilla activa para el tipo solicitado
  const pQ = await pool.query(
    `SELECT pd.id AS plantilla_id, pd.ruta_archivo, tdg.nombre AS tipo_nombre
     FROM plantillas_documento pd
     JOIN tipos_documento_generado tdg ON pd.tipo_documento_generado_id = tdg.id
     WHERE pd.tipo_documento_generado_id = $1 AND pd.activa = TRUE`,
    [tipoId]
  );
  if (pQ.rows.length === 0) {
    throw { status: 400, message: 'No existe plantilla activa para ese tipo de documento' };
  }
  const plantilla = pQ.rows[0];

  // 3. Verificar que el archivo de plantilla existe en disco
  const rutaPlantilla = path.join(RAIZ, plantilla.ruta_archivo);
  if (!fs.existsSync(rutaPlantilla)) {
    throw {
      status: 500,
      message: `Plantilla no encontrada en el servidor: ${plantilla.ruta_archivo}. Contacte al administrador.`,
    };
  }

  // 4. Generar buffer:
  //    - Tipo 4 (FPP3 vacío): la plantilla se entrega tal cual, sin reemplazo de marcadores.
  //    - Tipos 1-3: reemplazo de marcadores con docxtemplater (delimitadores << >>).
  //    El original en plantillas/ NUNCA se modifica; siempre se trabaja sobre una copia en memoria.
  let buffer;

  if (tipoId === 4) {
    buffer = fs.readFileSync(rutaPlantilla);
  } else {
    const contenido = fs.readFileSync(rutaPlantilla, 'binary');
    const zip = new PizZip(contenido);

    let doc;
    try {
      doc = new Docxtemplater(zip, {
        delimiters: { start: '<<', end: '>>' },
        paragraphLoop: true,
        linebreaks: true,
      });

      // Siempre se pasan las 8 claves; las que no aplican al tipo reciben ''.
      doc.render({
        FECHA:      fechaInstitucional(),
        GERENTE:    datos.gerente  || '',
        CARGO:      datos.cargo    || '',
        EMPRESA:    datos.empresa  || '',
        ESTUDIANTE: `${tr.nombres} ${tr.apellidos}`,
        CEDULA:     tr.cedula,
        SEMESTRE:   datos.semestre || '',
        CARRERA:    tr.carrera,
      });
    } catch (renderErr) {
      // docxtemplater lanza error estructurado; exponer mensaje util sin detalle interno.
      throw {
        status: 500,
        message: `Error al procesar la plantilla. Verifique que los marcadores esten correctamente insertados en el documento. (${renderErr.message || renderErr})`,
      };
    }

    buffer = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  }

  // 5. Guardar en uploads/generados/{tramite_id}/{nombre_unico}.docx
  const dir = path.join(RAIZ, 'uploads', 'generados', tramite_id);
  fs.mkdirSync(dir, { recursive: true });

  const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const nombre_archivo = `${tr.codigo_tramite}_${slug(plantilla.tipo_nombre)}_${ts}.docx`;
  const ruta_relativa  = path.join('uploads', 'generados', tramite_id, nombre_archivo);

  fs.writeFileSync(path.join(RAIZ, ruta_relativa), buffer);

  // 6. Registrar en documentos_generados (entrada nueva; nunca sobrescribe)
  const reg = await pool.query(
    `INSERT INTO documentos_generados
       (plantilla_documento_id, estudiante_id, generado_por, ruta_archivo, tramite_id, nombre_archivo)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id_documento_generado, fecha_generacion`,
    [plantilla.plantilla_id, tr.id_estudiante, usuario_id, ruta_relativa, tramite_id, nombre_archivo]
  );

  return { buffer, nombre_archivo, registro: reg.rows[0] };
}

// ─── LISTAR GENERADOS DE UN TRÁMITE ──────────────────────────────────────────
async function listarPorTramite(tramite_id) {
  const { rows } = await pool.query(
    `SELECT dg.id_documento_generado, dg.nombre_archivo, dg.fecha_generacion,
            tdg.id   AS tipo_id,
            tdg.nombre AS tipo_documento,
            u.nombres  AS generador_nombres,
            u.apellidos AS generador_apellidos
     FROM documentos_generados dg
     JOIN plantillas_documento      pd  ON dg.plantilla_documento_id = pd.id
     JOIN tipos_documento_generado  tdg ON pd.tipo_documento_generado_id = tdg.id
     JOIN usuarios u                    ON dg.generado_por = u.id_usuario
     WHERE dg.tramite_id = $1
     ORDER BY dg.fecha_generacion DESC`,
    [tramite_id]
  );
  return rows;
}

// ─── OBTENER PARA RE-DESCARGA ─────────────────────────────────────────────────
async function obtenerParaDescarga(id_documento_generado) {
  const { rows } = await pool.query(
    `SELECT ruta_archivo, nombre_archivo
     FROM documentos_generados
     WHERE id_documento_generado = $1`,
    [id_documento_generado]
  );
  if (rows.length === 0) return null;

  const rutaAbs = path.join(RAIZ, rows[0].ruta_archivo);
  if (!fs.existsSync(rutaAbs)) {
    throw { status: 410, message: 'El archivo ya no existe en el servidor' };
  }
  return { rutaAbs, nombre_archivo: rows[0].nombre_archivo };
}

// ─── TIPOS DISPONIBLES ────────────────────────────────────────────────────────
async function listarTipos() {
  const { rows } = await pool.query(
    `SELECT tdg.id, tdg.nombre, pd.id AS plantilla_id
     FROM tipos_documento_generado tdg
     JOIN plantillas_documento pd ON pd.tipo_documento_generado_id = tdg.id AND pd.activa = TRUE
     ORDER BY tdg.id`
  );
  return rows;
}

module.exports = { generar, listarPorTramite, obtenerParaDescarga, listarTipos };
