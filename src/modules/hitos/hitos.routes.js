const router     = require('express').Router();
const controller = require('./hitos.controller');
const auth       = require('../../middleware/auth');
const roles      = require('../../middleware/roles');
const { reglasCambiarEstado } = require('./hitos.validators');
const { uploadDocumento } = require('../../middleware/upload');
const documentosController = require('../documentos/documentos.controller');

router.use(auth);

router.get('/:id',           controller.detalle);
router.get('/:id/historial', controller.historial);

router.patch('/:id/estado',  roles('Coordinador'), reglasCambiarEstado, controller.cambiarEstado);

// Documentos de un hito (Sprint 5) — Estudiante o Coordinador
router.post('/:hitoId/documentos', uploadDocumento, documentosController.subir);
router.get('/:hitoId/documentos',  documentosController.listarPorHito);

module.exports = router;
