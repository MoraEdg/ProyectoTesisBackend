-- Sprint 6 — Trazabilidad y nombre de archivo en documentos_generados
-- La tabla existía desde el Sprint 1 pero nunca fue usada.
-- Se añaden las columnas necesarias para el módulo de generación.

ALTER TABLE documentos_generados
  ADD COLUMN IF NOT EXISTS tramite_id    UUID         REFERENCES tramites(id_tramite);

ALTER TABLE documentos_generados
  ADD COLUMN IF NOT EXISTS nombre_archivo VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_docgen_tramite ON documentos_generados(tramite_id);
