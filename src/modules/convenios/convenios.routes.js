const router  = require('express').Router();
const auth    = require('../../middleware/auth');
const permiso = require('../../middleware/permiso');
const ctrl    = require('./convenios.controller');

// GET /api/v1/convenios — listado con filtros opcionales (busqueda, estado, anio)
// Acceso: roles con permiso convenios.ver_lista (Coordinador, Estudiante, Director, Decano)
router.get('/', auth, permiso('convenios.ver_lista'), ctrl.listar);

module.exports = router;
