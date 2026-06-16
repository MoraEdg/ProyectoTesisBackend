const router     = require('express').Router();
const controller = require('./estudiantes.controller');
const auth       = require('../../middleware/auth');
const roles      = require('../../middleware/roles');
const { uploadExcel }                = require('../../middleware/upload');
const { reglasCrear, reglasEditar } = require('./estudiantes.validators');

router.use(auth);
router.use(roles('Coordinador'));

// /importar ANTES de /:id para evitar colisión de rutas
router.post('/importar',        uploadExcel, controller.importar);

router.get('/',                 controller.listar);
router.get('/:id',              controller.detalle);
router.post('/',                reglasCrear,  controller.crear);
router.put('/:id',              reglasEditar, controller.editar);
router.patch('/:id/desactivar', controller.desactivar);

module.exports = router;
