const authService = require('./auth.service');
const { ok, badRequest } = require('../../helpers/response');
const { asyncHandler } = require('../../helpers/response');
const { body, validationResult } = require('express-validator');

exports.reglasLogin = [
  body('nombre_usuario').notEmpty().withMessage('El nombre de usuario es requerido'),
  body('contrasena').notEmpty().withMessage('La contraseña es requerida'),
];

exports.login = asyncHandler(async (req, res) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return badRequest(res, 'Datos inválidos', errores.array());
  }

  const { nombre_usuario, contrasena } = req.body;

  try {
    const resultado = await authService.login(nombre_usuario, contrasena);
    return ok(res, resultado, 'Sesión iniciada correctamente');
  } catch (err) {
    if (err.status === 401) {
      return res.status(401).json({ success: false, error: err.message });
    }
    throw err;
  }
});

exports.logout = asyncHandler(async (req, res) => {
  // JWT es stateless — el logout se maneja en el frontend eliminando el token
  return ok(res, null, 'Sesión cerrada correctamente');
});

exports.me = asyncHandler(async (req, res) => {
  const datos = await authService.getMe(req.user.id_usuario, req.user.rol);
  return ok(res, datos);
});
