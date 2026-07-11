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

| Capa                     | Tecnología             | Versión |
| ------------------------ | ---------------------- | ------- |
| Runtime                  | Node.js                | 20+     |
| Framework                | Express                | 4.x     |
| Base de datos            | PostgreSQL             | 15+     |
| Autenticación            | JWT (jsonwebtoken)     | 9.x     |
| Hash de contraseñas      | bcrypt                 | 5.x     |
| Subida de archivos       | multer                 | 1.x     |
| Validación               | express-validator      | 7.x     |
| Generación de documentos | docxtemplater + pizzip | 3.x / 3.x |
| Procesamiento Excel      | xlsx                   | —       |
| Variables de entorno     | dotenv                 | 16.x    |

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
│   ├── estados.js          — Máquina de estados (TRAMITE / HITO / DOCUMENTO / CONVENIO)
│   └── codigoTramite.js    — Generador de códigos únicos (PRAC-2026-001)
├── middleware/
│   ├── auth.js             — Verificación de JWT Bearer
│   ├── roles.js            — Control de acceso por rol
│   └── upload.js           — Configuración de multer (documentos, convenios, excel)
└── modules/
    ├── auth/               — Login, logout, /me
    ├── catalogos/          — Roles, estados, tipos de proceso, periodos, convenios
    ├── estudiantes/        — CRUD, desactivación, importación Excel
    ├── tramites/           — Crear, estados, historial, cierre de trámites
    ├── hitos/              — Estados de hitos, historial, avance automático del trámite
    ├── documentos/         — Subida, aprobación, observación y versionado de documentos
    ├── convenios/          — (pendiente)
    └── generacion/         — generación de documentos Word (Sprint 6) ✅
```

---

## Base de datos

**19 tablas** en la base de datos `practicas_db`:

| Grupo                   | Tablas                                                                     |
| ----------------------- | -------------------------------------------------------------------------- |
| Catálogos               | `roles`, `estados`, `tipos_proceso`, `periodos`, `tipos_convenio`          |
| Configuración de flujos | `plantillas_hito`, `tipos_documento`                                       |
| Núcleo                  | `usuarios`, `estudiantes`, `tramites`, `hitos`, `documentos`               |
| Comunicación            | `observaciones`, `historial_tramites`                                      |
| Convenios               | `convenios`, `archivos_convenio`                                           |
| Generación              | `tipos_documento_generado`, `plantillas_documento`, `documentos_generados` |

**Procesos soportados:**

- Prácticas Preprofesionales — 3 hitos (Formalización, Seguimiento, Finalización)
- Reconocimiento Laboral — 2 hitos
- Convalidación — 2 hitos

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

```bash
cp .env.example .env
```

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
```

### 3. Crear la base de datos y ejecutar migraciones

```bash
# Crear la base de datos en PostgreSQL
psql -U postgres -c "CREATE DATABASE practicas_db;"

# Ejecutar el schema (19 tablas)
npm run db:schema

# Insertar datos iniciales
npm run db:seeds

# Aplicar migraciones en orden secuencial
psql -U postgres -d practicas_db -f database/migrations/sprint4_01_historial_hitos.sql
psql -U postgres -d practicas_db -f database/migrations/sprint4_02_historial_tramites_nullable.sql
psql -U postgres -d practicas_db -f database/migrations/sprint4_03_indices_hitos.sql
psql -U postgres -d practicas_db -f database/migrations/sprint5_01_practicas_hitos_documentos.sql
psql -U postgres -d practicas_db -f database/migrations/sprint6_01_documentos_generados.sql
psql -U postgres -d practicas_db -f database/migrations/sprint6_02_seeds_generacion.sql
```

> Nota: una instalación nueva ejecutada con `npm run db:seeds` ya nace con los datos definitivos (3 hitos PP, 4 tipos de documento generado). Las migraciones de sprint5 y sprint6 solo son necesarias para bases de datos creadas antes de esos sprints.

### 5. Preparar plantillas de documentos

Colocar los 4 archivos DOCX en `plantillas/` con estos nombres exactos:

| Archivo | Marcadores requeridos |
| ------- | --------------------- |
| `plantillas/carta_peticion.docx` | `<<FECHA>> <<GERENTE>> <<CARGO>> <<EMPRESA>> <<ESTUDIANTE>> <<CEDULA>> <<SEMESTRE>> <<CARRERA>>` |
| `plantillas/fpp2_con_convenio.docx` | `<<FECHA>> <<EMPRESA>> <<ESTUDIANTE>> <<CEDULA>> <<SEMESTRE>> <<CARRERA>>` |
| `plantillas/fpp2_sin_convenio.docx` | `<<FECHA>> <<EMPRESA>> <<ESTUDIANTE>> <<CEDULA>> <<SEMESTRE>> <<CARRERA>>` |
| `plantillas/fpp3.docx` | Ninguno (se entrega tal cual) |

Los archivos originales nunca se modifican en ejecución; el sistema trabaja siempre sobre una copia en memoria.

### 4. Levantar el servidor

```bash
# Desarrollo (con recarga automática)
npm run dev

# Producción
npm start
```

El servidor queda disponible en `http://localhost:5000`.

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

**Ejemplo de login:**

```json
POST /api/v1/auth/login
{
  "nombre_usuario": "admin",
  "contrasena": "Admin1234"
}
```

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "usuario": {
      "id_usuario": "uuid",
      "nombres": "Admin",
      "apellidos": "Coordinador",
      "rol": "Coordinador"
    }
  }
}
```

### Catálogos (requieren autenticación)

| Método | Ruta                                   | Roles permitidos        |
| ------ | -------------------------------------- | ----------------------- |
| GET    | `/catalogos/roles`                     | Coordinador             |
| GET    | `/catalogos/estados?categoria=TRAMITE` | Todos                   |
| GET    | `/catalogos/tipos-proceso`             | Todos                   |
| GET    | `/catalogos/tipos-convenio`            | Coordinador, Director   |
| GET    | `/catalogos/periodos`                  | Todos                   |
| GET    | `/catalogos/tipos-documento-generado`  | Coordinador, Estudiante |

### Gestión de Estudiantes (requieren autenticación — rol Coordinador)

| Método | Ruta                          | Descripción                                                  |
| ------ | ----------------------------- | ------------------------------------------------------------ |
| GET    | `/estudiantes`                | Listar estudiantes (paginación, búsqueda, filtros)           |
| GET    | `/estudiantes/:id`            | Detalle de un estudiante                                     |
| POST   | `/estudiantes`                | Registrar estudiante (usuario = cédula, contraseña = cédula) |
| PUT    | `/estudiantes/:id`            | Editar datos del estudiante (cédula no editable)             |
| PATCH  | `/estudiantes/:id/desactivar` | Desactivación lógica (estado = false)                        |
| POST   | `/estudiantes/importar`       | Importar desde Excel (multipart/form-data, campo `archivo`)  |

**Formato Excel para importación:**

- Hoja: `Estudiantes`
- Columnas requeridas: `Cedula`, `Apellidos`, `Nombres`, `Correo`, `Matricula`, `Carrera`
- Columna opcional: `Telefono`
- Archivos permitidos: `.xlsx`, `.xls`, `.xlsm` (máx. 10 MB)

### Gestión de Trámites (requieren autenticación)

| Método | Ruta                      | Roles                                     | Descripción                                    |
| ------ | ------------------------- | ----------------------------------------- | ---------------------------------------------- |
| GET    | `/tramites`               | Coordinador (todos), Estudiante (propios) | Listar trámites                                |
| GET    | `/tramites/:id`           | Coordinador, Estudiante (propio)          | Detalle del trámite                            |
| POST   | `/tramites`               | Coordinador                               | Crear trámite (estudiante + proceso + período) |
| PATCH  | `/tramites/:id/estado`    | Coordinador                               | Cambiar estado del trámite                     |
| POST   | `/tramites/:id/cerrar`    | Coordinador                               | Finalizar (APROBADO a FINALIZADO)              |
| GET    | `/tramites/:id/historial` | Coordinador, Estudiante (propio)          | Historial de estados                           |

**Máquina de estados:**

```
INICIADO → EN_REVISION → OBSERVADO → CORREGIDO → EN_REVISION → APROBADO → FINALIZADO
```

**Códigos de trámite** (generados automáticamente):

- Prácticas Preprofesionales: `PRAC-2026-001`
- Reconocimiento Laboral: `RLAB-2026-001`
- Convalidación: `CONV-2026-001`

### Gestión de Hitos (requieren autenticación)

| Método | Ruta                         | Roles                            | Descripción                   |
| ------ | ---------------------------- | -------------------------------- | ----------------------------- |
| GET    | `/tramites/:tramiteId/hitos` | Coordinador, Estudiante (propio) | Listar hitos de un trámite    |
| GET    | `/hitos/:id`                 | Coordinador, Estudiante (propio) | Detalle de un hito            |
| PATCH  | `/hitos/:id/estado`          | Coordinador                      | Cambiar estado del hito       |
| GET    | `/hitos/:id/historial`       | Coordinador, Estudiante (propio) | Historial de estados del hito |

**Máquina de estados del hito:**

```
PENDIENTE → EN_REVISION → OBSERVADO → EN_REVISION → APROBADO (terminal)
```

**Comportamiento automático:**

- Al crear un trámite, se instancian todos sus hitos en estado PENDIENTE
- Al aprobarse todos los hitos, el trámite avanza automáticamente a APROBADO
- La finalización del trámite (APROBADO → FINALIZADO) sigue siendo manual

### Gestión de Documentos (requieren autenticación)

| Método | Ruta                            | Roles                              | Descripción                              |
| ------ | -------------------------------- | ----------------------------------- | ----------------------------------------- |
| POST   | `/hitos/:hitoId/documentos`      | Estudiante (propio) o Coordinador   | Subir documento al hito (multipart)       |
| GET    | `/hitos/:hitoId/documentos`      | Coordinador, Estudiante (propio)    | Listar documentos del hito (incluye versiones) |
| GET    | `/documentos/:id`                | Coordinador, Estudiante (propio)    | Detalle de un documento                   |
| GET    | `/documentos/:id/descargar`      | Coordinador, Estudiante (propio)    | Descargar archivo (privado, autenticado)  |
| PATCH  | `/documentos/:id/aprobar`        | Coordinador                         | Aprobar documento → puede aprobar el hito |
| PATCH  | `/documentos/:id/observar`       | Coordinador                         | Observar documento (registra en `observaciones`) |
| GET    | `/documentos/:id/observaciones`  | Coordinador, Estudiante (propio)    | Listar observaciones del documento        |

**Máquina de estados del documento:**

```
SUBIDO → EN_REVISION → OBSERVADO (terminal hasta nueva versión)
                     → APROBADO → OBSERVADO (revertir antes de reemplazar)
```

**Comportamiento automático:**

- La transición SUBIDO → EN_REVISION ocurre automáticamente al subir el archivo
- Subir un documento del mismo tipo marca la versión anterior como REEMPLAZADO (salvo que esté APROBADO)
- Un documento APROBADO no puede reemplazarse directamente: el Coordinador debe observarlo primero
- Cuando el documento obligatorio de un hito queda APROBADO, el hito avanza a APROBADO automáticamente
- Cuando el documento deja de estar APROBADO, el hito retrocede a EN_REVISION automáticamente
- Hitos con documento obligatorio no se aprueban manualmente vía `PATCH /hitos/:id/estado`

**Documentos oficiales de Prácticas Preprofesionales** (nombres congelados):
- Formalización → *Carta de Intención (Aceptación de Empresa)*
- Seguimiento → *FPP3 - Seguimiento de Prácticas (Firmado)*
- Finalización → *Certificado de Culminación de Prácticas (Empresa)*

### Generación de Documentos (requieren autenticación — rol Coordinador)

| Método | Ruta | Descripción |
| ------ | ---- | ----------- |
| GET    | `/generacion/tipos` | Lista los 4 tipos de documento disponibles |
| POST   | `/tramites/:tramiteId/generar-documento` | Genera el documento y lo devuelve como descarga inmediata |
| GET    | `/tramites/:tramiteId/documentos-generados` | Historial de documentos generados del trámite |
| GET    | `/generacion/documentos/:id/descargar` | Re-descarga de un documento generado anteriormente |

**Tipos disponibles:**

| id | Tipo | Campos del formulario |
|----|------|-----------------------|
| 1  | FPP2 — Carta de Formalización (con convenio) | Empresa, Semestre |
| 2  | FPP2 — Carta de Formalización (sin convenio) | Empresa, Semestre |
| 3  | Carta de Petición | Empresa, Gerente, Cargo, Semestre |
| 4  | FPP3 — Formato de Seguimiento (plantilla vacía) | Sin campos adicionales |

**Comportamiento:**
- El tipo 4 (FPP3) se genera, guarda y registra igual que los demás, pero sin reemplazo de marcadores
- `<<FECHA>>` se genera en el servidor con formato institucional ("Quito, D de mes de AAAA"); no la ingresa el usuario
- Regenerar el mismo tipo para el mismo trámite crea un archivo nuevo (timestamp único) y una nueva fila; nunca sobrescribe
- Las plantillas originales en `plantillas/` son inmutables en ejecución
- Los archivos generados se guardan en `uploads/generados/{tramite_id}/`

### Health check

```
GET /api/v1/health
```

---

## Formato de respuestas

**Éxito:**

```json
{ "success": true, "data": { ... }, "message": "..." }
```

**Error:**

```json
{ "success": false, "error": "Descripción del error" }
```

La autenticación usa `Authorization: Bearer <token>` en el header.

---

## Scripts disponibles

| Script              | Comando                           | Descripción             |
| ------------------- | --------------------------------- | ----------------------- |
| `npm start`         | `node server.js`                  | Inicia en producción    |
| `npm run dev`       | `nodemon server.js`               | Inicia en desarrollo    |
| `npm run db:schema` | `psql ... -f database/schema.sql` | Crea las 19 tablas      |
| `npm run db:seeds`  | `psql ... -f database/seeds.sql`  | Inserta datos iniciales |

---

## Estado del proyecto

| Sprint   | Módulo                                                   | Estado     |
| -------- | -------------------------------------------------------- | ---------- |
| Sprint 1 | Fundación (auth, catálogos, schema, seeds)               | Completado |
| Sprint 2 | Gestión de Estudiantes (CRUD, importación Excel)         | Completado |
| Sprint 3 | Gestión de Trámites (estados, historial, cierre)         | Completado |
| Sprint 4 | Gestión de Hitos (estados, avance automático, historial) | Completado |
| Sprint 5 | Gestión de Documentos (subida, aprobación, versionado)   | Completado |
| Sprint 6 | Generación de Documentos Word (FPP2, Carta de Petición, FPP3) | Completado |
