const pool   = require('../../config/db');
const bcrypt = require('bcrypt');
const XLSX   = require('xlsx');

const SALT_ROUNDS = 10;

// Regex básica para validar correos en importación Excel
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Encabezados obligatorios de la plantilla oficial (forma normalizada)
const ENCABEZADOS_REQUERIDOS = [
  'cedula', 'apellidos', 'nombres', 'correo', 'matricula', 'carrera',
];

/**
 * Normaliza un texto: minúsculas y sin tildes.
 * Permite que 'Cédula', 'CEDULA', 'cedula' se traten como iguales.
 */
function normalizar(texto) {
  return texto
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

/**
 * Construye un mapa { encabezadoNormalizado: nombreRealEnExcel }
 * a partir de las columnas reales del archivo.
 */
function mapearColumnas(columnasReales) {
  const mapa = {};
  for (const col of columnasReales) {
    mapa[normalizar(col)] = col;
  }
  return mapa;
}

// ─── LISTAR (paginación + búsqueda + filtros) ─────────────────────────────────
async function listar({ pagina = 1, por_pagina = 20, busqueda = '', carrera = '', estado = null }) {
  const offset = (pagina - 1) * por_pagina;
  const condiciones = [];
  const params = [];
  let idx = 1;

  if (busqueda) {
    condiciones.push(`(
      u.nombres    ILIKE $${idx} OR u.apellidos ILIKE $${idx}
      OR u.cedula  ILIKE $${idx} OR e.matricula ILIKE $${idx}
    )`);
    params.push(`%${busqueda}%`);
    idx++;
  }
  if (carrera) {
    condiciones.push(`e.carrera ILIKE $${idx}`);
    params.push(`%${carrera}%`);
    idx++;
  }
  if (estado !== null) {
    condiciones.push(`u.estado = $${idx}`);
    params.push(estado);
    idx++;
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  const totalQuery = await pool.query(
    `SELECT COUNT(*) FROM estudiantes e
     JOIN usuarios u ON e.usuario_id = u.id_usuario
     ${where}`,
    params
  );
  const total = parseInt(totalQuery.rows[0].count);

  const dataQuery = await pool.query(
    `SELECT
       e.id_estudiante, e.carrera, e.matricula, e.created_at,
       u.id_usuario, u.nombres, u.apellidos, u.cedula,
       u.correo, u.telefono, u.estado
     FROM estudiantes e
     JOIN usuarios u ON e.usuario_id = u.id_usuario
     ${where}
     ORDER BY u.apellidos, u.nombres
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, por_pagina, offset]
  );

  return {
    data: dataQuery.rows,
    meta: {
      total,
      pagina:        parseInt(pagina),
      por_pagina:    parseInt(por_pagina),
      total_paginas: Math.ceil(total / por_pagina),
    },
  };
}

// ─── OBTENER POR ID ───────────────────────────────────────────────────────────
async function obtenerPorId(id_estudiante) {
  const { rows } = await pool.query(
    `SELECT
       e.id_estudiante, e.carrera, e.matricula, e.created_at,
       u.id_usuario, u.nombres, u.apellidos, u.cedula,
       u.correo, u.telefono, u.nombre_usuario, u.estado
     FROM estudiantes e
     JOIN usuarios u ON e.usuario_id = u.id_usuario
     WHERE e.id_estudiante = $1`,
    [id_estudiante]
  );
  return rows[0] ?? null;
}

// ─── REGISTRAR (transacción) ──────────────────────────────────────────────────
async function registrar(datos) {
  const { nombres, apellidos, cedula, correo, telefono, carrera, matricula } = datos;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const dup = await client.query(
      `SELECT
         EXISTS(SELECT 1 FROM usuarios    WHERE cedula    = $1) AS cedula_existe,
         EXISTS(SELECT 1 FROM usuarios    WHERE correo    = $2) AS correo_existe,
         EXISTS(SELECT 1 FROM estudiantes WHERE matricula = $3) AS matricula_existe`,
      [cedula, correo, matricula]
    );
    const { cedula_existe, correo_existe, matricula_existe } = dup.rows[0];
    if (cedula_existe)    throw { status: 400, message: 'Ya existe un usuario con esa cédula' };
    if (correo_existe)    throw { status: 400, message: 'Ya existe un usuario con ese correo' };
    if (matricula_existe) throw { status: 400, message: 'Ya existe un estudiante con esa matrícula' };

    // Credenciales iniciales: usuario = cédula, contraseña = cédula
    const hash   = await bcrypt.hash(cedula, SALT_ROUNDS);
    const rol    = await client.query(`SELECT id FROM roles WHERE nombre_rol = 'Estudiante'`);
    const rol_id = rol.rows[0].id;

    const usuarioInsert = await client.query(
      `INSERT INTO usuarios
         (nombres, apellidos, cedula, correo, telefono, nombre_usuario, hash_contrasena, rol_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id_usuario`,
      [nombres, apellidos, cedula, correo, telefono || null, cedula, hash, rol_id]
    );
    const usuario_id = usuarioInsert.rows[0].id_usuario;

    const estudianteInsert = await client.query(
      `INSERT INTO estudiantes (usuario_id, carrera, matricula)
       VALUES ($1, $2, $3)
       RETURNING id_estudiante`,
      [usuario_id, carrera, matricula]
    );

    await client.query('COMMIT');

    return {
      id_estudiante: estudianteInsert.rows[0].id_estudiante,
      id_usuario:    usuario_id,
      nombres, apellidos, cedula, correo,
      telefono: telefono || null,
      carrera, matricula,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ─── EDITAR ───────────────────────────────────────────────────────────────────
async function editar(id_estudiante, datos) {
  const { nombres, apellidos, correo, telefono, carrera, matricula } = datos;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const est = await client.query(
      `SELECT usuario_id FROM estudiantes WHERE id_estudiante = $1`,
      [id_estudiante]
    );
    if (est.rows.length === 0) throw { status: 404, message: 'Estudiante no encontrado' };
    const usuario_id = est.rows[0].usuario_id;

    if (correo) {
      const correoDup = await client.query(
        `SELECT 1 FROM usuarios WHERE correo = $1 AND id_usuario <> $2`,
        [correo, usuario_id]
      );
      if (correoDup.rows.length > 0)
        throw { status: 400, message: 'El correo ya está en uso por otro usuario' };
    }

    if (matricula) {
      const matriculaDup = await client.query(
        `SELECT 1 FROM estudiantes WHERE matricula = $1 AND id_estudiante <> $2`,
        [matricula, id_estudiante]
      );
      if (matriculaDup.rows.length > 0)
        throw { status: 400, message: 'La matrícula ya está en uso por otro estudiante' };
    }

    await client.query(
      `UPDATE usuarios SET
         nombres    = COALESCE($1, nombres),
         apellidos  = COALESCE($2, apellidos),
         correo     = COALESCE($3, correo),
         telefono   = COALESCE($4, telefono),
         updated_at = CURRENT_TIMESTAMP
       WHERE id_usuario = $5`,
      [nombres, apellidos, correo, telefono, usuario_id]
    );

    if (carrera || matricula) {
      await client.query(
        `UPDATE estudiantes SET
           carrera   = COALESCE($1, carrera),
           matricula = COALESCE($2, matricula)
         WHERE id_estudiante = $3`,
        [carrera, matricula, id_estudiante]
      );
    }

    await client.query('COMMIT');
    return await obtenerPorId(id_estudiante);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ─── DESACTIVAR ───────────────────────────────────────────────────────────────
async function desactivar(id_estudiante) {
  const est = await pool.query(
    `SELECT usuario_id FROM estudiantes WHERE id_estudiante = $1`,
    [id_estudiante]
  );
  if (est.rows.length === 0) throw { status: 404, message: 'Estudiante no encontrado' };

  await pool.query(
    `UPDATE usuarios SET estado = FALSE, updated_at = CURRENT_TIMESTAMP
     WHERE id_usuario = $1`,
    [est.rows[0].usuario_id]
  );
  return { desactivado: true };
}

// ─── IMPORTAR DESDE EXCEL ─────────────────────────────────────────────────────
async function importarDesdeExcel(rutaArchivo) {
  const workbook = XLSX.readFile(rutaArchivo);

  if (!workbook.SheetNames.includes('Estudiantes')) {
    throw {
      status: 400,
      message: 'La hoja debe llamarse "Estudiantes" según la plantilla oficial del sistema',
    };
  }

  const hoja  = workbook.Sheets['Estudiantes'];
  const filas = XLSX.utils.sheet_to_json(hoja, { defval: '' });

  if (filas.length === 0) {
    throw { status: 400, message: 'El archivo Excel está vacío' };
  }

  const mapaColumnas = mapearColumnas(Object.keys(filas[0]));
  const faltantes    = ENCABEZADOS_REQUERIDOS.filter(req => !mapaColumnas[req]);
  if (faltantes.length > 0) {
    throw {
      status: 400,
      message: `La plantilla Excel no tiene el formato esperado. Faltan columnas: ${faltantes.join(', ')}`,
    };
  }

  const celda = (fila, claveNorm) => {
    const colReal = mapaColumnas[claveNorm];
    return colReal ? (fila[colReal] ?? '').toString().trim() : '';
  };

  const reporte = { total: filas.length, exitosos: 0, omitidos: [], errores: [] };

  // Sets para detectar duplicados dentro del mismo archivo
  const cedulasVistas    = new Set();
  const correosVistos    = new Set();
  const matriculasVistas = new Set();

  const client = await pool.connect();
  try {
    const rol    = await client.query(`SELECT id FROM roles WHERE nombre_rol = 'Estudiante'`);
    const rol_id = rol.rows[0].id;

    for (const [i, fila] of filas.entries()) {
      const numFila   = i + 2;
      const cedula    = celda(fila, 'cedula');
      const apellidos = celda(fila, 'apellidos');
      const nombres   = celda(fila, 'nombres');
      const correo    = celda(fila, 'correo');
      const matricula = celda(fila, 'matricula');
      const carrera   = celda(fila, 'carrera');
      const telefono  = celda(fila, 'telefono');

      // Campos obligatorios
      if (!cedula || !apellidos || !nombres || !correo || !matricula || !carrera) {
        reporte.omitidos.push({ fila: numFila, motivo: 'Campos obligatorios vacíos' });
        continue;
      }

      // Formato de cédula
      if (!/^\d+$/.test(cedula) || cedula.length < 10 || cedula.length > 13) {
        reporte.omitidos.push({ fila: numFila, motivo: 'Cédula inválida (10-13 dígitos)' });
        continue;
      }

      // Formato de correo
      if (!REGEX_EMAIL.test(correo)) {
        reporte.omitidos.push({ fila: numFila, motivo: 'Correo inválido' });
        continue;
      }

      // Duplicados dentro del archivo
      const correoLower = correo.toLowerCase();
      if (cedulasVistas.has(cedula)) {
        reporte.omitidos.push({ fila: numFila, motivo: 'Cédula duplicada en el archivo' });
        continue;
      }
      if (correosVistos.has(correoLower)) {
        reporte.omitidos.push({ fila: numFila, motivo: 'Correo duplicado en el archivo' });
        continue;
      }
      if (matriculasVistas.has(matricula)) {
        reporte.omitidos.push({ fila: numFila, motivo: 'Matrícula duplicada en el archivo' });
        continue;
      }

      try {
        await client.query('BEGIN');

        const dup = await client.query(
          `SELECT
             EXISTS(SELECT 1 FROM usuarios    WHERE cedula    = $1) AS cedula_existe,
             EXISTS(SELECT 1 FROM usuarios    WHERE correo    = $2) AS correo_existe,
             EXISTS(SELECT 1 FROM estudiantes WHERE matricula = $3) AS matricula_existe`,
          [cedula, correo, matricula]
        );
        const { cedula_existe, correo_existe, matricula_existe } = dup.rows[0];

        if (cedula_existe || correo_existe || matricula_existe) {
          await client.query('ROLLBACK');
          const motivos = [];
          if (cedula_existe)    motivos.push('cédula');
          if (correo_existe)    motivos.push('correo');
          if (matricula_existe) motivos.push('matrícula');
          reporte.omitidos.push({ fila: numFila, motivo: `Duplicado en BD (${motivos.join(', ')})` });
          continue;
        }

        const hash = await bcrypt.hash(cedula, SALT_ROUNDS);

        const usuarioInsert = await client.query(
          `INSERT INTO usuarios
             (nombres, apellidos, cedula, correo, telefono, nombre_usuario, hash_contrasena, rol_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id_usuario`,
          [nombres, apellidos, cedula, correo, telefono || null, cedula, hash, rol_id]
        );

        await client.query(
          `INSERT INTO estudiantes (usuario_id, carrera, matricula) VALUES ($1, $2, $3)`,
          [usuarioInsert.rows[0].id_usuario, carrera, matricula]
        );

        await client.query('COMMIT');

        cedulasVistas.add(cedula);
        correosVistos.add(correoLower);
        matriculasVistas.add(matricula);
        reporte.exitosos++;
      } catch (errFila) {
        await client.query('ROLLBACK');
        reporte.errores.push({ fila: numFila, motivo: errFila.message || 'Error al insertar' });
      }
    }
  } finally {
    client.release();
  }

  return reporte;
}

module.exports = {
  listar, obtenerPorId, registrar, editar, desactivar, importarDesdeExcel,
};
