const svc                       = require('./permisos.service');
const { ok, badRequest, asyncHandler } = require('../../helpers/response');

// GET /api/v1/permisos/mios
// Devuelve las claves de permisos habilitados para el rol del usuario autenticado.
// Acceso: cualquier usuario con JWT válido.
exports.mios = asyncHandler(async (req, res) => {
  const claves = await svc.misPermisos(req.user.rol);
  ok(res, claves);
});

// GET /api/v1/permisos/matriz
// Devuelve roles, funcionalidades y la matriz completa de permisos.
// Acceso: requiere permiso settings.administrar (verificado en la ruta).
exports.getMatriz = asyncHandler(async (req, res) => {
  const matriz = await svc.obtenerMatriz();
  ok(res, matriz);
});

// PUT /api/v1/permisos/matriz
// Aplica cambios puntuales sobre la matriz de permisos.
// Acceso: requiere permiso settings.administrar (verificado en la ruta).
//
// Body esperado:
//   { "cambios": [ { "rol_id": 1, "funcionalidad_id": 5, "habilitado": false }, ... ] }
exports.putMatriz = asyncHandler(async (req, res) => {
  const { cambios } = req.body;

  // ── Validación básica del body ────────────────────────────────────────────
  if (!Array.isArray(cambios) || cambios.length === 0) {
    return badRequest(res, 'Se requiere un array "cambios" con al menos un elemento.');
  }

  for (const c of cambios) {
    const rolIdNum  = Number(c.rol_id);
    const funcIdNum = Number(c.funcionalidad_id);
    if (
      !Number.isInteger(rolIdNum)  || rolIdNum  <= 0 ||
      !Number.isInteger(funcIdNum) || funcIdNum <= 0 ||
      typeof c.habilitado !== 'boolean'
    ) {
      return badRequest(
        res,
        'Cada elemento de "cambios" debe tener rol_id (entero positivo), ' +
        'funcionalidad_id (entero positivo) y habilitado (booleano).'
      );
    }
  }

  // ── Delegar al service (incluye salvaguarda + transacción + caché) ────────
  const result = await svc.actualizarMatriz(cambios, req.user.rol);

  if (!result.ok) {
    if (result.code === 'SALVAGUARDA') {
      return badRequest(
        res,
        'No es posible revocar el permiso settings.administrar ' +
        'del rol que está administrando la matriz.'
      );
    }
    return badRequest(res, 'No fue posible actualizar la matriz de permisos.');
  }

  ok(res, null, 'Matriz de permisos actualizada correctamente.');
});
