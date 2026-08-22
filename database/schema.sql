-- ============================================================
-- SISTEMA DE GESTIÓN DE PRÁCTICAS PREPROFESIONALES — UISEK
-- Esquema oficial — versión revisada 4 de junio de 2026
-- Requiere: PostgreSQL 15+, extensión pgcrypto
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── CATÁLOGOS ────────────────────────────────────────────────────────────────

CREATE TABLE roles (
    id          SERIAL PRIMARY KEY,
    nombre_rol  VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE estados (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(50) NOT NULL,
    categoria   VARCHAR(50) NOT NULL,
    descripcion TEXT,
    CONSTRAINT uq_estado UNIQUE(nombre, categoria)
);

CREATE TABLE tipos_proceso (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activo      BOOLEAN DEFAULT TRUE
);

CREATE TABLE periodos (
    id             SERIAL PRIMARY KEY,
    nombre_periodo VARCHAR(20)  NOT NULL UNIQUE,
    fecha_inicio   DATE         NOT NULL,
    fecha_fin      DATE         NOT NULL,
    activo         BOOLEAN      DEFAULT TRUE,
    created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tipos_convenio (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT
);

-- ─── CONFIGURACIÓN DE FLUJOS ──────────────────────────────────────────────────

CREATE TABLE plantillas_hito (
    id                   SERIAL PRIMARY KEY,
    tipo_proceso_id      INT          NOT NULL,
    orden                INT          NOT NULL,
    nombre               VARCHAR(100) NOT NULL,
    descripcion          TEXT,
    rol_responsable_id   INT          NOT NULL,
    condicion_convenio   VARCHAR(20)  NOT NULL DEFAULT 'TODOS',
    FOREIGN KEY (tipo_proceso_id)    REFERENCES tipos_proceso(id),
    FOREIGN KEY (rol_responsable_id) REFERENCES roles(id),
    CONSTRAINT uq_hito_orden UNIQUE(tipo_proceso_id, orden)
);

CREATE TABLE tipos_documento (
    id                SERIAL PRIMARY KEY,
    plantilla_hito_id INT          NOT NULL,
    nombre            VARCHAR(150) NOT NULL,
    descripcion       TEXT,
    obligatorio       BOOLEAN      DEFAULT TRUE,
    extension_permitida VARCHAR(50),
    tamano_maximo_mb  INT,
    FOREIGN KEY (plantilla_hito_id) REFERENCES plantillas_hito(id),
    CONSTRAINT uq_tipo_documento  UNIQUE(plantilla_hito_id, nombre),
    CONSTRAINT chk_tamano_maximo  CHECK (
        tamano_maximo_mb IS NULL
        OR tamano_maximo_mb > 0
    )
);

-- ─── NÚCLEO ───────────────────────────────────────────────────────────────────

CREATE TABLE usuarios (
    id_usuario      UUID    PRIMARY KEY  DEFAULT gen_random_uuid(),
    nombres         VARCHAR(100) NOT NULL,
    apellidos       VARCHAR(100) NOT NULL,
    cedula          VARCHAR(20)  NOT NULL UNIQUE,
    correo          VARCHAR(150) NOT NULL UNIQUE,
    telefono        VARCHAR(20),
    nombre_usuario  VARCHAR(100) NOT NULL UNIQUE,
    hash_contrasena TEXT         NOT NULL,
    rol_id          INT          NOT NULL,
    estado          BOOLEAN      DEFAULT TRUE,
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rol_id) REFERENCES roles(id)
);

CREATE TABLE estudiantes (
    id_estudiante UUID    PRIMARY KEY  DEFAULT gen_random_uuid(),
    usuario_id    UUID    NOT NULL UNIQUE,
    carrera       VARCHAR(150) NOT NULL,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario)
);

CREATE TABLE tramites (
    id_tramite      UUID    PRIMARY KEY  DEFAULT gen_random_uuid(),
    codigo_tramite  VARCHAR(50)  NOT NULL UNIQUE,
    estudiante_id   UUID         NOT NULL,
    tipo_proceso_id INT          NOT NULL,
    periodo_id      INT          NOT NULL,
    estado_id       INT          NOT NULL,
    tiene_convenio      BOOLEAN,
    modalidad           VARCHAR(20),
    institucion_empresa VARCHAR(255),
    fecha_inicio        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre    TIMESTAMP,
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (estudiante_id)   REFERENCES estudiantes(id_estudiante),
    FOREIGN KEY (tipo_proceso_id) REFERENCES tipos_proceso(id),
    FOREIGN KEY (periodo_id)      REFERENCES periodos(id),
    FOREIGN KEY (estado_id)       REFERENCES estados(id)
);

CREATE INDEX idx_tramites_estudiante ON tramites(estudiante_id);

CREATE TABLE hitos (
    id_hito           UUID    PRIMARY KEY  DEFAULT gen_random_uuid(),
    tramite_id        UUID    NOT NULL,
    plantilla_hito_id INT     NOT NULL,
    estado_id         INT     NOT NULL,
    fecha_aprobacion  TIMESTAMP,
    aprobado_por      UUID,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tramite_id)        REFERENCES tramites(id_tramite),
    FOREIGN KEY (plantilla_hito_id) REFERENCES plantillas_hito(id),
    FOREIGN KEY (estado_id)         REFERENCES estados(id),
    FOREIGN KEY (aprobado_por)      REFERENCES usuarios(id_usuario),
    CONSTRAINT uq_hito_unico UNIQUE(tramite_id, plantilla_hito_id)
);

CREATE INDEX idx_hitos_tramite ON hitos(tramite_id);
CREATE INDEX idx_hitos_estado  ON hitos(estado_id);

CREATE TABLE documentos (
    id_doc            UUID    PRIMARY KEY  DEFAULT gen_random_uuid(),
    hito_id           UUID    NOT NULL,
    tipo_documento_id INT     NOT NULL,
    nombre_original   VARCHAR(255) NOT NULL,
    nombre_sistema    VARCHAR(255) NOT NULL,
    ruta              TEXT         NOT NULL,
    mime_type         VARCHAR(100),
    tamano_bytes      BIGINT,
    version           INT          DEFAULT 1,
    subido_por        UUID         NOT NULL,
    estado_id         INT          NOT NULL,
    fecha_subida      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    created_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hito_id)           REFERENCES hitos(id_hito),
    FOREIGN KEY (tipo_documento_id) REFERENCES tipos_documento(id),
    FOREIGN KEY (subido_por)        REFERENCES usuarios(id_usuario),
    FOREIGN KEY (estado_id)         REFERENCES estados(id)
);

CREATE INDEX idx_documentos_hito ON documentos(hito_id);

-- ─── COMUNICACIÓN ─────────────────────────────────────────────────────────────

CREATE TABLE observaciones (
    id_observacion    UUID    PRIMARY KEY  DEFAULT gen_random_uuid(),
    documento_id      UUID    NOT NULL,
    usuario_id        UUID    NOT NULL,
    comentario        TEXT    NOT NULL,
    fecha_observacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (documento_id) REFERENCES documentos(id_doc),
    FOREIGN KEY (usuario_id)   REFERENCES usuarios(id_usuario)
);

CREATE TABLE historial_tramites (
    id_historial UUID    PRIMARY KEY  DEFAULT gen_random_uuid(),
    tramite_id   UUID    NOT NULL,
    estado_id    INT     NOT NULL,
    usuario_id   UUID,                -- NULL = cambio automático del sistema
    comentario   TEXT,
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tramite_id) REFERENCES tramites(id_tramite),
    FOREIGN KEY (estado_id)  REFERENCES estados(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario)
);

CREATE TABLE historial_hitos (
    id_historial UUID    PRIMARY KEY  DEFAULT gen_random_uuid(),
    hito_id      UUID    NOT NULL,
    estado_id    INT     NOT NULL,
    usuario_id   UUID,                -- NULL = cambio automático del sistema
    comentario   TEXT,
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hito_id)    REFERENCES hitos(id_hito),
    FOREIGN KEY (estado_id)  REFERENCES estados(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario)
);

CREATE INDEX idx_historial_hitos_hito ON historial_hitos(hito_id);

-- ─── CONVENIOS ────────────────────────────────────────────────────────────────

CREATE TABLE convenios (
    id_convenio             UUID    PRIMARY KEY  DEFAULT gen_random_uuid(),
    tipo_convenio_id        INT          NOT NULL,
    codigo_convenio         VARCHAR(100) NOT NULL UNIQUE,
    institucion             VARCHAR(255) NOT NULL,
    descripcion             TEXT,
    otorgado_para           TEXT,
    responsable_institucion VARCHAR(255),
    direccion               VARCHAR(255),
    correo_contacto         TEXT,
    telefono_contacto       VARCHAR(50),
    anio                    INT,
    fecha_firma             DATE,
    fecha_finalizacion      DATE,
    duracion                VARCHAR(255),
    estado_id               INT          NOT NULL,
    observaciones           TEXT,
    proponente_universidad  VARCHAR(255),
    posee_archivo_fisico    BOOLEAN      DEFAULT FALSE,
    posee_archivo_digital   BOOLEAN      DEFAULT FALSE,
    created_at              TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tipo_convenio_id) REFERENCES tipos_convenio(id),
    FOREIGN KEY (estado_id)        REFERENCES estados(id),
    CONSTRAINT chk_anio_convenio CHECK (
        anio IS NULL
        OR anio BETWEEN 2000 AND 2100
    ),
    CONSTRAINT chk_fechas_convenio CHECK (
        fecha_firma IS NULL
        OR fecha_finalizacion IS NULL
        OR fecha_finalizacion >= fecha_firma
    )
);

-- ─── GENERACIÓN ───────────────────────────────────────────────────────────────

CREATE TABLE tipos_documento_generado (
    id     SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE plantillas_documento (
    id                         SERIAL PRIMARY KEY,
    tipo_documento_generado_id INT          NOT NULL,
    nombre                     VARCHAR(150) NOT NULL,
    descripcion                TEXT,
    ruta_archivo               TEXT         NOT NULL,
    activa                     BOOLEAN      DEFAULT TRUE,
    created_at                 TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tipo_documento_generado_id) REFERENCES tipos_documento_generado(id)
);

CREATE INDEX idx_plantillas_activa_tipo
    ON plantillas_documento(tipo_documento_generado_id, activa);

CREATE TABLE documentos_generados (
    id_documento_generado  UUID    PRIMARY KEY  DEFAULT gen_random_uuid(),
    plantilla_documento_id INT     NOT NULL,
    tramite_id             UUID    REFERENCES tramites(id_tramite),
    estudiante_id          UUID    NOT NULL,
    generado_por           UUID    NOT NULL,
    nombre_archivo         VARCHAR(255),
    ruta_archivo           TEXT    NOT NULL,
    fecha_generacion       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plantilla_documento_id) REFERENCES plantillas_documento(id),
    FOREIGN KEY (estudiante_id)          REFERENCES estudiantes(id_estudiante),
    FOREIGN KEY (generado_por)           REFERENCES usuarios(id_usuario)
);

CREATE INDEX idx_docgen_tramite ON documentos_generados(tramite_id);

-- ─── PERMISOS RBAC ────────────────────────────────────────────────────────────

CREATE TABLE funcionalidades (
    id          SERIAL       PRIMARY KEY,
    modulo      VARCHAR(50)  NOT NULL,
    accion      VARCHAR(100) NOT NULL,
    clave       VARCHAR(150) NOT NULL,
    descripcion TEXT,
    CONSTRAINT uq_funcionalidades_clave         UNIQUE (clave),
    CONSTRAINT uq_funcionalidades_modulo_accion UNIQUE (modulo, accion)
);

CREATE TABLE roles_funcionalidades (
    rol_id           INT     NOT NULL,
    funcionalidad_id INT     NOT NULL,
    habilitado       BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT pk_roles_funcionalidades PRIMARY KEY (rol_id, funcionalidad_id),
    CONSTRAINT fk_rf_rol            FOREIGN KEY (rol_id)           REFERENCES roles(id),
    CONSTRAINT fk_rf_funcionalidad  FOREIGN KEY (funcionalidad_id) REFERENCES funcionalidades(id)
);

CREATE INDEX idx_roles_func_rol ON roles_funcionalidades (rol_id);
