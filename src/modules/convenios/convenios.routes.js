const router = require('express').Router();
const auth   = require('../../middleware/auth');
const ctrl   = require('./convenios.controller');

// GET /api/v1/convenios — listado con filtros opcionales (busqueda, estado, anio)
// Acceso: cualquier rol autenticado (sin restricción de rol)
router.get('/', auth, ctrl.listar);

module.exports = router;
