const { ok, badRequest, asyncHandler } = require('../../helpers/response');
const service = require('./convenios.service');

const listar = asyncHandler(async (req, res) => {
  const { busqueda, estado, anio } = req.query;

  if (anio !== undefined && anio !== '') {
    const n = parseInt(anio, 10);
    if (isNaN(n) || n < 2000 || n > 2100) {
      return badRequest(res, 'El parámetro anio debe ser un entero entre 2000 y 2100');
    }
  }

  const data = await service.listar({
    busqueda: busqueda?.trim()  || undefined,
    estado:   estado?.trim()    || undefined,
    anio:     anio?.trim()      || undefined,
  });

  return ok(res, data);
});

module.exports = { listar };
