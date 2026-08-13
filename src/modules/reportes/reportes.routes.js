const router = require('express').Router();
const auth   = require('../../middleware/auth');
const roles  = require('../../middleware/roles');
const ctrl   = require('./reportes.controller');

// Ambos endpoints son exclusivos del Coordinador.
router.get('/dashboard',     auth, roles('Coordinador'), ctrl.getDashboard);
router.get('/planificacion', auth, roles('Coordinador'), ctrl.getPlanificacion);

module.exports = router;
