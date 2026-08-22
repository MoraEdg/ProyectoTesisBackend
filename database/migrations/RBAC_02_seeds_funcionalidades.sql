-- ============================================================
-- MIGRACIÓN RBAC_02 — Catálogo inicial de funcionalidades
--                     y matriz de permisos por rol
-- Sistema de Gestión de Prácticas Preprofesionales — UISEK
--
-- EJECUTAR DESPUÉS de RBAC_01_permisos_dinamicos.sql
--
-- PRINCIPIO: reproducir exactamente el comportamiento actual
-- antes de que se retiren los middleware roles().
-- Toda clave aquí corresponde a un endpoint real auditado.
-- ============================================================

-- ─── CATÁLOGO DE FUNCIONALIDADES (33 funcionalidades) ────────────────────────

INSERT INTO funcionalidades (modulo, accion, clave, descripcion) VALUES

  -- Módulo: catalogos
  ('catalogos', 'ver_roles',              'catalogos.ver_roles',
   'Ver listado de roles del sistema'),
  ('catalogos', 'ver_tipos_convenio',     'catalogos.ver_tipos_convenio',
   'Ver tipos de convenio disponibles'),
  ('catalogos', 'ver_tipos_doc_generado', 'catalogos.ver_tipos_doc_generado',
   'Ver tipos de documentos generados disponibles'),

  -- Módulo: estudiantes
  ('estudiantes', 'listar',     'estudiantes.listar',
   'Ver listado de estudiantes'),
  ('estudiantes', 'ver',        'estudiantes.ver',
   'Ver detalle de un estudiante'),
  ('estudiantes', 'crear',      'estudiantes.crear',
   'Registrar un nuevo estudiante'),
  ('estudiantes', 'editar',     'estudiantes.editar',
   'Editar datos de un estudiante existente'),
  ('estudiantes', 'desactivar', 'estudiantes.desactivar',
   'Desactivar un estudiante en el sistema'),
  ('estudiantes', 'importar',   'estudiantes.importar',
   'Importar estudiantes desde archivo Excel'),

  -- Módulo: tramites
  ('tramites', 'crear',              'tramites.crear',
   'Crear un nuevo trámite'),
  ('tramites', 'cambiar_estado',     'tramites.cambiar_estado',
   'Cambiar el estado de un trámite'),
  ('tramites', 'cerrar',             'tramites.cerrar',
   'Cerrar formalmente un trámite'),
  ('tramites', 'generar_documento',  'tramites.generar_documento',
   'Generar documentos Word a partir de plantillas'),
  ('tramites', 'ver_docs_generados', 'tramites.ver_docs_generados',
   'Ver documentos generados de un trámite'),
  ('tramites', 'listar',             'tramites.listar',
   'Ver listado de trámites (el alcance depende del rol)'),
  ('tramites', 'ver',                'tramites.ver',
   'Ver detalle de un trámite (el acceso depende de propiedad)'),
  ('tramites', 'ver_historial',      'tramites.ver_historial',
   'Ver historial de estados de un trámite'),

  -- Módulo: hitos
  ('hitos', 'cambiar_estado', 'hitos.cambiar_estado',
   'Cambiar el estado de un hito'),
  ('hitos', 'ver',            'hitos.ver',
   'Ver detalle de un hito o listar hitos de un trámite'),
  ('hitos', 'ver_historial',  'hitos.ver_historial',
   'Ver historial de estados de un hito'),

  -- Módulo: documentos
  ('documentos', 'aprobar',           'documentos.aprobar',
   'Aprobar un documento subido'),
  ('documentos', 'observar',          'documentos.observar',
   'Emitir una observación sobre un documento'),
  ('documentos', 'subir',             'documentos.subir',
   'Subir un documento a un hito'),
  ('documentos', 'ver',               'documentos.ver',
   'Ver detalle o listar documentos de un hito'),
  ('documentos', 'descargar',         'documentos.descargar',
   'Descargar un documento del sistema'),
  ('documentos', 'ver_observaciones', 'documentos.ver_observaciones',
   'Ver las observaciones emitidas sobre un documento'),

  -- Módulo: generacion
  ('generacion', 'ver_tipos',  'generacion.ver_tipos',
   'Ver tipos de documentos generables'),
  ('generacion', 'descargar',  'generacion.descargar',
   'Descargar un documento generado'),

  -- Módulo: reportes
  ('reportes', 'dashboard',    'reportes.dashboard',
   'Ver el dashboard con estadísticas del sistema'),
  ('reportes', 'planificacion','reportes.planificacion',
   'Ver el reporte de planificación académica'),

  -- Módulo: convenios
  ('convenios', 'ver_lista',           'convenios.ver_lista',
   'Ver el listado de convenios institucionales'),
  ('convenios', 'ver_detalle_sensible','convenios.ver_detalle_sensible',
   'Ver campos sensibles del convenio: contacto, dirección, observaciones'),

  -- Módulo: settings
  ('settings', 'administrar', 'settings.administrar',
   'Administrar la matriz de permisos del sistema');


-- ─── MATRIZ INICIAL DE PERMISOS ──────────────────────────────────────────────
-- Los IDs se obtienen por nombre para evitar depender del orden de inserción.
-- Reproduce el comportamiento de los middleware roles() actuales
-- más los nuevos permisos definidos en las decisiones (D-CONV-SENS, D-ADMIN).

-- ── Coordinador ──────────────────────────────────────────────────────────────
-- Tiene acceso a la totalidad del sistema operativo,
-- incluyendo Settings y campos sensibles de convenios.

INSERT INTO roles_funcionalidades (rol_id, funcionalidad_id, habilitado)
SELECT
    (SELECT id FROM roles WHERE nombre_rol = 'Coordinador'),
    f.id,
    TRUE
FROM funcionalidades f
WHERE f.clave IN (
    -- Catálogos
    'catalogos.ver_roles',
    'catalogos.ver_tipos_convenio',
    'catalogos.ver_tipos_doc_generado',
    -- Estudiantes
    'estudiantes.listar',
    'estudiantes.ver',
    'estudiantes.crear',
    'estudiantes.editar',
    'estudiantes.desactivar',
    'estudiantes.importar',
    -- Trámites
    'tramites.crear',
    'tramites.cambiar_estado',
    'tramites.cerrar',
    'tramites.generar_documento',
    'tramites.ver_docs_generados',
    'tramites.listar',
    'tramites.ver',
    'tramites.ver_historial',
    -- Hitos
    'hitos.cambiar_estado',
    'hitos.ver',
    'hitos.ver_historial',
    -- Documentos
    'documentos.aprobar',
    'documentos.observar',
    'documentos.subir',
    'documentos.ver',
    'documentos.descargar',
    'documentos.ver_observaciones',
    -- Generación
    'generacion.ver_tipos',
    'generacion.descargar',
    -- Reportes
    'reportes.dashboard',
    'reportes.planificacion',
    -- Convenios
    'convenios.ver_lista',
    'convenios.ver_detalle_sensible',
    -- Settings
    'settings.administrar'
);


-- ── Estudiante ────────────────────────────────────────────────────────────────
-- Acceso a sus propios trámites y documentos.
-- NO tiene acceso a campos sensibles de convenios ni a Settings.
-- El scoping (ver solo sus trámites) lo controla el controller, no este permiso.

INSERT INTO roles_funcionalidades (rol_id, funcionalidad_id, habilitado)
SELECT
    (SELECT id FROM roles WHERE nombre_rol = 'Estudiante'),
    f.id,
    TRUE
FROM funcionalidades f
WHERE f.clave IN (
    -- Catálogos (solo el que necesita para generar documentos)
    'catalogos.ver_tipos_doc_generado',
    -- Trámites
    'tramites.listar',
    'tramites.ver',
    'tramites.ver_historial',
    -- Hitos
    'hitos.ver',
    'hitos.ver_historial',
    -- Documentos
    'documentos.subir',
    'documentos.ver',
    'documentos.descargar',
    'documentos.ver_observaciones',
    -- Convenios (lista básica, sin campos sensibles)
    'convenios.ver_lista'
);


-- ── Director ──────────────────────────────────────────────────────────────────
-- Permiso backend ya existente: GET /catalogos/tipos-convenio
-- (preservado desde roles('Coordinador','Director') — riesgo R-1 mitigado)
-- Acceso a campos sensibles de convenios (D-CONV-SENS).
-- No tiene acceso al frontend todavía (D-ROLES-FUT = A).

INSERT INTO roles_funcionalidades (rol_id, funcionalidad_id, habilitado)
SELECT
    (SELECT id FROM roles WHERE nombre_rol = 'Director'),
    f.id,
    TRUE
FROM funcionalidades f
WHERE f.clave IN (
    'catalogos.ver_tipos_convenio',    -- permiso backend existente — NO eliminar
    'convenios.ver_lista',             -- auth-only actual — mantener acceso
    'convenios.ver_detalle_sensible'   -- D-CONV-SENS: Director ve campos sensibles
);


-- ── Decano ────────────────────────────────────────────────────────────────────
-- Sin permisos backend previos en roles().
-- Acceso a campos sensibles de convenios (D-CONV-SENS).
-- No tiene acceso al frontend todavía (D-ROLES-FUT = A).

INSERT INTO roles_funcionalidades (rol_id, funcionalidad_id, habilitado)
SELECT
    (SELECT id FROM roles WHERE nombre_rol = 'Decano'),
    f.id,
    TRUE
FROM funcionalidades f
WHERE f.clave IN (
    'convenios.ver_lista',             -- auth-only actual — mantener acceso
    'convenios.ver_detalle_sensible'   -- D-CONV-SENS: Decano ve campos sensibles
);
