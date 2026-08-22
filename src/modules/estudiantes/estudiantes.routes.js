const router     = require('express').Router();
const controller = require('./estudiantes.controller');
const auth       = require('../../middleware/auth');
const permiso    = require('../../middleware/permiso');
const { uploadExcel }                = require('../../middleware/upload');
const { reglasCrear, reglasEditar } = require('./estudiantes.validators');

router.use(auth);

// /importar ANTES de /:id para evitar colisión de rutas
router.post('/importar',        permiso('estudiantes.importar'),    uploadExcel, controller.importar);

router.get('/',                 permiso('estudiantes.listar'),      controller.listar);
router.get('/:id',              permiso('estudiantes.ver'),         controller.detalle);
router.post('/',                permiso('estudiantes.crear'),       reglasCrear,  controller.crear);
router.put('/:id',              permiso('estudiantes.editar'),      reglasEditar, controller.editar);
router.patch('/:id/desactivar', permiso('estudiantes.desactivar'), controller.desactivar);

module.exports = router;
