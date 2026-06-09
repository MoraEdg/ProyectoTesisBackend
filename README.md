# Backend — Sistema de Gestión de Prácticas Preprofesionales UISEK

**Autor:** Edgar Mora  
**Proyecto de Tesis — Universidad SEK**

| Recurso | Enlace |
|---|---|
| Repositorio Backend | https://github.com/MoraEdg/ProyectoTesisBackend.git |
| Repositorio Frontend | https://github.com/MoraEdg/ProyectoTesisFrontend.git |
| Tablero Jira | https://edgarmoratesis.atlassian.net/jira/software/projects/SCRUM/boards/1/backlog |

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Runtime | Node.js | 20+ |
| Framework | Express | 4.x |
| Base de datos | PostgreSQL | 15+ |
| Autenticación | JWT (jsonwebtoken) | 9.x |
| Hash de contraseñas | bcrypt | 5.x |
| Subida de archivos | multer | 1.x |
| Validación | express-validator | 7.x |
| Generación de documentos | docxtemplater + pizzip | — |
| Procesamiento Excel | xlsx | — |
| Variables de entorno | dotenv | 16.x |

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
    ├── estudiantes/        — (Sprint 2)
    ├── tramites/           — (Sprint 3-4)
    ├── hitos/              — (Sprint 3-4)
    ├── documentos/         — (Sprint 3-4)
    ├── convenios/          — (Sprint 5)
    └── generacion/         — (Sprint 6)
```

---

## Base de datos

**19 tablas** en la base de datos `practicas_db`:

| Grupo | Tablas |
|---|---|
| Catálogos | `roles`, `estados`, `tipos_proceso`, `periodos`, `tipos_convenio` |
| Configuración de flujos | `plantillas_hito`, `tipos_documento` |
| Núcleo | `usuarios`, `estudiantes`, `tramites`, `hitos`, `documentos` |
| Comunicación | `observaciones`, `historial_tramites` |
| Convenios | `convenios`, `archivos_convenio` |
| Generación | `tipos_documento_generado`, `plantillas_documento`, `documentos_generados` |

**Procesos soportados:**
- Prácticas Preprofesionales — 5 hitos
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
```

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

| Campo | Valor |
|---|---|
| Usuario | `admin` |
| Contraseña | `Admin1234` |
| Rol | `Coordinador` |

---

## API — Endpoints disponibles (Sprint 1)

Base URL: `http://localhost:5000/api/v1`

### Autenticación

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/auth/login` | No | Iniciar sesión |
| POST | `/auth/logout` | Sí | Cerrar sesión (stateless) |
| GET | `/auth/me` | Sí | Obtener datos del usuario autenticado |

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

| Método | Ruta | Roles permitidos |
|---|---|---|
| GET | `/catalogos/roles` | Coordinador |
| GET | `/catalogos/estados?categoria=TRAMITE` | Todos |
| GET | `/catalogos/tipos-proceso` | Todos |
| GET | `/catalogos/tipos-convenio` | Coordinador, Director |
| GET | `/catalogos/periodos` | Todos |
| GET | `/catalogos/tipos-documento-generado` | Coordinador, Estudiante |

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

| Script | Comando | Descripción |
|---|---|---|
| `npm start` | `node server.js` | Inicia en producción |
| `npm run dev` | `nodemon server.js` | Inicia en desarrollo |
| `npm run db:schema` | `psql ... -f database/schema.sql` | Crea las 19 tablas |
| `npm run db:seeds` | `psql ... -f database/seeds.sql` | Inserta datos iniciales |

---

## Estado del proyecto

| Sprint | Módulo | Estado |
|---|---|---|
| Sprint 1 | Fundación (auth, catálogos, schema, seeds) | Completado |
| Sprint 2 | Gestión de Estudiantes | Pendiente |
| Sprint 3 | Gestión de Trámites | Pendiente |
| Sprint 4 | Gestión de Hitos y Documentos | Pendiente |
| Sprint 5 | Gestión de Convenios | Pendiente |
| Sprint 6 | Generación de Documentos | Pendiente |
