const path = require('path');
const pool = require('../../config/db');
const { transicionValida } = require('../../helpers/estados');
const hitosService = require('../hitos/hitos.service');

async function obtenerPorId(id_doc) {
  const { rows } = await pool.query(
    `SELECT
       d.id_doc, d.hito_id, d.tipo_documento_id, d.nombre_original, d.nombre_sistema,
       d.ruta, d.mime_type, d.tamano_bytes, d.version, d.subido_por, d.estado_id,
       d.fecha_subida, d.created_at, d.updated_at,
       es.nombre AS estado,
       td.nombre AS tipo_documento, td.obligatorio,
       h.tramite_id,
       u.nombres AS subido_por_nombres, u.apellidos AS subido_por_apellidos
     FROM documentos d
     JOIN estados es ON d.estado_id = es.id
     JOIN tipos_documento td ON d.tipo_documento_id = td.id
     JOIN hitos h ON d.hito_id = h.id_hito
     JOIN usuarios u ON d.subido_por = u.id_usuario
     WHERE d.id_doc = $1`,
    [id_doc]
  );
  return rows[0] ?? null;
}

async function listarPorHito(hito_id) {
  const { rows } = await pool.query(
    `SELECT
       d.id_doc, d.hito_id, d.tipo_documento_id, d.nombre_original,
       d.version, d.subido_por, d.estado_id, d.fecha_subida, d.updated_at,
       es.nombre AS estado,
       td.nombre AS tipo_documento, td.obligatorio,
       u.nombres AS subido_por_nombres, u.apellidos AS subido_por_apellidos
     FROM documentos d
     JOIN estados es ON d.estado_id = es.id
     JOIN tipos_documento td ON d.tipo_documento_id = td.id
     JOIN usuarios u ON d.subido_por = u.id_usuario
     WHERE d.hito_id = $1
     ORDER BY td.id ASC, d.version DESC`,
    [hito_id]
  );
  return rows;
}

async function subir({ hito_id, archivo, usuario_id }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const hitoQ = await client.query(
      `SELECT h.plantilla_hito_id, h.tramite_id, est.nombre AS estado_tramite
       FROM hitos h
       JOIN tramites tr ON h.tramite_id = tr.id_tramite
       JOIN estados est ON tr.estado_id = est.id
       WHERE h.id_hito = $1`,
      [hito_id]
    );
    if (hitoQ.rows.length === 0) throw { status: 404, message: 'Hito no encontrado' };
    const { plantilla_hito_id, estado_tramite } = hitoQ.rows[0];
    if (estado_tramite === 'FINALIZADO') {
      throw { status: 400, message: 'No se pueden subir documentos a un trámite finalizado' };
    }

    const tipoQ = await client.query(
      `SELECT id, nombre, extension_permitida, tamano_maximo_mb
       FROM tipos_documento WHERE plantilla_hito_id = $1 LIMIT 1`,
      [plantilla_hito_id]
    );
    if (tipoQ.rows.length === 0) {
      throw { status: 400, message: 'El hito no tiene un tipo de documento configurado' };
    }
    const tipoDoc = tipoQ.rows[0];

    const ext = path.extname(archivo.originalname).toLowerCase();
    const permitidas = (tipoDoc.extension_permitida || '')
      .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    if (permitidas.length > 0 && !permitidas.includes(ext)) {
      throw { status: 400, message: `Extensión no permitida. Se esperaba: ${tipoDoc.extension_permitida}` };
    }
    if (tipoDoc.tamano_maximo_mb && archivo.size > tipoDoc.tamano_maximo_mb * 1024 * 1024) {
      throw { status: 400, message: `El archivo excede el tamaño máximo de ${tipoDoc.tamano_maximo_mb} MB` };
    }

    const vigenteQ = await client.query(
      `SELECT d.id_doc, d.version, es.nombre AS estado
       FROM documentos d JOIN estados es ON d.estado_id = es.id
       WHERE d.hito_id = $1 AND d.tipo_documento_id = $2 AND es.nombre <> 'REEMPLAZADO'
       ORDER BY d.version DESC LIMIT 1`,
      [hito_id, tipoDoc.id]
    );

    let nuevaVersion = 1;
    if (vigenteQ.rows.length > 0) {
      const vigente = vigenteQ.rows[0];
      if (vigente.estado === 'APROBADO') {
        throw { status: 400, message: 'El documento ya está aprobado. El Coordinador debe observarlo antes de reemplazarlo.' };
      }
      const estReemp = await client.query(
        `SELECT id FROM estados WHERE nombre = 'REEMPLAZADO' AND categoria = 'DOCUMENTO'`
      );
      await client.query(
        `UPDATE documentos SET estado_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id_doc = $2`,
        [estReemp.rows[0].id, vigente.id_doc]
      );
      nuevaVersion = vigente.version + 1;
    }

    const estSubido = await client.query(
      `SELECT id FROM estados WHERE nombre = 'SUBIDO' AND categoria = 'DOCUMENTO'`
    );

    const ins = await client.query(
      `INSERT INTO documentos
         (hito_id, tipo_documento_id, nombre_original, nombre_sistema, ruta, mime_type, tamano_bytes, version, subido_por, estado_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id_doc`,
      [hito_id, tipoDoc.id, archivo.originalname, archivo.filename, archivo.path,
       archivo.mimetype, archivo.size, nuevaVersion, usuario_id, estSubido.rows[0].id]
    );
    const id_doc = ins.rows[0].id_doc;

    // Transición automática SUBIDO → EN_REVISION (definitiva, sin acción manual)
    const estRevision = await client.query(
      `SELECT id FROM estados WHERE nombre = 'EN_REVISION' AND categoria = 'DOCUMENTO'`
    );
    await client.query(
      `UPDATE documentos SET estado_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id_doc = $2`,
      [estRevision.rows[0].id, id_doc]
    );

    await hitosService.sincronizarConDocumento(client, hito_id);

    await client.query('COMMIT');
    return await obtenerPorId(id_doc);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function aprobar(id_doc, usuario_id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const docQ = await client.query(
      `SELECT d.hito_id, es.nombre AS estado_actual
       FROM documentos d JOIN estados es ON d.estado_id = es.id
       WHERE d.id_doc = $1`, [id_doc]
    );
    if (docQ.rows.length === 0) throw { status: 404, message: 'Documento no encontrado' };
    const { hito_id, estado_actual } = docQ.rows[0];

    if (!transicionValida('DOCUMENTO', estado_actual, 'APROBADO')) {
      throw { status: 400, message: `Transición inválida: de ${estado_actual} no se puede pasar a APROBADO` };
    }

    const estAprob = await client.query(
      `SELECT id FROM estados WHERE nombre = 'APROBADO' AND categoria = 'DOCUMENTO'`
    );
    await client.query(
      `UPDATE documentos SET estado_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id_doc = $2`,
      [estAprob.rows[0].id, id_doc]
    );

    await hitosService.sincronizarConDocumento(client, hito_id);

    await client.query('COMMIT');
    return await obtenerPorId(id_doc);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function observar(id_doc, comentario, usuario_id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const docQ = await client.query(
      `SELECT d.hito_id, es.nombre AS estado_actual
       FROM documentos d JOIN estados es ON d.estado_id = es.id
       WHERE d.id_doc = $1`, [id_doc]
    );
    if (docQ.rows.length === 0) throw { status: 404, message: 'Documento no encontrado' };
    const { hito_id, estado_actual } = docQ.rows[0];

    if (!transicionValida('DOCUMENTO', estado_actual, 'OBSERVADO')) {
      throw { status: 400, message: `Transición inválida: de ${estado_actual} no se puede pasar a OBSERVADO` };
    }

    const estObs = await client.query(
      `SELECT id FROM estados WHERE nombre = 'OBSERVADO' AND categoria = 'DOCUMENTO'`
    );
    await client.query(
      `UPDATE documentos SET estado_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id_doc = $2`,
      [estObs.rows[0].id, id_doc]
    );

    await client.query(
      `INSERT INTO observaciones (documento_id, usuario_id, comentario) VALUES ($1, $2, $3)`,
      [id_doc, usuario_id, comentario]
    );

    await hitosService.sincronizarConDocumento(client, hito_id);

    await client.query('COMMIT');
    return await obtenerPorId(id_doc);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function listarObservaciones(id_doc) {
  const { rows } = await pool.query(
    `SELECT o.id_observacion, o.comentario, o.fecha_observacion,
            u.nombres, u.apellidos, r.nombre_rol AS rol
     FROM observaciones o
     JOIN usuarios u ON o.usuario_id = u.id_usuario
     JOIN roles r    ON u.rol_id = r.id
     WHERE o.documento_id = $1
     ORDER BY o.fecha_observacion ASC`,
    [id_doc]
  );
  return rows;
}

module.exports = { obtenerPorId, listarPorHito, subir, aprobar, observar, listarObservaciones };
