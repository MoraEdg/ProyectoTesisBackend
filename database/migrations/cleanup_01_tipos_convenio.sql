-- ============================================================
-- MIGRATION: cleanup_01_tipos_convenio
-- Propósito: Eliminar tipos de convenio residuales del seed
--            inicial (Marco, Específico, Pasantías) que nunca
--            fueron documentados ni referenciados por convenios
--            institucionales reales.
-- Catálogo operativo tras esta migración: PRIVADO + PÚBLICO
-- Pre-condición: ningún convenio debe referenciar los IDs a
--                eliminar (verificado: ids 1, 2, 3 no tienen
--                filas dependientes en la tabla convenios).
-- ============================================================

-- Verificación de seguridad antes de borrar
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM convenios
    WHERE tipo_convenio_id IN (
      SELECT id FROM tipos_convenio
      WHERE nombre IN ('Marco', 'Específico', 'Pasantías')
    )
  ) THEN
    RAISE EXCEPTION 'No se puede ejecutar la migración: existen convenios que referencian Marco, Específico o Pasantías.';
  END IF;
END $$;

-- Eliminar tipos residuales
DELETE FROM tipos_convenio
WHERE nombre IN ('Marco', 'Específico', 'Pasantías');

-- Verificar estado final
SELECT id, nombre FROM tipos_convenio ORDER BY id;
