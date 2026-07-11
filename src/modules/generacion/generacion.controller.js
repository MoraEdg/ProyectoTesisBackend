const { validationResult } = require('express-validator');
const svc = require('./generacion.service');
const { ok, badRequest, notFound, asyncHandler } = require('../../helpers/response');

exports.listarTipos = asyncHandler(async (req, res) => {
  return ok(res, await svc.listarTipos());
});

exports.generar = asyncHandler(async (req, res) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) return badRequest(res, 'Datos invalidos', errores.array());

  try {
    const { buffer, nombre_archivo } = await svc.generar(
      req.params.tramiteId,
      req.body,
      req.user.id_usuario
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${nombre_archivo}"`);
    return res.send(buffer);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message });
    throw err;
  }
});

exports.listarPorTramite = asyncHandler(async (req, res) => {
  return ok(res, await svc.listarPorTramite(req.params.tramiteId));
});

exports.descargar = asyncHandler(async (req, res) => {
  try {
    const d = await svc.obtenerParaDescarga(req.params.id);
    if (!d) return notFound(res, 'Documento generado no encontrado');
    return res.download(d.rutaAbs, d.nombre_archivo);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, error: err.message });
    throw err;
  }
});
