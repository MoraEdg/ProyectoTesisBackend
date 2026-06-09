const pool   = require('../../config/db');
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');

async function login(nombre_usuario, contrasena) {
  const { rows } = await pool.query(
    `SELECT
       u.id_usuario,
       u.nombres,
       u.apellidos,
       u.nombre_usuario,
       u.hash_contrasena,
       u.estado,
       r.nombre_rol AS rol
     FROM usuarios u
     JOIN roles r ON u.rol_id = r.id
     WHERE u.nombre_usuario = $1`,
    [nombre_usuario]
  );

  if (rows.length === 0) {
    throw { status: 401, message: 'Credenciales incorrectas' };
  }

  const usuario = rows[0];

  if (!usuario.estado) {
    throw { status: 401, message: 'La cuenta está deshabilitada. Contacta al Coordinador.' };
  }

  const contrasenaValida = await bcrypt.compare(contrasena, usuario.hash_contrasena);
  if (!contrasenaValida) {
    throw { status: 401, message: 'Credenciales incorrectas' };
  }

  const payload = {
    id_usuario: usuario.id_usuario,
    rol:        usuario.rol,
    nombres:    usuario.nombres,
    apellidos:  usuario.apellidos,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  return {
    token,
    usuario: {
      id_usuario: usuario.id_usuario,
      nombres:    usuario.nombres,
      apellidos:  usuario.apellidos,
      rol:        usuario.rol,
    },
  };
}

async function getMe(id_usuario, rol) {
  let extra = {};

  if (rol === 'Estudiante') {
    const { rows } = await pool.query(
      'SELECT id_estudiante, carrera, matricula FROM estudiantes WHERE usuario_id = $1',
      [id_usuario]
    );
    if (rows.length > 0) extra.estudiante = rows[0];
  }

  const { rows } = await pool.query(
    `SELECT u.id_usuario, u.nombres, u.apellidos, u.correo, u.telefono, r.nombre_rol AS rol
     FROM usuarios u JOIN roles r ON u.rol_id = r.id
     WHERE u.id_usuario = $1`,
    [id_usuario]
  );

  return { ...rows[0], ...extra };
}

module.exports = { login, getMe };
