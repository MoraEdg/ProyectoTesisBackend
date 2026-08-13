-- Sprint 7 — Seed 03: Convenios institucionales reales
-- Orden obligatorio: ejecutar después de 01_estados_convenio.sql y 02_tipos_convenio.sql.
-- Los tipo_convenio_id y estado_id se resuelven por nombre (subconsultas).
-- Fechas normalizadas a DATE (AAAA-MM-DD).
-- proponente_universidad NULL cuando el dato no está disponible (Gloclaface).

-- ─── Convenio 1 — Abbott Laboratorios del Ecuador ────────────────────────────
INSERT INTO convenios (
  tipo_convenio_id,
  codigo_convenio,
  institucion,
  descripcion,
  responsable_institucion,
  direccion,
  correo_contacto,
  telefono_contacto,
  otorgado_para,
  anio,
  fecha_firma,
  fecha_finalizacion,
  duracion,
  estado_id,
  proponente_universidad,
  posee_archivo_fisico,
  posee_archivo_digital
) VALUES (
  (SELECT id FROM tipos_convenio WHERE nombre = 'PRIVADO'),
  'DRII-021-2021',
  'Abbott Laboratorios del Ecuador',
  'Convenio específico para desarrollar pasantías, prácticas pre profesionales y ofertas laborables',
  'Fanny Hurtado L.',
  'República de El Salvador N34-493 y Portugal',
  'fanny.hurtado@abbott.com',
  '3992549',
  'Articular las capacidades y realizar acciones institucionales conjuntas que permitan la ejecución de programas y proyectos específicos para fomentar el emprendimiento e innovación',
  2021,
  '2021-03-02',
  '2022-03-02',
  '1 año // renovación automática por el mismo periodo',
  (SELECT id FROM estados WHERE nombre = 'CADUCADO' AND categoria = 'CONVENIO'),
  'La empresa solicitó el convenio',
  FALSE,
  TRUE
);

-- ─── Convenio 2 — Agencia Nacional de Tránsito (ANT) ─────────────────────────
INSERT INTO convenios (
  tipo_convenio_id,
  codigo_convenio,
  institucion,
  descripcion,
  responsable_institucion,
  direccion,
  correo_contacto,
  telefono_contacto,
  otorgado_para,
  anio,
  fecha_firma,
  fecha_finalizacion,
  duracion,
  estado_id,
  proponente_universidad,
  posee_archivo_fisico,
  posee_archivo_digital
) VALUES (
  (SELECT id FROM tipos_convenio WHERE nombre = 'PÚBLICO'),
  'PPP-004-2023',
  'Agencia Nacional de Regulación y Control del Transporte Terrestre, Tránsito y Seguridad Vial (ANRCTTTSV)',
  'Convenio específico para desarrollar pasantías, prácticas pre profesionales y ofertas laborables',
  'Hernán Pontón (Subdirector de la ANT)',
  'Av. Antonio José de Sucre y José Sánchez',
  'practicas.ant@gmail.com; cristina.bustos@ant.gob.ec; hernan.ponton@ant.gob.ec',
  '023828890 ext.2420',
  'Desarrollo de PPP para las carreras de grado de la UISEK',
  2023,
  '2023-01-12',
  '2029-01-12',
  '3 años // renovación mediante comunicación escrita con al menos treinta (30) días previos a la terminación',
  (SELECT id FROM estados WHERE nombre = 'VIGENTE' AND categoria = 'CONVENIO'),
  'Dirección de Relaciones Internacionales e Interinstitucionales',
  FALSE,
  TRUE
);

-- ─── Convenio 3 — Agrocomercial Gloclaface Cía. Ltda. ───────────────────────
INSERT INTO convenios (
  tipo_convenio_id,
  codigo_convenio,
  institucion,
  descripcion,
  responsable_institucion,
  direccion,
  correo_contacto,
  telefono_contacto,
  otorgado_para,
  anio,
  fecha_firma,
  fecha_finalizacion,
  duracion,
  estado_id,
  proponente_universidad,
  posee_archivo_fisico,
  posee_archivo_digital
) VALUES (
  (SELECT id FROM tipos_convenio WHERE nombre = 'PRIVADO'),
  'DRII-002-2021',
  'Agrocomercial Gloclaface Cía. Ltda.',
  'Convenio específico para desarrollar pasantías, prácticas pre profesionales y ofertas laborables',
  'Gerente General',
  'Vicente Rocafuerte E1-79 y Cacha',
  'gerencia@agrocomercialgloclaface.com.ec',
  '2063554',
  'Articular las capacidades y realizar acciones institucionales conjuntas que permitan la ejecución de programas y proyectos específicos para fomentar el emprendimiento e innovación',
  2020,
  '2020-01-05',
  '2021-01-05',
  '1 año // renovación automática por el mismo periodo',
  (SELECT id FROM estados WHERE nombre = 'CADUCADO' AND categoria = 'CONVENIO'),
  NULL,
  FALSE,
  TRUE
);
