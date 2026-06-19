const svc = require('./tramites.service');
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
  const pool = require('../../config/db');
  const { rows } = await pool.query(
    'SELECT id_estudiante FROM estudiantes WHERE usuario_id = $1', [usuario_id]
  );
  return rows[0]?.id_estudiante ?? null;
}

exports.listar = asyncHandler(async (req, res) => {
  if (!checkValidacion(req, res)) return;
  const { pagina, por_pagina, tipo_proceso_id, estado, periodo_id } = req.query;
  let id_estudiante = null;
  if (req.user.rol === 'Estudiante') {
    id_estudiante = await idEstudianteDe(req.user.id_usuario);
  }
  const resultado = await svc.listar({ pagina, por_pagina, tipo_proceso_id, estado, periodo_id, id_estudiante });
  return res.status(200).json({ success: true, ...resultado });
});

exports.detalle = asyncHandler(async (req, res) => {
  const tramite = await svc.obtenerPorId(req.params.id);
  if (!tramite) return notFound(res, 'Trámite no encontrado');

  if (req.user.rol === 'Estudiante') {
    const idEst = await idEstudianteDe(req.user.id_usuario);
    if (tramite.id_estudiante !== idEst) return forbidden(res, 'No tienes acceso a este trámite');
  }
  return ok(res, tramite);
});

exports.crear = asyncHandler(async (req, res) => {
  if (!checkValidacion(req, res)) return;
  try {
    const nuevo = await svc.crear(req.body, req.user.id_usuario);
    return created(res, nuevo, 'Trámite creado correctamente');
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message });
    throw err;
  }
});

exports.cambiarEstado = asyncHandler(async (req, res) => {
  if (!checkValidacion(req, res)) return;
  try {
    const actualizado = await svc.cambiarEstado(req.params.id, req.body.estado, req.body.comentario, req.user.id_usuario);
    return ok(res, actualizado, 'Estado actualizado correctamente');
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message });
    throw err;
  }
});

exports.cerrar = asyncHandler(async (req, res) => {
  try {
    const cerrado = await svc.cerrar(req.params.id, req.user.id_usuario);
    return ok(res, cerrado, 'Trámite finalizado correctamente');
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message });
    throw err;
  }
});

exports.historial = asyncHandler(async (req, res) => {
  if (req.user.rol === 'Estudiante') {
    const tramite = await svc.obtenerPorId(req.params.id);
    if (!tramite) return notFound(res, 'Trámite no encontrado');
    const idEst = await idEstudianteDe(req.user.id_usuario);
    if (tramite.id_estudiante !== idEst) return forbidden(res, 'No tienes acceso a este trámite');
  }
  const datos = await svc.historial(req.params.id);
  return ok(res, datos);
});
