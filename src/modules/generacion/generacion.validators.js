const { body } = require('express-validator');

// Detecta el tipo usando parseInt para tolerar que el body lleve el id como string o number.
const tipoId = (req) => parseInt(req.body.tipo_documento_generado_id, 10);

const esConMarcadores = (_v, { req }) => [1, 2, 3].includes(tipoId(req));
const esCartaPeticion = (_v, { req }) => tipoId(req) === 3;

const reglasGenerar = [
  body('tipo_documento_generado_id')
    .notEmpty().withMessage('El tipo de documento es obligatorio')
    .custom((v) => [1, 2, 3, 4].includes(parseInt(v, 10)))
    .withMessage('Tipo de documento no válido (valores permitidos: 1, 2, 3, 4)'),

  // Empresa y semestre — obligatorios para tipos 1, 2 y 3
  body('empresa')
    .if(esConMarcadores)
    .trim().notEmpty().withMessage('La empresa es obligatoria')
    .isLength({ max: 200 }).withMessage('La empresa no puede superar 200 caracteres'),

  body('semestre')
    .if(esConMarcadores)
    .trim().notEmpty().withMessage('El semestre es obligatorio')
    .isLength({ max: 30 }).withMessage('El semestre no puede superar 30 caracteres'),

  // Gerente y cargo — solo para Carta de Petición (tipo 3)
  body('gerente')
    .if(esCartaPeticion)
    .trim().notEmpty().withMessage('El nombre del gerente es obligatorio para la Carta de Peticion')
    .isLength({ max: 150 }).withMessage('El gerente no puede superar 150 caracteres'),

  body('cargo')
    .if(esCartaPeticion)
    .trim().notEmpty().withMessage('El cargo es obligatorio para la Carta de Peticion')
    .isLength({ max: 150 }).withMessage('El cargo no puede superar 150 caracteres'),

  // Título opcional — se pasa al marcador <<TITULO>> en la plantilla; por defecto "Señor"
  body('titulo')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 20 }).withMessage('El título no puede superar 20 caracteres'),
];

module.exports = { reglasGenerar };
