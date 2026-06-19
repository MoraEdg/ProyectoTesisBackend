const router     = require('express').Router();
const controller = require('./hitos.controller');
const auth       = require('../../middleware/auth');
const roles      = require('../../middleware/roles');
const { reglasCambiarEstado } = require('./hitos.validators');

router.use(auth);

router.get('/:id',           controller.detalle);
router.get('/:id/historial', controller.historial);

router.patch('/:id/estado',  roles('Coordinador'), reglasCambiarEstado, controller.cambiarEstado);

module.exports = router;
