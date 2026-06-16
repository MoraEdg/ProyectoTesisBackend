const { body } = require('express-validator');

// ─── REGLAS PARA CREAR ────────────────────────────────────────────────────────
const reglasCrear = [
  body('nombres')
    .trim().notEmpty().withMessage('El nombre es obligatorio'),

  body('apellidos')
    .trim().notEmpty().withMessage('El apellido es obligatorio'),

  body('cedula')
    .trim()
    .notEmpty().withMessage('La cédula es obligatoria')
    .matches(/^\d+$/).withMessage('La cédula solo puede contener dígitos')
    .isLength({ min: 10, max: 13 }).withMessage('La cédula debe tener entre 10 y 13 dígitos'),

  body('correo')
    .trim()
    .notEmpty().withMessage('El correo es obligatorio')
    .isEmail().withMessage('El correo electrónico no es válido'),

  body('carrera')
    .trim().notEmpty().withMessage('La carrera es obligatoria'),

  body('matricula')
    .trim().notEmpty().withMessage('La matrícula es obligatoria'),
];

// ─── REGLAS PARA EDITAR ───────────────────────────────────────────────────────
// Solo campos opcionales. NO se permite cambiar cedula ni nombre_usuario.
const reglasEditar = [
  body('nombres').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío'),
  body('apellidos').optional().trim().notEmpty().withMessage('El apellido no puede estar vacío'),
  body('correo').optional().trim().isEmail().withMessage('El correo electrónico no es válido'),
  body('telefono').optional().trim(),
  body('carrera').optional().trim().notEmpty().withMessage('La carrera no puede estar vacía'),
  body('matricula').optional().trim().notEmpty().withMessage('La matrícula no puede estar vacía'),

  body('cedula').not().exists().withMessage('La cédula no puede modificarse'),
  body('nombre_usuario').not().exists().withMessage('El nombre de usuario no puede modificarse'),
  body('rol_id').not().exists().withMessage('El rol no puede modificarse'),
  body('estado').not().exists().withMessage('El estado no puede modificarse desde aquí (usar /desactivar)'),
  body('hash_contrasena').not().exists().withMessage('La contraseña no puede modificarse desde aquí'),
];

module.exports = { reglasCrear, reglasEditar };
