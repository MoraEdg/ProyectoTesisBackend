const NodeCache           = require('node-cache');
const pool                = require('../config/db');
const { forbidden }       = require('../helpers/response');

// ─── Caché en memoria ─────────────────────────────────────────────────────────
// Clave  : nombre del rol (string)       — ej. 'Coordinador'
// Valor  : array de claves habilitadas   — ej. ['tramites.listar', ...]
// TTL    : 0 = sin expiración automática (se invalida manualmente al guardar Settings)
// clones : false = almacena la referencia directa del array (evita problemas con JSON)
const _cache = new NodeCache({ stdTTL: 0, checkperiod: 0, useClones: false });

// ─── Carga de BD ──────────────────────────────────────────────────────────────
// Consulta roles_funcionalidades para el rol dado y guarda el resultado en caché.
// Devuelve el array de claves habilitadas.
async function _cargarDesdeDB(nombreRol) {
  const { rows } = await pool.query(
    `SELECT f.clave
       FROM roles_funcionalidades rf
       JOIN roles         r ON r.id  = rf.rol_id
       JOIN funcionalidades f ON f.id = rf.funcionalidad_id
      WHERE r.nombre_rol  = $1
        AND rf.habilitado = TRUE`,
    [nombreRol]
  );
  const claves = rows.map(r => r.clave);
  _cache.set(nombreRol, claves);
  return claves;
}

// ─── Obtener permisos del rol (caché → BD) ────────────────────────────────────
// Devuelve el array de claves habilitadas para el rol.
// Usado también por el módulo permisos (GET /permisos/mios).
async function obtenerPermisosDeRol(nombreRol) {
  const cached = _cache.get(nombreRol);
  if (cached !== undefined) return cached;
  return _cargarDesdeDB(nombreRol);
}

// ─── Invalidar caché ──────────────────────────────────────────────────────────
// Sin argumento : limpia todos los roles (usar al guardar la matriz completa).
// Con argumento : limpia solo ese rol.
// Llamado por permisos.service.js después de actualizar roles_funcionalidades.
function invalidarCache(nombreRol) {
  if (nombreRol) {
    _cache.del(nombreRol);
  } else {
    _cache.flushAll();
  }
}

// ─── Middleware de autorización por permiso ───────────────────────────────────
// Uso: router.get('/ruta', auth, permiso('modulo.accion'), controller)
//
// Flujo:
//   1. Lee req.user.rol (ya poblado por auth.js).
//   2. Obtiene las claves habilitadas para ese rol (caché o BD).
//   3. Si la clave solicitada no está habilitada → 403.
//   4. Si está habilitada → next().
//
// IMPORTANTE: este middleware controla únicamente si el usuario ENTRA al endpoint.
// El scoping (qué datos ve) sigue siendo responsabilidad del controller.
function permiso(clave) {
  return async (req, res, next) => {
    try {
      const rol = req.user?.rol;
      if (!rol) {
        return forbidden(res, 'No se pudo determinar el rol del usuario.');
      }

      const claves = await obtenerPermisosDeRol(rol);

      if (!claves.includes(clave)) {
        return forbidden(res, `Acceso denegado. Se requiere el permiso: ${clave}`);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports             = permiso;
module.exports.obtenerPermisosDeRol = obtenerPermisosDeRol;
module.exports.invalidarCache       = invalidarCache;
