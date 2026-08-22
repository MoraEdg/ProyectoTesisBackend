const router     = require('express').Router();
const controller = require('./generacion.controller');
const auth       = require('../../middleware/auth');
const permiso    = require('../../middleware/permiso');

router.use(auth);

// Catálogo de tipos disponibles
router.get('/tipos',                  permiso('generacion.ver_tipos'), controller.listarTipos);

// Re-descarga de un documento ya generado
router.get('/documentos/:id/descargar', permiso('generacion.descargar'), controller.descargar);

module.exports = router;
