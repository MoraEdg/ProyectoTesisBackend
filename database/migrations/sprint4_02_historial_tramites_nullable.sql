-- Sprint 4 — Los avances/retrocesos automáticos del trámite (disparados por hitos)
-- se registran con usuario_id = NULL (acción del sistema).
ALTER TABLE historial_tramites ALTER COLUMN usuario_id DROP NOT NULL;
