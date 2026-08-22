-- ============================================================
-- MIGRACIÓN RBAC_01 — Tablas de permisos dinámicos
-- Sistema de Gestión de Prácticas Preprofesionales — UISEK
--
-- EJECUTAR DESPUÉS de schema.sql + seeds.sql
-- REVERSIBLE: ver bloque DROP al final (comentado)
-- ============================================================

-- ─── CATÁLOGO DE FUNCIONALIDADES ──────────────────────────────────────────────
-- Cada fila representa una acción funcional del sistema que puede
-- habilitarse o deshabilitarse por rol.
-- La clave sigue el patrón: '<modulo>.<accion>'

CREATE TABLE funcionalidades (
    id          SERIAL       PRIMARY KEY,
    modulo      VARCHAR(50)  NOT NULL,
    accion      VARCHAR(100) NOT NULL,
    clave       VARCHAR(150) NOT NULL,
    descripcion TEXT,
    CONSTRAINT uq_funcionalidades_clave         UNIQUE (clave),
    CONSTRAINT uq_funcionalidades_modulo_accion UNIQUE (modulo, accion)
);

-- ─── MATRIZ ROLES × FUNCIONALIDADES ──────────────────────────────────────────
-- Cada fila indica si un rol tiene habilitada una funcionalidad.
-- La clave primaria compuesta garantiza un único registro por par (rol, func).

CREATE TABLE roles_funcionalidades (
    rol_id           INT     NOT NULL,
    funcionalidad_id INT     NOT NULL,
    habilitado       BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT pk_roles_funcionalidades PRIMARY KEY (rol_id, funcionalidad_id),
    CONSTRAINT fk_rf_rol            FOREIGN KEY (rol_id)           REFERENCES roles(id),
    CONSTRAINT fk_rf_funcionalidad  FOREIGN KEY (funcionalidad_id) REFERENCES funcionalidades(id)
);

CREATE INDEX idx_roles_func_rol ON roles_funcionalidades (rol_id);

-- ─── REVERSIÓN (comentado — ejecutar manualmente si se necesita deshacer) ─────
-- DROP TABLE IF EXISTS roles_funcionalidades;
-- DROP TABLE IF EXISTS funcionalidades;
