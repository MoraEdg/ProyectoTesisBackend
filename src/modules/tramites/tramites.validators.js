const { body, query } = require('express-validator');

const ESTADOS_TRAMITE = ['INICIADO', 'EN_REVISION', 'OBSERVADO', 'CORREGIDO', 'APROBADO', 'FINALIZADO'];

const reglasCrear = [
  body('estudiante_id')
    .notEmpty().withMessage('El estudiante es obligatorio')
    .isUUID().withMessage('El identificador del estudiante no es válido'),
  body('tipo_proceso_id')
    .notEmpty().withMessage('El tipo de proceso es obligatorio')
    .isInt({ min: 1 }).withMessage('El tipo de proceso no es válido'),
  body('periodo_id')
    .notEmpty().withMessage('El período es obligatorio')
    .isInt({ min: 1 }).withMessage('El período no es válido'),
];

const reglasCambiarEstado = [
  body('estado')
    .notEmpty().withMessage('El estado destino es obligatorio')
    .isIn(ESTADOS_TRAMITE).withMessage('El estado destino no es un estado de trámite válido'),
  body('comentario')
    .optional().trim(),
];

const reglasListar = [
  query('pagina').optional().isInt({ min: 1 }).withMessage('La página debe ser un entero mayor o igual a 1'),
  query('por_pagina').optional().isInt({ min: 1, max: 100 }).withMessage('por_pagina debe estar entre 1 y 100'),
  query('tipo_proceso_id').optional().isInt({ min: 1 }),
  query('periodo_id').optional().isInt({ min: 1 }),
  query('estado').optional().isIn(ESTADOS_TRAMITE).withMessage('Estado de filtro no válido'),
];

module.exports = { reglasCrear, reglasCambiarEstado, reglasListar, ESTADOS_TRAMITE };
