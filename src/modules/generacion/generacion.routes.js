const router     = require('express').Router();
const controller = require('./generacion.controller');
const auth       = require('../../middleware/auth');
const roles      = require('../../middleware/roles');

router.use(auth);
router.use(roles('Coordinador'));

// Catálogo de tipos disponibles
router.get('/tipos', controller.listarTipos);

// Re-descarga de un documento ya generado
router.get('/documentos/:id/descargar', controller.descargar);

module.exports = router;
