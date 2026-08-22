const router = require('express').Router();
const auth    = require('../../middleware/auth');
const permiso = require('../../middleware/permiso');
const ctrl    = require('./reportes.controller');

// Ambos endpoints son exclusivos del Coordinador.
router.get('/dashboard',     auth, permiso('reportes.dashboard'),     ctrl.getDashboard);
router.get('/planificacion', auth, permiso('reportes.planificacion'), ctrl.getPlanificacion);

module.exports = router;
