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

const generacionController = require('../generacion/generacion.controller');
const { reglasGenerar }    = require('../generacion/generacion.validators');
router.post('/:tramiteId/generar-documento',   roles('Coordinador'), reglasGenerar, generacionController.generar);
router.get('/:tramiteId/documentos-generados', roles('Coordinador'), generacionController.listarPorTramite);

router.post('/',             roles('Coordinador'), reglasCrear, controller.crear);
router.patch('/:id/estado',  roles('Coordinador'), reglasCambiarEstado, controller.cambiarEstado);
router.post('/:id/cerrar',   roles('Coordinador'), controller.cerrar);

module.exports = router;
