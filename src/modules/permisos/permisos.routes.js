const router     = require('express').Router();
const controller = require('./permisos.controller');
const auth       = require('../../middleware/auth');
const permiso    = require('../../middleware/permiso');

// GET /api/v1/permisos/mios
// Acceso: cualquier usuario autenticado.
router.get('/mios', auth, controller.mios);

// GET /api/v1/permisos/matriz
// Acceso: solo quien posea el permiso settings.administrar.
// No se usa roles('Coordinador') — la autorización depende del permiso dinámico.
router.get('/matriz', auth, permiso('settings.administrar'), controller.getMatriz);

// PUT /api/v1/permisos/matriz
// Acceso: solo quien posea el permiso settings.administrar.
router.put('/matriz', auth, permiso('settings.administrar'), controller.putMatriz);

module.exports = router;
