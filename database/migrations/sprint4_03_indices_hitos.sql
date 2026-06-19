-- Optimiza la consulta de hitos por trámite (la más frecuente del módulo)
CREATE INDEX IF NOT EXISTS idx_hitos_tramite ON hitos(tramite_id);
CREATE INDEX IF NOT EXISTS idx_hitos_estado  ON hitos(estado_id);
