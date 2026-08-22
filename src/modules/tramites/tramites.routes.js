const router     = require('express').Router();
const controller = require('./tramites.controller');
const auth       = require('../../middleware/auth');
const permiso    = require('../../middleware/permiso');
const { reglasCrear, reglasCambiarEstado, reglasListar } = require('./tramites.validators');

router.use(auth);

// Auth-only: el scoping por rol se realiza en el controller (no se modifica).
router.get('/',              reglasListar, controller.listar);
router.get('/:id',           controller.detalle);
router.get('/:id/historial', controller.historial);

const hitosController = require('../hitos/hitos.controller');
router.get('/:tramiteId/hitos', hitosController.listarPorTramite);

const generacionController = require('../generacion/generacion.controller');
const { reglasGenerar }    = require('../generacion/generacion.validators');
router.post('/:tramiteId/generar-documento',   permiso('tramites.generar_documento'), reglasGenerar, generacionController.generar);
router.get('/:tramiteId/documentos-generados', permiso('tramites.ver_docs_generados'), generacionController.listarPorTramite);

router.post('/',             permiso('tramites.crear'),         reglasCrear, controller.crear);
router.patch('/:id/estado',  permiso('tramites.cambiar_estado'), reglasCambiarEstado, controller.cambiarEstado);
router.post('/:id/cerrar',   permiso('tramites.cerrar'),        controller.cerrar);

module.exports = router;
