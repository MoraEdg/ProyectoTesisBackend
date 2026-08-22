const pool = require('../../config/db');
const {
  obtenerPermisosDeRol,
  invalidarCache,
} = require('../../middleware/permiso');

// ─── GET /permisos/mios ───────────────────────────────────────────────────────
// Devuelve el array de claves habilitadas para el rol del usuario autenticado.
// Reutiliza la caché del middleware permiso.js — no duplica consulta SQL.
async function misPermisos(rol) {
  return obtenerPermisosDeRol(rol);
}

// ─── GET /permisos/matriz ─────────────────────────────────────────────────────
// Devuelve la estructura completa para que el frontend construya la matriz
// visual (roles × funcionalidades).
//
// Respuesta:
//   roles         — todos los roles del sistema
//   funcionalidades — catálogo completo de funcionalidades
//   permisos      — pares (rol_id, funcionalidad_id, habilitado) existentes
//
// El frontend asume habilitado=false para cualquier par que no esté en permisos.
async function obtenerMatriz() {
  const [rolesQ, funcsQ, permisosQ] = await Promise.all([
    pool.query(
      'SELECT id, nombre_rol, descripcion FROM roles ORDER BY id'
    ),
    pool.query(
      `SELECT id, modulo, accion, clave, descripcion
         FROM funcionalidades
        ORDER BY modulo, accion`
    ),
    pool.query(
      `SELECT rol_id, funcionalidad_id, habilitado
         FROM roles_funcionalidades
        ORDER BY rol_id, funcionalidad_id`
    ),
  ]);

  return {
    roles:           rolesQ.rows,
    funcionalidades: funcsQ.rows,
    permisos:        permisosQ.rows,
  };
}

// ─── PUT /permisos/matriz ─────────────────────────────────────────────────────
// Aplica un conjunto de cambios sobre roles_funcionalidades de forma atómica.
//
// Parámetros:
//   cambios  — array de { rol_id, funcionalidad_id, habilitado }
//   rolAdmin — nombre del rol del usuario que está ejecutando la operación
//              (req.user.rol), usado para la salvaguarda.
//
// Salvaguarda:
//   El usuario que administra la matriz no puede revocar settings.administrar
//   de su propio rol, evitando que quede sin acceso administrativo.
//
// Devuelve:
//   { ok: true }                            — operación completada
//   { ok: false, code: 'SALVAGUARDA' }      — salvaguarda activada, sin cambios
//
// La caché de permiso.js se invalida completamente tras un COMMIT exitoso
// para que las nuevas autorizaciones sean efectivas de inmediato en backend.
async function actualizarMatriz(cambios, rolAdmin) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── Salvaguarda ──────────────────────────────────────────────────────────
    // Obtener los IDs del permiso crítico y del rol del administrador actual.
    const { rows: guardRows } = await client.query(
      `SELECT
         (SELECT id FROM funcionalidades WHERE clave = 'settings.administrar') AS funcionalidad_id,
         (SELECT id FROM roles WHERE nombre_rol = $1)                          AS rol_id`,
      [rolAdmin]
    );

    if (guardRows.length > 0 && guardRows[0].funcionalidad_id && guardRows[0].rol_id) {
      const funcId = Number(guardRows[0].funcionalidad_id);
      const rolId  = Number(guardRows[0].rol_id);

      const intentaRevocar = cambios.some(
        c => Number(c.rol_id) === rolId
          && Number(c.funcionalidad_id) === funcId
          && c.habilitado === false
      );

      if (intentaRevocar) {
        await client.query('ROLLBACK');
        return { ok: false, code: 'SALVAGUARDA' };
      }
    }

    // ── Aplicar cambios (UPSERT uno a uno) ───────────────────────────────────
    for (const { rol_id, funcionalidad_id, habilitado } of cambios) {
      await client.query(
        `INSERT INTO roles_funcionalidades (rol_id, funcionalidad_id, habilitado)
              VALUES ($1, $2, $3)
         ON CONFLICT (rol_id, funcionalidad_id)
         DO UPDATE SET habilitado = EXCLUDED.habilitado`,
        [rol_id, funcionalidad_id, habilitado]
      );
    }

    await client.query('COMMIT');

    // ── Invalidar caché backend ───────────────────────────────────────────────
    // Cualquier rol pudo haberse modificado: limpiar todo.
    // D-SYNC: el frontend recarga sus permisos en el próximo inicio de sesión;
    // el backend empieza a aplicar los nuevos permisos de inmediato.
    invalidarCache();

    return { ok: true };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { misPermisos, obtenerMatriz, actualizarMatriz };
