const router     = require('express').Router();
const controller = require('./hitos.controller');
const auth       = require('../../middleware/auth');
const permiso    = require('../../middleware/permiso');
const { reglasCambiarEstado } = require('./hitos.validators');
const { uploadDocumento } = require('../../middleware/upload');
const documentosController = require('../documentos/documentos.controller');

router.use(auth);

// Auth-only
router.get('/:id',           controller.detalle);
router.get('/:id/historial', controller.historial);

router.patch('/:id/estado',  permiso('hitos.cambiar_estado'), reglasCambiarEstado, controller.cambiarEstado);

// Documentos de un hito
router.post('/:hitoId/documentos', permiso('documentos.subir'), uploadDocumento, documentosController.subir);
router.get('/:hitoId/documentos',  documentosController.listarPorHito);

module.exports = router;
