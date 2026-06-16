const fs  = require('fs');
const svc = require('./estudiantes.service');
const { ok, created, badRequest, notFound, asyncHandler } = require('../../helpers/response');
const { validationResult } = require('express-validator');

function checkValidacion(req, res) {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    badRequest(res, 'Datos inválidos', errores.array());
    return false;
  }
  return true;
}

exports.listar = asyncHandler(async (req, res) => {
  const { pagina, por_pagina, busqueda, carrera, estado } = req.query;
  const filtroEstado = estado === undefined ? null : estado === 'true';
  const resultado = await svc.listar({ pagina, por_pagina, busqueda, carrera, estado: filtroEstado });
  return res.status(200).json({ success: true, ...resultado });
});

exports.detalle = asyncHandler(async (req, res) => {
  const estudiante = await svc.obtenerPorId(req.params.id);
  if (!estudiante) return notFound(res, 'Estudiante no encontrado');
  return ok(res, estudiante);
});

exports.crear = asyncHandler(async (req, res) => {
  if (!checkValidacion(req, res)) return;
  try {
    const nuevo = await svc.registrar(req.body);
    return created(res, nuevo, 'Estudiante registrado correctamente');
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message });
    throw err;
  }
});

exports.editar = asyncHandler(async (req, res) => {
  if (!checkValidacion(req, res)) return;
  try {
    const actualizado = await svc.editar(req.params.id, req.body);
    return ok(res, actualizado, 'Estudiante actualizado correctamente');
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message });
    throw err;
  }
});

exports.desactivar = asyncHandler(async (req, res) => {
  try {
    const resultado = await svc.desactivar(req.params.id);
    return ok(res, resultado, 'Estudiante desactivado correctamente');
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message });
    throw err;
  }
});

exports.importar = asyncHandler(async (req, res) => {
  if (!req.file) return badRequest(res, 'No se recibió ningún archivo Excel');

  try {
    const reporte = await svc.importarDesdeExcel(req.file.path);
    const mensaje = `Importación completada: ${reporte.exitosos} exitosos, ` +
                    `${reporte.omitidos.length} omitidos, ${reporte.errores.length} con error`;
    return ok(res, reporte, mensaje);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message });
    throw err;
  } finally {
    if (req.file?.path) fs.unlink(req.file.path, () => {});
  }
});
