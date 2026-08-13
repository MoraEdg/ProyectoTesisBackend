-- Sprint 7 — Seed 01: Estados de categoría CONVENIO
-- Idempotente: inserta solo los que no existan.
-- En instalaciones desde schema.sql los 5 estados ya están en seeds.sql;
-- este archivo cubre instalaciones parciales o entornos nuevos.

INSERT INTO estados (nombre, categoria, descripcion)
SELECT 'EN_PROCESO', 'CONVENIO', 'Convenio en trámite de firma'
WHERE NOT EXISTS (
  SELECT 1 FROM estados WHERE nombre = 'EN_PROCESO' AND categoria = 'CONVENIO'
);

INSERT INTO estados (nombre, categoria, descripcion)
SELECT 'VIGENTE', 'CONVENIO', 'Convenio activo y vigente'
WHERE NOT EXISTS (
  SELECT 1 FROM estados WHERE nombre = 'VIGENTE' AND categoria = 'CONVENIO'
);

INSERT INTO estados (nombre, categoria, descripcion)
SELECT 'SUSPENDIDO', 'CONVENIO', 'Convenio temporalmente suspendido'
WHERE NOT EXISTS (
  SELECT 1 FROM estados WHERE nombre = 'SUSPENDIDO' AND categoria = 'CONVENIO'
);

INSERT INTO estados (nombre, categoria, descripcion)
SELECT 'FINALIZADO', 'CONVENIO', 'Convenio concluido normalmente'
WHERE NOT EXISTS (
  SELECT 1 FROM estados WHERE nombre = 'FINALIZADO' AND categoria = 'CONVENIO'
);

INSERT INTO estados (nombre, categoria, descripcion)
SELECT 'CADUCADO', 'CONVENIO', 'Convenio vencido por fecha o incumplimiento'
WHERE NOT EXISTS (
  SELECT 1 FROM estados WHERE nombre = 'CADUCADO' AND categoria = 'CONVENIO'
);
