-- ============================================================
-- SEEDS — Datos iniciales del sistema
-- Ejecutar DESPUÉS de schema.sql
-- ============================================================

-- ─── ROLES ────────────────────────────────────────────────────────────────────
INSERT INTO roles (nombre_rol, descripcion) VALUES
  ('Estudiante',  'Inicia trámites, sube documentos, descarga cartas'),
  ('Coordinador', 'Gestiona el proceso completo, convenios y genera documentos'),
  ('Director',    'Revisa y aprueba etapas específicas, consulta convenios'),
  ('Decano',      'Aprueba y firma la etapa final de cierre');

-- ─── ESTADOS ──────────────────────────────────────────────────────────────────

-- TRAMITE (6)
INSERT INTO estados (nombre, categoria, descripcion) VALUES
  ('INICIADO',    'TRAMITE', 'Trámite recién creado por el estudiante'),
  ('EN_REVISION', 'TRAMITE', 'Documentos recibidos, en proceso de revisión'),
  ('OBSERVADO',   'TRAMITE', 'Se requieren correcciones por parte del estudiante'),
  ('CORREGIDO',   'TRAMITE', 'Estudiante subió documentos corregidos'),
  ('APROBADO',    'TRAMITE', 'Todos los hitos aprobados'),
  ('FINALIZADO',  'TRAMITE', 'Trámite cerrado formalmente');

-- HITO (4)
INSERT INTO estados (nombre, categoria, descripcion) VALUES
  ('PENDIENTE',   'HITO', 'Hito aún no iniciado'),
  ('EN_REVISION', 'HITO', 'Documentos del hito en revisión'),
  ('OBSERVADO',   'HITO', 'Hito con documentos observados'),
  ('APROBADO',    'HITO', 'Todos los documentos del hito aprobados');

-- DOCUMENTO (5)
INSERT INTO estados (nombre, categoria, descripcion) VALUES
  ('SUBIDO',      'DOCUMENTO', 'Documento subido por el estudiante'),
  ('EN_REVISION', 'DOCUMENTO', 'Documento en proceso de revisión'),
  ('OBSERVADO',   'DOCUMENTO', 'Documento observado, requiere reemplazo'),
  ('APROBADO',    'DOCUMENTO', 'Documento aprobado por el responsable'),
  ('REEMPLAZADO', 'DOCUMENTO', 'Versión anterior reemplazada por nueva versión');

-- CONVENIO (5)
INSERT INTO estados (nombre, categoria, descripcion) VALUES
  ('EN_PROCESO', 'CONVENIO', 'Convenio en trámite de firma'),
  ('VIGENTE',    'CONVENIO', 'Convenio activo y vigente'),
  ('SUSPENDIDO', 'CONVENIO', 'Convenio temporalmente suspendido'),
  ('FINALIZADO', 'CONVENIO', 'Convenio concluido normalmente'),
  ('CADUCADO',   'CONVENIO', 'Convenio vencido por fecha o incumplimiento');
-- Total: 20 estados

-- ─── TIPOS DE PROCESO ─────────────────────────────────────────────────────────
INSERT INTO tipos_proceso (nombre, descripcion, activo) VALUES
  ('Prácticas Preprofesionales', 'Proceso de prácticas en empresa con 5 hitos',                  TRUE),
  ('Reconocimiento Laboral',     'Reconocimiento de experiencia laboral previa con 2 hitos',     TRUE),
  ('Convalidación',              'Convalidación de materias por experiencia profesional con 2 hitos', TRUE);

-- ─── TIPOS DE CONVENIO ────────────────────────────────────────────────────────
INSERT INTO tipos_convenio (nombre, descripcion) VALUES
  ('Marco',      'Convenio general de cooperación interinstitucional'),
  ('Específico', 'Convenio para una carrera o programa específico'),
  ('Pasantías',  'Convenio exclusivo para prácticas preprofesionales');

-- ─── PERIODOS ─────────────────────────────────────────────────────────────────
INSERT INTO periodos (nombre_periodo, fecha_inicio, fecha_fin, activo) VALUES
  ('2025-2', '2025-09-01', '2026-02-28', FALSE),
  ('2026-1', '2026-03-01', '2026-08-31', TRUE);

-- ─── TIPOS DE DOCUMENTO GENERADO ──────────────────────────────────────────────
-- 4 tipos definitivos del levantamiento (Sprint 6)
INSERT INTO tipos_documento_generado (id, nombre) VALUES
  (1, 'Carta de Formalizacion (Empresa con Convenio)'),
  (2, 'Carta de Formalizacion (Empresa sin Convenio)'),
  (3, 'Carta de Peticion'),
  (4, 'FPP3 - Formato de Seguimiento');

SELECT setval(pg_get_serial_sequence('tipos_documento_generado', 'id'), 4);

-- ─── PLANTILLAS DE HITO ───────────────────────────────────────────────────────

-- Prácticas Preprofesionales — 3 hitos (decisión #2, validada con el Coordinador)
INSERT INTO plantillas_hito (tipo_proceso_id, orden, nombre, rol_responsable_id) VALUES
  (
    (SELECT id FROM tipos_proceso WHERE nombre = 'Prácticas Preprofesionales'),
    1, 'Formalización',
    (SELECT id FROM roles WHERE nombre_rol = 'Coordinador')
  ),
  (
    (SELECT id FROM tipos_proceso WHERE nombre = 'Prácticas Preprofesionales'),
    2, 'Seguimiento',
    (SELECT id FROM roles WHERE nombre_rol = 'Coordinador')
  ),
  (
    (SELECT id FROM tipos_proceso WHERE nombre = 'Prácticas Preprofesionales'),
    3, 'Finalización',
    (SELECT id FROM roles WHERE nombre_rol = 'Coordinador')
  );

-- Reconocimiento Laboral — 2 hitos
INSERT INTO plantillas_hito (tipo_proceso_id, orden, nombre, rol_responsable_id) VALUES
  (
    (SELECT id FROM tipos_proceso WHERE nombre = 'Reconocimiento Laboral'),
    1, 'Solicitud de Reconocimiento',
    (SELECT id FROM roles WHERE nombre_rol = 'Coordinador')
  ),
  (
    (SELECT id FROM tipos_proceso WHERE nombre = 'Reconocimiento Laboral'),
    2, 'Resolución de Reconocimiento',
    (SELECT id FROM roles WHERE nombre_rol = 'Coordinador')
  );

-- Convalidación — 2 hitos
INSERT INTO plantillas_hito (tipo_proceso_id, orden, nombre, rol_responsable_id) VALUES
  (
    (SELECT id FROM tipos_proceso WHERE nombre = 'Convalidación'),
    1, 'Solicitud de Convalidación',
    (SELECT id FROM roles WHERE nombre_rol = 'Coordinador')
  ),
  (
    (SELECT id FROM tipos_proceso WHERE nombre = 'Convalidación'),
    2, 'Resolución de Convalidación',
    (SELECT id FROM roles WHERE nombre_rol = 'Coordinador')
  );

-- ─── TIPOS DE DOCUMENTO (ligados a cada plantilla de hito) ────────────────────
-- Cada hito define qué documentos debe subir el estudiante.

-- PP Hito 1 — Formalización (nombre oficial congelado)
INSERT INTO tipos_documento (plantilla_hito_id, nombre, extension_permitida, tamano_maximo_mb, obligatorio) VALUES
  (
    (SELECT ph.id FROM plantillas_hito ph
     JOIN tipos_proceso tp ON ph.tipo_proceso_id = tp.id
     WHERE tp.nombre = 'Prácticas Preprofesionales' AND ph.orden = 1),
    'Carta de Intención (Aceptación de Empresa)', '.pdf', 10, TRUE
  );

-- PP Hito 2 — Seguimiento (nombre oficial congelado)
INSERT INTO tipos_documento (plantilla_hito_id, nombre, extension_permitida, tamano_maximo_mb, obligatorio) VALUES
  (
    (SELECT ph.id FROM plantillas_hito ph
     JOIN tipos_proceso tp ON ph.tipo_proceso_id = tp.id
     WHERE tp.nombre = 'Prácticas Preprofesionales' AND ph.orden = 2),
    'FPP3 - Seguimiento de Prácticas (Firmado)', '.pdf', 10, TRUE
  );

-- PP Hito 3 — Finalización (nombre oficial congelado)
INSERT INTO tipos_documento (plantilla_hito_id, nombre, extension_permitida, tamano_maximo_mb, obligatorio) VALUES
  (
    (SELECT ph.id FROM plantillas_hito ph
     JOIN tipos_proceso tp ON ph.tipo_proceso_id = tp.id
     WHERE tp.nombre = 'Prácticas Preprofesionales' AND ph.orden = 3),
    'Certificado de Culminación de Prácticas (Empresa)', '.pdf', 10, TRUE
  );

-- RL Hito 1 — Solicitud de Reconocimiento
INSERT INTO tipos_documento (plantilla_hito_id, nombre, extension_permitida, tamano_maximo_mb, obligatorio) VALUES
  (
    (SELECT ph.id FROM plantillas_hito ph
     JOIN tipos_proceso tp ON ph.tipo_proceso_id = tp.id
     WHERE tp.nombre = 'Reconocimiento Laboral' AND ph.orden = 1),
    'Solicitud de Reconocimiento Laboral', '.pdf,.docx', 10, TRUE
  );

-- RL Hito 2 — Resolución de Reconocimiento
INSERT INTO tipos_documento (plantilla_hito_id, nombre, extension_permitida, tamano_maximo_mb, obligatorio) VALUES
  (
    (SELECT ph.id FROM plantillas_hito ph
     JOIN tipos_proceso tp ON ph.tipo_proceso_id = tp.id
     WHERE tp.nombre = 'Reconocimiento Laboral' AND ph.orden = 2),
    'Resolución de Reconocimiento Laboral', '.pdf', 10, TRUE
  );

-- Conv Hito 1 — Solicitud de Convalidación
INSERT INTO tipos_documento (plantilla_hito_id, nombre, extension_permitida, tamano_maximo_mb, obligatorio) VALUES
  (
    (SELECT ph.id FROM plantillas_hito ph
     JOIN tipos_proceso tp ON ph.tipo_proceso_id = tp.id
     WHERE tp.nombre = 'Convalidación' AND ph.orden = 1),
    'Solicitud de Convalidación', '.pdf,.docx', 10, TRUE
  );

-- Conv Hito 2 — Resolución de Convalidación
INSERT INTO tipos_documento (plantilla_hito_id, nombre, extension_permitida, tamano_maximo_mb, obligatorio) VALUES
  (
    (SELECT ph.id FROM plantillas_hito ph
     JOIN tipos_proceso tp ON ph.tipo_proceso_id = tp.id
     WHERE tp.nombre = 'Convalidación' AND ph.orden = 2),
    'Resolución de Convalidación', '.pdf', 10, TRUE
  );

-- ─── PLANTILLAS DE DOCUMENTO (para generación automática de cartas) ───────────
-- Rutas relativas desde la raiz del backend (portabilidad entre entornos).
INSERT INTO plantillas_documento (tipo_documento_generado_id, nombre, descripcion, ruta_archivo, activa) VALUES
  (1, 'FPP2 con convenio',
      'Carta de formalizacion para empresas con convenio vigente',
      'plantillas/fpp2_con_convenio.docx', TRUE),
  (2, 'FPP2 sin convenio',
      'Carta de formalizacion para empresas sin convenio',
      'plantillas/fpp2_sin_convenio.docx', TRUE),
  (3, 'Carta de Peticion',
      'Carta de peticion a solicitud de la empresa (opcional)',
      'plantillas/carta_peticion.docx', TRUE),
  (4, 'FPP3 plantilla',
      'Formato de seguimiento vacio para llenar y firmar manualmente',
      'plantillas/fpp3.docx', TRUE);

-- ─── USUARIO ADMINISTRADOR (Coordinador de prueba) ───────────────────────────
-- Contraseña: Admin1234 (hash bcrypt cost 10)
INSERT INTO usuarios
  (nombres, apellidos, cedula, correo, nombre_usuario, hash_contrasena, rol_id)
VALUES (
  'Admin',
  'Coordinador',
  '0000000000',
  'admin@uisek.edu.ec',
  'admin',
  '$2b$10$zLVpe8OKod3Ookc9v7k1I.weAZ5wrlLy7AubjIhM.lRPStKwWvA86',
  (SELECT id FROM roles WHERE nombre_rol = 'Coordinador')
);
