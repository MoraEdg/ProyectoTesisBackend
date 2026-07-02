const fs = require('fs');
const svc = require('./documentos.service');
const pool = require('../../config/db');
const { ok, created, badRequest, notFound, forbidden, asyncHandler } = require('../../helpers/response');
const { validationResult } = require('express-validator');

function checkValidacion(req, res) {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    badRequest(res, 'Datos inválidos', errores.array());
    return false;
  }
  return true;
}

async function idEstudianteDe(usuario_id) {
  const { rows } = await pool.query(
    'SELECT id_estudiante FROM estudiantes WHERE usuario_id = $1', [usuario_id]
  );
  return rows[0]?.id_estudiante ?? null;
}

async function hitoEsDelEstudiante(hito_id, usuario_id) {
  const idEst = await idEstudianteDe(usuario_id);
  if (!idEst) return false;
  const { rows } = await pool.query(
    `SELECT 1 FROM hitos h JOIN tramites t ON h.tramite_id = t.id_tramite
     WHERE h.id_hito = $1 AND t.estudiante_id = $2`,
    [hito_id, idEst]
  );
  return rows.length > 0;
}

exports.subir = asyncHandler(async (req, res) => {
  const { hitoId } = req.params;

  if (!req.file) return badRequest(res, 'Debe adjuntar un archivo en el campo "archivo"');

  if (req.user.rol === 'Estudiante') {
    const esPropio = await hitoEsDelEstudiante(hitoId, req.user.id_usuario);
    if (!esPropio) {
      fs.unlink(req.file.path, () => {});
      return forbidden(res, 'No tienes acceso a este trámite');
    }
  }

  try {
    const doc = await svc.subir({ hito_id: hitoId, archivo: req.file, usuario_id: req.user.id_usuario });
    return created(res, doc, 'Documento subido correctamente');
  } catch (err) {
    fs.unlink(req.file.path, () => {});
    if (err.status) return res.status(err.status).json({ success: false, error: err.message });
    throw err;
  }
});

exports.listarPorHito = asyncHandler(async (req, res) => {
  const { hitoId } = req.params;
  if (req.user.rol === 'Estudiante') {
    const esPropio = await hitoEsDelEstudiante(hitoId, req.user.id_usuario);
    if (!esPropio) return forbidden(res, 'No tienes acceso a este trámite');
  }
  const data = await svc.listarPorHito(hitoId);
  return ok(res, data);
});

exports.detalle = asyncHandler(async (req, res) => {
  const doc = await svc.obtenerPorId(req.params.id);
  if (!doc) return notFound(res, 'Documento no encontrado');
  if (req.user.rol === 'Estudiante') {
    const esPropio = await hitoEsDelEstudiante(doc.hito_id, req.user.id_usuario);
    if (!esPropio) return forbidden(res, 'No tienes acceso a este documento');
  }
  return ok(res, doc);
});

exports.descargar = asyncHandler(async (req, res) => {
  const doc = await svc.obtenerPorId(req.params.id);
  if (!doc) return notFound(res, 'Documento no encontrado');
  if (req.user.rol === 'Estudiante') {
    const esPropio = await hitoEsDelEstudiante(doc.hito_id, req.user.id_usuario);
    if (!esPropio) return forbidden(res, 'No tienes acceso a este documento');
  }
  return res.download(doc.ruta, doc.nombre_original);
});

exports.aprobar = asyncHandler(async (req, res) => {
  try {
    const doc = await svc.aprobar(req.params.id, req.user.id_usuario);
    return ok(res, doc, 'Documento aprobado correctamente');
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message });
    throw err;
  }
});

exports.observar = asyncHandler(async (req, res) => {
  if (!checkValidacion(req, res)) return;
  try {
    const doc = await svc.observar(req.params.id, req.body.comentario, req.user.id_usuario);
    return ok(res, doc, 'Documento observado correctamente');
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message });
    throw err;
  }
});

exports.observaciones = asyncHandler(async (req, res) => {
  const doc = await svc.obtenerPorId(req.params.id);
  if (!doc) return notFound(res, 'Documento no encontrado');
  if (req.user.rol === 'Estudiante') {
    const esPropio = await hitoEsDelEstudiante(doc.hito_id, req.user.id_usuario);
    if (!esPropio) return forbidden(res, 'No tienes acceso a este documento');
  }
  const data = await svc.listarObservaciones(req.params.id);
  return ok(res, data);
});
