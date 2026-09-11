# database/migrations/ — Historial de desarrollo

> **No se ejecutan en una instalación nueva.**
> Para instalar el sistema desde cero usa únicamente `database/schema.sql` + `database/seeds.sql`
> (ver el README principal del backend, sección "Configuración inicial").

## ¿Qué es esta carpeta?

Estos scripts se usaron durante el desarrollo para llevar una base de datos
**ya existente** (con datos de prueba) al estado que introdujo cada cambio
estructural, sin tener que recrearla desde cero. Todo lo que hacen ya está
incorporado en `schema.sql` y `seeds.sql`.

| Archivo | Qué introdujo | Ya incluido en |
|---|---|---|
| `RBAC_01_permisos_dinamicos.sql` | Tablas `funcionalidades` y `roles_funcionalidades` | `schema.sql` |
| `RBAC_02_seeds_funcionalidades.sql` | Catálogo de 33 funcionalidades + matriz inicial por rol | `seeds.sql` |
| `cleanup_01_tipos_convenio.sql` | Elimina tipos de convenio residuales no usados | `seeds.sql` (nunca los inserta) |

Se conservan como referencia histórica del proceso de desarrollo (útil para
trazabilidad de tesis), no como parte del flujo de instalación.
