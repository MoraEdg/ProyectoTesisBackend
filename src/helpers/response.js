exports.ok = (res, data, message = '') =>
  res.status(200).json({ success: true, data, message });

exports.created = (res, data, message = '') =>
  res.status(201).json({ success: true, data, message });

exports.badRequest = (res, error, detalles = null) => {
  const body = { success: false, error };
  if (detalles) body.detalles = detalles;
  return res.status(400).json(body);
};

exports.unauthorized = (res, error = 'No autorizado') =>
  res.status(401).json({ success: false, error });

exports.forbidden = (res, error = 'No tienes permisos para esta acción') =>
  res.status(403).json({ success: false, error });

exports.notFound = (res, error = 'Recurso no encontrado') =>
  res.status(404).json({ success: false, error });

exports.serverError = (res, error = 'Error interno del servidor') =>
  res.status(500).json({ success: false, error });

// Wrapper para controllers async — evita repetir try/catch
exports.asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
