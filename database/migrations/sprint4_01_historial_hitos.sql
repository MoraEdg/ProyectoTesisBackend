-- Sprint 4 — Historial de cambios de estado de hitos
-- usuario_id es NULLABLE: los cambios automáticos del sistema se registran con NULL.
CREATE TABLE IF NOT EXISTS historial_hitos (
    id_historial UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hito_id      UUID NOT NULL,
    estado_id    INT  NOT NULL,
    usuario_id   UUID,
    comentario   TEXT,
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hito_id)    REFERENCES hitos(id_hito),
    FOREIGN KEY (estado_id)  REFERENCES estados(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario)
);

CREATE INDEX IF NOT EXISTS idx_historial_hitos_hito ON historial_hitos(hito_id);
