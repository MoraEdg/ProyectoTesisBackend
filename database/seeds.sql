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
  ('Prácticas Preprofesionales', 'Proceso de prácticas en empresa: 3 hitos con convenio, 4 sin convenio', TRUE),
  ('Reconocimiento Laboral',     'Reconocimiento de experiencia laboral previa con 1 hito',               TRUE),
  ('Convalidación',              'Convalidación de materias por experiencia profesional con 1 hito',       TRUE);

-- ─── TIPOS DE CONVENIO ────────────────────────────────────────────────────────
INSERT INTO tipos_convenio (nombre, descripcion) VALUES
  ('PRIVADO', 'Convenio con entidad privada'),
  ('PÚBLICO', 'Convenio con entidad pública o estatal');

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

-- Prácticas Preprofesionales — 4 hitos máx. (1 SIN_CONVENIO + 3 TODOS)
INSERT INTO plantillas_hito (tipo_proceso_id, orden, nombre, rol_responsable_id, condicion_convenio) VALUES
  (
    (SELECT id FROM tipos_proceso WHERE nombre = 'Prácticas Preprofesionales'),
    0, 'Carta de Intención',
    (SELECT id FROM roles WHERE nombre_rol = 'Coordinador'),
    'SIN_CONVENIO'
  ),
  (
    (SELECT id FROM tipos_proceso WHERE nombre = 'Prácticas Preprofesionales'),
    1, 'Formalización',
    (SELECT id FROM roles WHERE nombre_rol = 'Coordinador'),
    'TODOS'
  ),
  (
    (SELECT id FROM tipos_proceso WHERE nombre = 'Prácticas Preprofesionales'),
    2, 'Seguimiento',
    (SELECT id FROM roles WHERE nombre_rol = 'Coordinador'),
    'TODOS'
  ),
  (
    (SELECT id FROM tipos_proceso WHERE nombre = 'Prácticas Preprofesionales'),
    3, 'Finalización',
    (SELECT id FROM roles WHERE nombre_rol = 'Coordinador'),
    'TODOS'
  );

-- Reconocimiento Laboral — 1 hito
INSERT INTO plantillas_hito (tipo_proceso_id, orden, nombre, rol_responsable_id, condicion_convenio) VALUES
  (
    (SELECT id FROM tipos_proceso WHERE nombre = 'Reconocimiento Laboral'),
    1, 'Solicitud de Reconocimiento',
    (SELECT id FROM roles WHERE nombre_rol = 'Coordinador'),
    'TODOS'
  );

-- Convalidación — 1 hito
INSERT INTO plantillas_hito (tipo_proceso_id, orden, nombre, rol_responsable_id, condicion_convenio) VALUES
  (
    (SELECT id FROM tipos_proceso WHERE nombre = 'Convalidación'),
    1, 'Solicitud de Convalidación',
    (SELECT id FROM roles WHERE nombre_rol = 'Coordinador'),
    'TODOS'
  );

-- ─── TIPOS DE DOCUMENTO (ligados a cada plantilla de hito) ────────────────────
-- Cada hito define qué documentos debe subir el estudiante.

-- PP Hito 0 — Carta de Intención (solo empresas SIN convenio)
INSERT INTO tipos_documento (plantilla_hito_id, nombre, extension_permitida, tamano_maximo_mb, obligatorio) VALUES
  (
    (SELECT ph.id FROM plantillas_hito ph
     JOIN tipos_proceso tp ON ph.tipo_proceso_id = tp.id
     WHERE tp.nombre = 'Prácticas Preprofesionales' AND ph.orden = 0),
    'Carta de Intención (Empresa sin Convenio)', '.pdf', 10, TRUE
  );

-- PP Hito 1 — Formalización (nombre oficial congelado)
INSERT INTO tipos_documento (plantilla_hito_id, nombre, extension_permitida, tamano_maximo_mb, obligatorio) VALUES
  (
    (SELECT ph.id FROM plantillas_hito ph
     JOIN tipos_proceso tp ON ph.tipo_proceso_id = tp.id
     WHERE tp.nombre = 'Prácticas Preprofesionales' AND ph.orden = 1),
    'FPP2 (Carta de Formalización)', '.pdf', 10, TRUE
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

-- Conv Hito 1 — Solicitud de Convalidación
INSERT INTO tipos_documento (plantilla_hito_id, nombre, extension_permitida, tamano_maximo_mb, obligatorio) VALUES
  (
    (SELECT ph.id FROM plantillas_hito ph
     JOIN tipos_proceso tp ON ph.tipo_proceso_id = tp.id
     WHERE tp.nombre = 'Convalidación' AND ph.orden = 1),
    'Solicitud de Convalidación', '.pdf,.docx', 10, TRUE
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

-- ─── CONVENIOS INSTITUCIONALES ────────────────────────────────────────────────
-- Datos reales de convenios de la UISEK para demostración del módulo.

-- Convenio 1 — Abbott Laboratorios del Ecuador
INSERT INTO convenios (
  tipo_convenio_id, codigo_convenio, institucion, descripcion,
  responsable_institucion, direccion, correo_contacto, telefono_contacto,
  otorgado_para, anio, fecha_firma, fecha_finalizacion, duracion,
  estado_id, proponente_universidad, posee_archivo_fisico, posee_archivo_digital
) VALUES (
  (SELECT id FROM tipos_convenio WHERE nombre = 'PRIVADO'),
  'DRII-021-2021',
  'Abbott Laboratorios del Ecuador',
  'Convenio específico para desarrollar pasantías, prácticas pre profesionales y ofertas laborables',
  'Fanny Hurtado L.',
  'República de El Salvador N34-493 y Portugal',
  'fanny.hurtado@abbott.com',
  '3992549',
  'Articular las capacidades y realizar acciones institucionales conjuntas que permitan la ejecución de programas y proyectos específicos para fomentar el emprendimiento e innovación',
  2021, '2021-03-02', '2022-03-02',
  '1 año // renovación automática por el mismo periodo',
  (SELECT id FROM estados WHERE nombre = 'CADUCADO' AND categoria = 'CONVENIO'),
  'La empresa solicitó el convenio',
  FALSE, TRUE
);

-- Convenio 2 — Agencia Nacional de Tránsito (ANT)
INSERT INTO convenios (
  tipo_convenio_id, codigo_convenio, institucion, descripcion,
  responsable_institucion, direccion, correo_contacto, telefono_contacto,
  otorgado_para, anio, fecha_firma, fecha_finalizacion, duracion,
  estado_id, proponente_universidad, posee_archivo_fisico, posee_archivo_digital
) VALUES (
  (SELECT id FROM tipos_convenio WHERE nombre = 'PÚBLICO'),
  'PPP-004-2023',
  'Agencia Nacional de Regulación y Control del Transporte Terrestre, Tránsito y Seguridad Vial (ANRCTTTSV)',
  'Convenio específico para desarrollar pasantías, prácticas pre profesionales y ofertas laborables',
  'Hernán Pontón (Subdirector de la ANT)',
  'Av. Antonio José de Sucre y José Sánchez',
  'practicas.ant@gmail.com; cristina.bustos@ant.gob.ec; hernan.ponton@ant.gob.ec',
  '023828890 ext.2420',
  'Desarrollo de PPP para las carreras de grado de la UISEK',
  2023, '2023-01-12', '2029-01-12',
  '3 años // renovación mediante comunicación escrita con al menos treinta (30) días previos a la terminación',
  (SELECT id FROM estados WHERE nombre = 'VIGENTE' AND categoria = 'CONVENIO'),
  'Dirección de Relaciones Internacionales e Interinstitucionales',
  FALSE, TRUE
);

-- Convenio 3 — Agrocomercial Gloclaface Cía. Ltda.
INSERT INTO convenios (
  tipo_convenio_id, codigo_convenio, institucion, descripcion,
  responsable_institucion, direccion, correo_contacto, telefono_contacto,
  otorgado_para, anio, fecha_firma, fecha_finalizacion, duracion,
  estado_id, proponente_universidad, posee_archivo_fisico, posee_archivo_digital
) VALUES (
  (SELECT id FROM tipos_convenio WHERE nombre = 'PRIVADO'),
  'DRII-002-2021',
  'Agrocomercial Gloclaface Cía. Ltda.',
  'Convenio específico para desarrollar pasantías, prácticas pre profesionales y ofertas laborables',
  'Gerente General',
  'Vicente Rocafuerte E1-79 y Cacha',
  'gerencia@agrocomercialgloclaface.com.ec',
  '2063554',
  'Articular las capacidades y realizar acciones institucionales conjuntas que permitan la ejecución de programas y proyectos específicos para fomentar el emprendimiento e innovación',
  2020, '2020-01-05', '2021-01-05',
  '1 año // renovación automática por el mismo periodo',
  (SELECT id FROM estados WHERE nombre = 'CADUCADO' AND categoria = 'CONVENIO'),
  NULL,
  FALSE, TRUE
);

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

-- ─── PERMISOS RBAC ────────────────────────────────────────────────────────────
-- Catálogo de 33 funcionalidades + matriz inicial por rol.
-- Ejecutar DESPUÉS del bloque de usuarios (depende de roles ya insertados).

INSERT INTO funcionalidades (modulo, accion, clave, descripcion) VALUES

  -- Módulo: catalogos
  ('catalogos', 'ver_roles',              'catalogos.ver_roles',
   'Ver listado de roles del sistema'),
  ('catalogos', 'ver_tipos_convenio',     'catalogos.ver_tipos_convenio',
   'Ver tipos de convenio disponibles'),
  ('catalogos', 'ver_tipos_doc_generado', 'catalogos.ver_tipos_doc_generado',
   'Ver tipos de documentos generados disponibles'),

  -- Módulo: estudiantes
  ('estudiantes', 'listar',     'estudiantes.listar',     'Ver listado de estudiantes'),
  ('estudiantes', 'ver',        'estudiantes.ver',        'Ver detalle de un estudiante'),
  ('estudiantes', 'crear',      'estudiantes.crear',      'Registrar un nuevo estudiante'),
  ('estudiantes', 'editar',     'estudiantes.editar',     'Editar datos de un estudiante existente'),
  ('estudiantes', 'desactivar', 'estudiantes.desactivar', 'Desactivar un estudiante en el sistema'),
  ('estudiantes', 'importar',   'estudiantes.importar',   'Importar estudiantes desde archivo Excel'),

  -- Módulo: tramites
  ('tramites', 'crear',              'tramites.crear',              'Crear un nuevo trámite'),
  ('tramites', 'cambiar_estado',     'tramites.cambiar_estado',     'Cambiar el estado de un trámite'),
  ('tramites', 'cerrar',             'tramites.cerrar',             'Cerrar formalmente un trámite'),
  ('tramites', 'generar_documento',  'tramites.generar_documento',  'Generar documentos Word a partir de plantillas'),
  ('tramites', 'ver_docs_generados', 'tramites.ver_docs_generados', 'Ver documentos generados de un trámite'),
  ('tramites', 'listar',             'tramites.listar',             'Ver listado de trámites (el alcance depende del rol)'),
  ('tramites', 'ver',                'tramites.ver',                'Ver detalle de un trámite (el acceso depende de propiedad)'),
  ('tramites', 'ver_historial',      'tramites.ver_historial',      'Ver historial de estados de un trámite'),

  -- Módulo: hitos
  ('hitos', 'cambiar_estado', 'hitos.cambiar_estado', 'Cambiar el estado de un hito'),
  ('hitos', 'ver',            'hitos.ver',            'Ver detalle de un hito o listar hitos de un trámite'),
  ('hitos', 'ver_historial',  'hitos.ver_historial',  'Ver historial de estados de un hito'),

  -- Módulo: documentos
  ('documentos', 'aprobar',           'documentos.aprobar',           'Aprobar un documento subido'),
  ('documentos', 'observar',          'documentos.observar',          'Emitir una observación sobre un documento'),
  ('documentos', 'subir',             'documentos.subir',             'Subir un documento a un hito'),
  ('documentos', 'ver',               'documentos.ver',               'Ver detalle o listar documentos de un hito'),
  ('documentos', 'descargar',         'documentos.descargar',         'Descargar un documento del sistema'),
  ('documentos', 'ver_observaciones', 'documentos.ver_observaciones', 'Ver las observaciones emitidas sobre un documento'),

  -- Módulo: generacion
  ('generacion', 'ver_tipos', 'generacion.ver_tipos', 'Ver tipos de documentos generables'),
  ('generacion', 'descargar', 'generacion.descargar', 'Descargar un documento generado'),

  -- Módulo: reportes
  ('reportes', 'dashboard',     'reportes.dashboard',     'Ver el dashboard con estadísticas del sistema'),
  ('reportes', 'planificacion', 'reportes.planificacion', 'Ver el reporte de planificación académica'),

  -- Módulo: convenios
  ('convenios', 'ver_lista',            'convenios.ver_lista',
   'Ver el listado de convenios institucionales'),
  ('convenios', 'ver_detalle_sensible', 'convenios.ver_detalle_sensible',
   'Ver campos sensibles del convenio: contacto, dirección, observaciones'),

  -- Módulo: settings
  ('settings', 'administrar', 'settings.administrar',
   'Administrar la matriz de permisos del sistema');


-- ── Coordinador — acceso completo al sistema operativo ───────────────────────
INSERT INTO roles_funcionalidades (rol_id, funcionalidad_id, habilitado)
SELECT
    (SELECT id FROM roles WHERE nombre_rol = 'Coordinador'),
    f.id,
    TRUE
FROM funcionalidades f
WHERE f.clave IN (
    'catalogos.ver_roles', 'catalogos.ver_tipos_convenio', 'catalogos.ver_tipos_doc_generado',
    'estudiantes.listar', 'estudiantes.ver', 'estudiantes.crear',
    'estudiantes.editar', 'estudiantes.desactivar', 'estudiantes.importar',
    'tramites.crear', 'tramites.cambiar_estado', 'tramites.cerrar',
    'tramites.generar_documento', 'tramites.ver_docs_generados',
    'tramites.listar', 'tramites.ver', 'tramites.ver_historial',
    'hitos.cambiar_estado', 'hitos.ver', 'hitos.ver_historial',
    'documentos.aprobar', 'documentos.observar', 'documentos.subir',
    'documentos.ver', 'documentos.descargar', 'documentos.ver_observaciones',
    'generacion.ver_tipos', 'generacion.descargar',
    'reportes.dashboard', 'reportes.planificacion',
    'convenios.ver_lista', 'convenios.ver_detalle_sensible',
    'settings.administrar'
);


-- ── Estudiante — acceso a sus propios trámites y documentos ──────────────────
INSERT INTO roles_funcionalidades (rol_id, funcionalidad_id, habilitado)
SELECT
    (SELECT id FROM roles WHERE nombre_rol = 'Estudiante'),
    f.id,
    TRUE
FROM funcionalidades f
WHERE f.clave IN (
    'catalogos.ver_tipos_doc_generado',
    'tramites.listar', 'tramites.ver', 'tramites.ver_historial',
    'hitos.ver', 'hitos.ver_historial',
    'documentos.subir', 'documentos.ver', 'documentos.descargar',
    'documentos.ver_observaciones',
    'convenios.ver_lista'
);


-- ── Director — consulta de convenios y catálogo tipos-convenio ────────────────
-- (D-ROLES-FUT = A: sin acceso frontend por ahora)
INSERT INTO roles_funcionalidades (rol_id, funcionalidad_id, habilitado)
SELECT
    (SELECT id FROM roles WHERE nombre_rol = 'Director'),
    f.id,
    TRUE
FROM funcionalidades f
WHERE f.clave IN (
    'catalogos.ver_tipos_convenio',
    'convenios.ver_lista',
    'convenios.ver_detalle_sensible'
);


-- ── Decano — consulta de convenios ───────────────────────────────────────────
-- (D-ROLES-FUT = A: sin acceso frontend por ahora)
INSERT INTO roles_funcionalidades (rol_id, funcionalidad_id, habilitado)
SELECT
    (SELECT id FROM roles WHERE nombre_rol = 'Decano'),
    f.id,
    TRUE
FROM funcionalidades f
WHERE f.clave IN (
    'convenios.ver_lista',
    'convenios.ver_detalle_sensible'
);
