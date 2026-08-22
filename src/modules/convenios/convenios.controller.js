const { ok, badRequest, asyncHandler } = require('../../helpers/response');
const service                          = require('./convenios.service');
const { obtenerPermisosDeRol }         = require('../../middleware/permiso');

const listar = asyncHandler(async (req, res) => {
  const { busqueda, estado, anio, tipo_convenio_id } = req.query;

  // Validar anio
  if (anio !== undefined && anio !== '') {
    const n = parseInt(anio, 10);
    if (isNaN(n) || n < 2000 || n > 2100) {
      return badRequest(res, 'El parámetro anio debe ser un entero entre 2000 y 2100');
    }
  }

  // Validar tipo_convenio_id
  let tipoConvenioId;
  if (tipo_convenio_id !== undefined && tipo_convenio_id !== '') {
    const t = parseInt(tipo_convenio_id, 10);
    if (isNaN(t) || t < 1) {
      return badRequest(res, 'El parámetro tipo_convenio_id debe ser un entero positivo');
    }
    tipoConvenioId = t;
  }

  // Determinar acceso a campos sensibles basándose en el permiso dinámico del rol.
  // No se hardcodea ningún nombre de rol (D-CONV-SENS).
  const permisos         = await obtenerPermisosDeRol(req.user.rol);
  const incluirSensibles = permisos.includes('convenios.ver_detalle_sensible');

  const data = await service.listar({
    busqueda:        busqueda?.trim()  || undefined,
    estado:          estado?.trim()    || undefined,
    anio:            anio?.trim()      || undefined,
    tipo_convenio_id: tipoConvenioId,
    incluirSensibles,
  });

  return ok(res, data);
});

module.exports = { listar };
