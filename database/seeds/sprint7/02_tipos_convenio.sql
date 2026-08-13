-- Sprint 7 — Seed 02: Tipos de convenio usados en los datos institucionales reales
-- Los datos reales (Abbott, ANT, Gloclaface) distinguen entre entidad privada y pública.
-- Marco / Específico / Pasantías provienen del seed original y permanecen intactos.

INSERT INTO tipos_convenio (nombre, descripcion)
SELECT 'PRIVADO', 'Convenio con entidad privada'
WHERE NOT EXISTS (
  SELECT 1 FROM tipos_convenio WHERE nombre = 'PRIVADO'
);

INSERT INTO tipos_convenio (nombre, descripcion)
SELECT 'PÚBLICO', 'Convenio con entidad pública o estatal'
WHERE NOT EXISTS (
  SELECT 1 FROM tipos_convenio WHERE nombre = 'PÚBLICO'
);
