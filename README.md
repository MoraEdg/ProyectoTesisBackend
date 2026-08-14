# Backend — Sistema de Gestión de Prácticas Preprofesionales UISEK

**Autor:** Edgar Mora  
**Proyecto de Tesis — Universidad SEK**

| Recurso              | Enlace                                                                             |
| -------------------- | ---------------------------------------------------------------------------------- |
| Repositorio Backend  | https://github.com/MoraEdg/ProyectoTesisBackend.git                                |
| Repositorio Frontend | https://github.com/MoraEdg/ProyectoTesisFrontend.git                               |
| Tablero Jira         | https://edgarmoratesis.atlassian.net/jira/software/projects/SCRUM/boards/1/backlog |

---

## Stack tecnológico

| Capa                     | Tecnología             | Versión   |
| ------------------------ | ---------------------- | --------- |
| Runtime                  | Node.js                | 20+       |
| Framework                | Express                | 4.x       |
| Base de datos            | PostgreSQL             | 15+       |
| Autenticación            | JWT (jsonwebtoken)     | 9.x       |
| Hash de contraseñas      | bcrypt                 | 5.x       |
| Subida de archivos       | multer                 | 1.x       |
| Validación               | express-validator      | 7.x       |
| Generación de documentos | docxtemplater + pizzip | 3.x / 3.x |
| Procesamiento Excel      | xlsx                   | 0.18.x    |
| Variables de entorno     | dotenv                 | 16.x      |

---

## Arquitectura

```
Routes → Controllers → Services → pool.query()
```

Patrón MVC simplificado. Sin ORM — consultas SQL directas mediante `node-postgres` (`pg`).

```
src/
├── app.js                  — Express app, CORS, rutas, error handler
├── config/
│   └── db.js               — Pool de conexiones PostgreSQL
├── helpers/
│   ├── response.js         — Helpers de respuesta HTTP (ok, created, badRequest, ...)
│   ├── estados.js          — Máquina de estados (TRAMITE / HITO / DOCUMENTO)
│   └── codigoTramite.js    — Generador de códigos únicos (PRAC-2026-001)
├── middleware/
│   ├── auth.js             — Verificación de JWT Bearer
│   ├── roles.js            — Control de acceso por rol
│   └── upload.js           — Configuración de multer (documentos, convenios, excel)
└── modules/
    ├── auth/               — Login, logout, /me
    ├── catalogos/          — Roles, estados, tipos de proceso, periodos, tipos de convenio
    ├── estudiantes/        — CRUD, desactivación, importación Excel
    ├── tramites/           — Crear, estados, historial, cierre de trámites
    ├── hitos/              — Estados de hitos, historial, avance automático del trámite
    ├── documentos/         — Subida, aprobación, observación y versionado de documentos
    ├── convenios/          — Consulta de convenios institucionales ✅ Sprint 7
    ├── generacion/         — Generación de documentos Word ✅ Sprint 6
    └── reportes/           — Dashboard ejecutivo y planificación semestral ✅ Sprint 8
```

---

## Base de datos

**20 tablas** en la base de datos `practicas_db`:

| Grupo                   | Tablas                                                                     |
| ----------------------- | -------------------------------------------------------------------------- |
| Catálogos               | `roles`, `estados`, `tipos_proceso`, `periodos`, `tipos_convenio`          |
| Configuración de flujos | `plantillas_hito`, `tipos_documento`                                       |
| Núcleo                  | `usuarios`, `estudiantes`, `tramites`, `hitos`, `documentos`               |
| Comunicación            | `observaciones`, `historial_tramites`, `historial_hitos`                   |
| Convenios               | `convenios`, `archivos_convenio`                                           |
| Generación              | `tipos_documento_generado`, `plantillas_documento`, `documentos_generados` |

**Columnas adicionales en `tramites`:**

| Columna              | Tipo           | Sprint | Descripción                                         |
|----------------------|----------------|--------|-----------------------------------------------------|
| `tiene_convenio`     | BOOLEAN        | 6.5    | Si la empresa tiene convenio (solo PP)              |
| `modalidad`          | VARCHAR(20)    | 6.5    | PRACTICA o PASANTIA (solo PP)                       |
| `institucion_empresa`| VARCHAR(255)   | 8      | Nombre de empresa/institución (obligatorio PP, opcional RL) |

**Procesos soportados:**

| Proceso                    | Hitos activos | Condición de hitos             |
|---------------------------|---------------|-------------------------------|
| Prácticas Preprofesionales | 4 (sin convenio) / 3 (con convenio) | Hito ord=0 solo SIN_CONVENIO |
| Reconocimiento Laboral     | 1             | —                             |
| Convalidación              | 1             | —                             |

**Roles del sistema:** `Estudiante`, `Coordinador`, `Director`, `Decano`

---

## Configuración inicial

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/MoraEdg/ProyectoTesisBackend.git
cd ProyectoTesisBackend
npm install
```

### 2. Configurar variables de entorno

Copiar `.env.example` a `.env` y completar los valores:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=practicas_db
DB_USER=postgres
DB_PASSWORD=tu_contraseña_aqui
JWT_SECRET=una_clave_secreta_larga_y_segura
JWT_EXPIRES_IN=8h
PORT=5000
NODE_ENV=development
UPLOAD_MAX_SIZE_MB=20
UPLOAD_PATH=./uploads
PLANTILLAS_PATH=./plantillas
```

### 3. Crear la base de datos

```bash
# Crear la base de datos
psql -U postgres -c "CREATE DATABASE practicas_db;"

# Crear las 20 tablas con el esquema definitivo
npm run db:schema

# Insertar todos los datos iniciales (catálogos, hitos, plantillas, convenios y admin)
npm run db:seeds
```

Con estos dos comandos la base de datos queda en el **estado final completo**. No se requieren migraciones adicionales.

### 4. Plantillas de documentos

Los 4 archivos DOCX ya están incluidos en el repositorio dentro de `plantillas/`. Sus nombres y marcadores requeridos son:

| Archivo                         | Marcadores requeridos                                                        |
| ------------------------------- | ---------------------------------------------------------------------------- |
| `fpp2_con_convenio.docx`        | `<<FECHA>> <<EMPRESA>> <<ESTUDIANTE>> <<CEDULA>> <<SEMESTRE>> <<CARRERA>>`   |
| `fpp2_sin_convenio.docx`        | `<<FECHA>> <<EMPRESA>> <<ESTUDIANTE>> <<CEDULA>> <<SEMESTRE>> <<CARRERA>>`   |
| `carta_peticion.docx`           | `<<FECHA>> <<GERENTE>> <<CARGO>> <<EMPRESA>> <<ESTUDIANTE>> <<CEDULA>> <<SEMESTRE>> <<CARRERA>>` |
| `fpp3.docx`                     | Ninguno (se entrega tal cual)                                                |

### 5. Levantar el servidor

```bash
npm run dev      # Desarrollo (nodemon, recarga automática)
npm start        # Producción
```

Servidor disponible en `http://localhost:5000`.

---

## Credenciales de prueba

| Campo      | Valor         |
| ---------- | ------------- |
| Usuario    | `admin`       |
| Contraseña | `Admin1234`   |
| Rol        | `Coordinador` |

---

## API — Endpoints disponibles

Base URL: `http://localhost:5000/api/v1`

### Autenticación

| Método | Ruta           | Auth | Descripción                           |
| ------ | -------------- | ---- | ------------------------------------- |
| POST   | `/auth/login`  | No   | Iniciar sesión                        |
| POST   | `/auth/logout` | Sí   | Cerrar sesión (stateless)             |
| GET    | `/auth/me`     | Sí   | Obtener datos del usuario autenticado |

### Catálogos

| Método | Ruta                                  | Roles           |
| ------ | ------------------------------------- | --------------- |
| GET    | `/catalogos/roles`                    | Coordinador     |
| GET    | `/catalogos/estados?categoria=TRAMITE`| Todos           |
| GET    | `/catalogos/tipos-proceso`            | Todos           |
| GET    | `/catalogos/tipos-convenio`           | Todos           |
| GET    | `/catalogos/periodos`                 | Todos           |
| GET    | `/catalogos/tipos-documento-generado` | Coordinador     |

### Gestión de Estudiantes — solo Coordinador

| Método | Ruta                          | Descripción                                      |
| ------ | ----------------------------- | ------------------------------------------------ |
| GET    | `/estudiantes`                | Listar (paginación, búsqueda, filtros)           |
| GET    | `/estudiantes/:id`            | Detalle                                          |
| POST   | `/estudiantes`                | Registrar (usuario y contraseña = cédula)        |
| PUT    | `/estudiantes/:id`            | Editar (cédula inmutable)                        |
| PATCH  | `/estudiantes/:id/desactivar` | Desactivación lógica                             |
| POST   | `/estudiantes/importar`       | Importar desde Excel (.xlsx, máx. 10 MB)         |

### Gestión de Trámites

| Método | Ruta                      | Roles                                    | Descripción                       |
| ------ | ------------------------- | ---------------------------------------- | --------------------------------- |
| GET    | `/tramites`               | Coordinador (todos) / Estudiante (propios) | Listar trámites                 |
| GET    | `/tramites/:id`           | Coordinador, Estudiante (propio)         | Detalle del trámite               |
| POST   | `/tramites`               | Coordinador                              | Crear trámite                     |
| PATCH  | `/tramites/:id/estado`    | Coordinador                              | Cambiar estado                    |
| POST   | `/tramites/:id/cerrar`    | Coordinador                              | Finalizar (APROBADO → FINALIZADO) |
| GET    | `/tramites/:id/historial` | Coordinador, Estudiante (propio)         | Historial de estados              |

**Body de `POST /tramites`:**

```json
{
  "estudiante_id": "uuid",
  "tipo_proceso_id": 1,
  "periodo_id": 1,
  "tiene_convenio": true,           // Solo PP — obligatorio
  "modalidad": "PRACTICA",          // Solo PP — PRACTICA o PASANTIA
  "institucion_empresa": "Empresa SA" // PP: obligatorio; RL: opcional; Conv: ignorado
}
```

### Gestión de Hitos

| Método | Ruta                          | Roles                            | Descripción                   |
| ------ | ----------------------------- | -------------------------------- | ----------------------------- |
| GET    | `/tramites/:id/hitos`         | Coordinador, Estudiante (propio) | Listar hitos del trámite      |
| GET    | `/hitos/:id`                  | Coordinador, Estudiante (propio) | Detalle de un hito            |
| PATCH  | `/hitos/:id/estado`           | Coordinador                      | Cambiar estado del hito       |
| GET    | `/hitos/:id/historial`        | Coordinador, Estudiante (propio) | Historial de estados del hito |

### Gestión de Documentos

| Método | Ruta                           | Roles                              | Descripción                          |
| ------ | ------------------------------ | ---------------------------------- | ------------------------------------ |
| POST   | `/hitos/:id/documentos`        | Coordinador, Estudiante (propio)   | Subir documento (multipart/form-data)|
| GET    | `/hitos/:id/documentos`        | Coordinador, Estudiante (propio)   | Listar documentos del hito           |
| GET    | `/documentos/:id/descargar`    | Coordinador, Estudiante (propio)   | Descargar archivo (autenticado)      |
| PATCH  | `/documentos/:id/aprobar`      | Coordinador                        | Aprobar documento                    |
| PATCH  | `/documentos/:id/observar`     | Coordinador                        | Observar con comentario obligatorio  |
| GET    | `/documentos/:id/observaciones`| Coordinador, Estudiante (propio)   | Listar observaciones                 |

### Generación de Documentos — solo Coordinador

| Método | Ruta                                        | Descripción                                      |
| ------ | ------------------------------------------- | ------------------------------------------------ |
| GET    | `/generacion/tipos`                         | Lista los 4 tipos disponibles                    |
| POST   | `/tramites/:id/generar-documento`           | Genera el documento Word y lo devuelve como descarga |
| GET    | `/tramites/:id/documentos-generados`        | Historial de documentos generados del trámite    |
| GET    | `/generacion/documentos/:id/descargar`      | Re-descarga de un documento generado             |

### Convenios — todos los roles autenticados

| Método | Ruta         | Descripción                                               |
| ------ | ------------ | --------------------------------------------------------- |
| GET    | `/convenios` | Listar convenios. Filtros opcionales: `busqueda`, `estado`, `anio` |

### Reportes — solo Coordinador

| Método | Ruta                       | Descripción                                                         |
| ------ | -------------------------- | ------------------------------------------------------------------- |
| GET    | `/reportes/dashboard`      | 5 métricas globales + 4 datasets para gráficos                      |
| GET    | `/reportes/planificacion`  | Tabla de planificación. Filtros: `periodo_id`, `tipo_proceso_id`, `estado`, `carrera`, `modalidad`, `tiene_convenio` |

### Health check

```
GET /api/v1/health
```

---

## Formato de respuestas

**Éxito:**
```json
{ "success": true, "data": { ... } }
```

**Error:**
```json
{ "success": false, "error": "Descripción del error" }
```

Autenticación: `Authorization: Bearer <token>` en el header HTTP.

---

## Máquinas de estado

**Trámite:**
```
INICIADO → EN_REVISION → OBSERVADO → CORREGIDO → EN_REVISION → APROBADO → FINALIZADO
```

**Hito:**
```
PENDIENTE → EN_REVISION → OBSERVADO → EN_REVISION → APROBADO (revertible)
```

**Documento:**
```
SUBIDO → EN_REVISION → OBSERVADO (hasta nueva versión)
                     ↘ APROBADO → OBSERVADO (para reemplazar)
```

---

## Scripts disponibles

| Script              | Comando                           | Descripción               |
| ------------------- | --------------------------------- | ------------------------- |
| `npm start`         | `node server.js`                  | Inicia en producción      |
| `npm run dev`       | `nodemon server.js`               | Inicia en desarrollo      |
| `npm run db:schema` | `psql ... -f database/schema.sql` | Crea las 20 tablas        |
| `npm run db:seeds`  | `psql ... -f database/seeds.sql`  | Inserta datos iniciales   |

---

## Estado del proyecto

| Sprint   | Módulo                                                        | Estado     |
| -------- | ------------------------------------------------------------- | ---------- |
| Sprint 1 | Fundación (auth, catálogos, schema, seeds)                    | ✅ Completado |
| Sprint 2 | Gestión de Estudiantes (CRUD, importación Excel)              | ✅ Completado |
| Sprint 3 | Gestión de Trámites (estados, historial, cierre)              | ✅ Completado |
| Sprint 4 | Gestión de Hitos (estados, avance automático, historial)      | ✅ Completado |
| Sprint 5 | Gestión de Documentos (subida, aprobación, versionado)        | ✅ Completado |
| Sprint 6 | Generación de Documentos Word (FPP2, Carta, FPP3)            | ✅ Completado |
| Sprint 6.5 | Ajustes: hitos condicionales (SIN/CON_CONVENIO), modalidad, historial | ✅ Completado |
| Sprint 7 | Convenios institucionales (consulta)                          | ✅ Completado |
| Sprint 8 | Reportes institucionales (dashboard + planificación + Excel)  | ✅ Completado |
