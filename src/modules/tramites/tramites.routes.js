const router     = require('express').Router();
const controller = require('./tramites.controller');
const auth       = require('../../middleware/auth');
const roles      = require('../../middleware/roles');
const { reglasCrear, reglasCambiarEstado, reglasListar } = require('./tramites.validators');

router.use(auth);

router.get('/',              reglasListar, controller.listar);
router.get('/:id',           controller.detalle);
router.get('/:id/historial', controller.historial);

const hitosController = require('../hitos/hitos.controller');
router.get('/:tramiteId/hitos', hitosController.listarPorTramite);

router.post('/',             roles('Coordinador'), reglasCrear, controller.crear);
router.patch('/:id/estado',  roles('Coordinador'), reglasCambiarEstado, controller.cambiarEstado);
router.post('/:id/cerrar',   roles('Coordinador'), controller.cerrar);

module.exports = router;
