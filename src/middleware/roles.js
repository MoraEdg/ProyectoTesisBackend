const { forbidden } = require('../helpers/response');

// Uso: router.get('/ruta', auth, roles('Coordinador', 'Director'), controller)
module.exports = (...rolesPermitidos) => (req, res, next) => {
  if (!rolesPermitidos.includes(req.user.rol)) {
    return forbidden(res, `Acceso denegado. Se requiere rol: ${rolesPermitidos.join(' o ')}`);
  }
  next();
};
