const router     = require('express').Router();
const controller = require('./documentos.controller');
const auth       = require('../../middleware/auth');
const roles      = require('../../middleware/roles');
const { reglasObservar } = require('./documentos.validators');

router.use(auth);

router.get('/:id',               controller.detalle);
router.get('/:id/descargar',     controller.descargar);
router.get('/:id/observaciones', controller.observaciones);

router.patch('/:id/aprobar',  roles('Coordinador'), controller.aprobar);
router.patch('/:id/observar', roles('Coordinador'), reglasObservar, controller.observar);

module.exports = router;
