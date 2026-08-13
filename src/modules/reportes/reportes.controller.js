const { asyncHandler, ok, badRequest } = require('../../helpers/response');
const svc = require('./reportes.service');

const ESTADOS_TRAMITE = ['INICIADO', 'EN_REVISION', 'OBSERVADO', 'CORREGIDO', 'APROBADO', 'FINALIZADO'];

// GET /api/v1/reportes/dashboard
const getDashboard = asyncHandler(async (req, res) => {
  const data = await svc.dashboard();
  return ok(res, data);
});

// GET /api/v1/reportes/planificacion
const getPlanificacion = asyncHandler(async (req, res) => {
  const { periodo_id, tipo_proceso_id, estado, carrera, modalidad, tiene_convenio } = req.query;

  if (periodo_id     && isNaN(parseInt(periodo_id, 10)))     return badRequest(res, 'periodo_id no válido');
  if (tipo_proceso_id && isNaN(parseInt(tipo_proceso_id, 10))) return badRequest(res, 'tipo_proceso_id no válido');
  if (estado         && !ESTADOS_TRAMITE.includes(estado))   return badRequest(res, 'estado no válido');
  if (modalidad      && !['PRACTICA', 'PASANTIA'].includes(modalidad)) return badRequest(res, 'modalidad no válida');

  const data = await svc.planificacion({ periodo_id, tipo_proceso_id, estado, carrera, modalidad, tiene_convenio });
  return ok(res, data);
});

module.exports = { getDashboard, getPlanificacion };
