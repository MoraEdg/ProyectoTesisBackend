const { body } = require('express-validator');

const ESTADOS_HITO = ['EN_REVISION', 'OBSERVADO', 'APROBADO'];

const reglasCambiarEstado = [
  body('estado')
    .notEmpty().withMessage('El estado destino es obligatorio')
    .isIn(ESTADOS_HITO).withMessage('El estado destino no es un estado de hito válido'),
  body('comentario').optional().trim(),
];

module.exports = { reglasCambiarEstado, ESTADOS_HITO };
