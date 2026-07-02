const { body } = require('express-validator');

const reglasObservar = [
  body('comentario')
    .trim()
    .notEmpty().withMessage('El comentario de observación es obligatorio'),
];

module.exports = { reglasObservar };
