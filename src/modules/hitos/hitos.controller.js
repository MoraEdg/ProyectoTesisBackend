const svc = require('./hitos.service');
const { ok, badRequest, notFound, forbidden, asyncHandler } = require('../../helpers/response');
const { validationResult } = require('express-validator');
const pool = require('../../config/db');

async function idEstudianteDe(usuario_id) {
  const { rows } = await pool.query(
    'SELECT id_estudiante FROM estudiantes WHERE usuario_id = $1', [usuario_id]
  );
  return rows[0]?.id_estudiante ?? null;
}

async function tramiteEsDelEstudiante(tramite_id, usuario_id) {
  const idEst = await idEstudianteDe(usuario_id);
  if (!idEst) return false;
  const { rows } = await pool.query(
    'SELECT 1 FROM tramites WHERE id_tramite = $1 AND estudiante_id = $2',
    [tramite_id, idEst]
  );
  return rows.length > 0;
}

exports.listarPorTramite = asyncHandler(async (req, res) => {
  const { tramiteId } = req.params;
  if (req.user.rol === 'Estudiante') {
    const esPropio = await tramiteEsDelEstudiante(tramiteId, req.user.id_usuario);
    if (!esPropio) return forbidden(res, 'No tienes acceso a este trámite');
  }
  const data = await svc.listarPorTramite(tramiteId);
  return ok(res, data);
});

exports.detalle = asyncHandler(async (req, res) => {
  const hito = await svc.obtenerPorId(req.params.id);
  if (!hito) return notFound(res, 'Hito no encontrado');
  if (req.user.rol === 'Estudiante') {
    const esPropio = await tramiteEsDelEstudiante(hito.tramite_id, req.user.id_usuario);
    if (!esPropio) return forbidden(res, 'No tienes acceso a este hito');
  }
  return ok(res, hito);
});

exports.cambiarEstado = asyncHandler(async (req, res) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) return badRequest(res, 'Datos inválidos', errores.array());
  try {
    const actualizado = await svc.cambiarEstado(
      req.params.id, req.body.estado, req.body.comentario, req.user.id_usuario
    );
    return ok(res, actualizado, 'Estado actualizado correctamente');
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message });
    throw err;
  }
});

exports.historial = asyncHandler(async (req, res) => {
  const hito = await svc.obtenerPorId(req.params.id);
  if (!hito) return notFound(res, 'Hito no encontrado');
  if (req.user.rol === 'Estudiante') {
    const esPropio = await tramiteEsDelEstudiante(hito.tramite_id, req.user.id_usuario);
    if (!esPropio) return forbidden(res, 'No tienes acceso a este hito');
  }
  const data = await svc.historial(req.params.id);
  return ok(res, data);
});
