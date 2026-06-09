const jwt = require('jsonwebtoken');
const { unauthorized } = require('../helpers/response');

module.exports = (req, res, next) => {
  const header = req.headers['authorization'];

  if (!header || !header.startsWith('Bearer ')) {
    return unauthorized(res, 'Token no proporcionado');
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id_usuario, rol, nombres, apellidos }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return unauthorized(res, 'La sesión ha expirado. Inicia sesión nuevamente.');
    }
    return unauthorized(res, 'Token inválido');
  }
};
