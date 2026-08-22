const router     = require('express').Router();
const controller = require('./catalogos.controller');
const auth       = require('../../middleware/auth');
const permiso    = require('../../middleware/permiso');

router.use(auth);

router.get('/roles',                    permiso('catalogos.ver_roles'),             controller.roles);
router.get('/estados',                  controller.estados);
router.get('/tipos-proceso',            controller.procesos);
// R-1: Coordinador y Director tienen catalogos.ver_tipos_convenio en la matriz inicial.
router.get('/tipos-convenio',           permiso('catalogos.ver_tipos_convenio'),    controller.convenios);
router.get('/periodos',                 controller.periodos);
// Coordinador y Estudiante tienen catalogos.ver_tipos_doc_generado en la matriz inicial.
router.get('/tipos-documento-generado', permiso('catalogos.ver_tipos_doc_generado'), controller.tiposDocGenerado);

module.exports = router;
