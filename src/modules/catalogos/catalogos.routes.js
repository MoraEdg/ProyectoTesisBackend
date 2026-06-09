const router     = require('express').Router();
const controller = require('./catalogos.controller');
const auth       = require('../../middleware/auth');
const roles      = require('../../middleware/roles');

router.use(auth);

router.get('/roles',                    roles('Coordinador'), controller.roles);
router.get('/estados',                  controller.estados);
router.get('/tipos-proceso',            controller.procesos);
router.get('/tipos-convenio',           roles('Coordinador', 'Director'), controller.convenios);
router.get('/periodos',                 controller.periodos);
router.get('/tipos-documento-generado', roles('Coordinador', 'Estudiante'), controller.tiposDocGenerado);

module.exports = router;
