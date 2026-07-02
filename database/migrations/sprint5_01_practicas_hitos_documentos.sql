-- Sprint 5 — Reemplazo de hitos/tipos_documento de Prácticas Preprofesionales
-- por los 3 hitos definitivos validados con el Coordinador (decisión #2).
--
-- ADVERTENCIA: requiere que no existan tramites de tipo Prácticas con hitos
-- ya creados (FK hitos.plantilla_hito_id). Solo apto para entornos de
-- desarrollo/tesis sin datos de producción.

DO $$
DECLARE
  v_tipo_proceso_id INT;
BEGIN
  SELECT id INTO v_tipo_proceso_id FROM tipos_proceso WHERE nombre = 'Prácticas Preprofesionales';

  -- Eliminar tipos_documento y plantillas_hito anteriores de Prácticas
  DELETE FROM tipos_documento
   WHERE plantilla_hito_id IN (
     SELECT id FROM plantillas_hito WHERE tipo_proceso_id = v_tipo_proceso_id
   );
  DELETE FROM plantillas_hito WHERE tipo_proceso_id = v_tipo_proceso_id;
END $$;

-- Hitos definitivos de Prácticas (3)
INSERT INTO plantillas_hito (tipo_proceso_id, orden, nombre, rol_responsable_id) VALUES
  (
    (SELECT id FROM tipos_proceso WHERE nombre = 'Prácticas Preprofesionales'),
    1, 'Formalización',
    (SELECT id FROM roles WHERE nombre_rol = 'Coordinador')
  ),
  (
    (SELECT id FROM tipos_proceso WHERE nombre = 'Prácticas Preprofesionales'),
    2, 'Seguimiento',
    (SELECT id FROM roles WHERE nombre_rol = 'Coordinador')
  ),
  (
    (SELECT id FROM tipos_proceso WHERE nombre = 'Prácticas Preprofesionales'),
    3, 'Finalización',
    (SELECT id FROM roles WHERE nombre_rol = 'Coordinador')
  );

-- Tipos de documento de Prácticas (1 por hito, nombres oficiales congelados)
INSERT INTO tipos_documento (plantilla_hito_id, nombre, extension_permitida, tamano_maximo_mb, obligatorio) VALUES
  (
    (SELECT ph.id FROM plantillas_hito ph
     JOIN tipos_proceso tp ON ph.tipo_proceso_id = tp.id
     WHERE tp.nombre = 'Prácticas Preprofesionales' AND ph.orden = 1),
    'Carta de Intención (Aceptación de Empresa)', '.pdf', 10, TRUE
  ),
  (
    (SELECT ph.id FROM plantillas_hito ph
     JOIN tipos_proceso tp ON ph.tipo_proceso_id = tp.id
     WHERE tp.nombre = 'Prácticas Preprofesionales' AND ph.orden = 2),
    'FPP3 - Seguimiento de Prácticas (Firmado)', '.pdf', 10, TRUE
  ),
  (
    (SELECT ph.id FROM plantillas_hito ph
     JOIN tipos_proceso tp ON ph.tipo_proceso_id = tp.id
     WHERE tp.nombre = 'Prácticas Preprofesionales' AND ph.orden = 3),
    'Certificado de Culminación de Prácticas (Empresa)', '.pdf', 10, TRUE
  );
