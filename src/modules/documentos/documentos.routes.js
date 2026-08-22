const router     = require('express').Router();
const controller = require('./documentos.controller');
const auth       = require('../../middleware/auth');
const permiso    = require('../../middleware/permiso');
const { reglasObservar } = require('./documentos.validators');

router.use(auth);

// Auth-only
router.get('/:id',               controller.detalle);
router.get('/:id/descargar',     controller.descargar);
router.get('/:id/observaciones', controller.observaciones);

router.patch('/:id/aprobar',  permiso('documentos.aprobar'),                    controller.aprobar);
router.patch('/:id/observar', permiso('documentos.observar'), reglasObservar,   controller.observar);

module.exports = router;
