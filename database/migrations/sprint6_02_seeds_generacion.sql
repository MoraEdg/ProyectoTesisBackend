-- Sprint 6 — Reemplazo de tipos_documento_generado y plantillas_documento
-- Los 3 tipos y 3 plantillas del Sprint 1 (Carta de Petición, Carta de Intención,
-- Carta de Formalización) se reemplazan por los 4 tipos definitivos del levantamiento.
-- documentos_generados está vacía (nunca fue usada), así que no hay FK bloqueantes.

DELETE FROM documentos_generados;
DELETE FROM plantillas_documento;
DELETE FROM tipos_documento_generado;

-- Tipos definitivos (nombres institucionales UISEK)
INSERT INTO tipos_documento_generado (id, nombre) VALUES
  (1, 'Carta de Formalizacion (Empresa con Convenio)'),
  (2, 'Carta de Formalizacion (Empresa sin Convenio)'),
  (3, 'Carta de Peticion'),
  (4, 'FPP3 - Formato de Seguimiento');

SELECT setval(pg_get_serial_sequence('tipos_documento_generado', 'id'), 4);

-- Plantillas (rutas relativas desde la raiz del backend)
INSERT INTO plantillas_documento (tipo_documento_generado_id, nombre, descripcion, ruta_archivo, activa) VALUES
  (1, 'FPP2 con convenio',
      'Carta de formalizacion para empresas con convenio vigente',
      'plantillas/fpp2_con_convenio.docx', TRUE),
  (2, 'FPP2 sin convenio',
      'Carta de formalizacion para empresas sin convenio',
      'plantillas/fpp2_sin_convenio.docx', TRUE),
  (3, 'Carta de Peticion',
      'Carta de peticion a solicitud de la empresa (opcional)',
      'plantillas/carta_peticion.docx', TRUE),
  (4, 'FPP3 plantilla',
      'Formato de seguimiento vacio para llenar y firmar manualmente',
      'plantillas/fpp3.docx', TRUE);
