# Demo Credentials - SendMe Studio

## Super Admin (Plataforma)

| Campo | Valor |
|---|---|
| Email | `super@sendmestudio.cl` |
| Password | `SuperAdmin2026!` |
| Rol | `super_admin` |
| Tenant | Ninguno |
| Ruta esperada | `/admin` |
| Acceso | Dashboard admin global, gestión de tenants, usuarios, licencias |

## Platform Admin (Plataforma)

| Campo | Valor |
|---|---|
| Email | `admin.platform@sendmestudio.cl` |
| Password | `PlatformAdmin2026!` |
| Rol | `platform_admin` |
| Tenant | Ninguno |
| Ruta esperada | `/admin` |
| Acceso | Dashboard admin global, gestión de tenants, usuarios, licencias |

## Maite Guerra Beauty Studio

### Owner

| Campo | Valor |
|---|---|
| Email | `owner.maiteguerra@sendmestudio.cl` |
| Password | `MaiteOwner2026!` |
| Rol | `owner` |
| Tenant | Maite Guerra Beauty Studio |
| Ruta esperada | `/` (Home tenant) |
| Acceso | Full del tenant: inbox, analytics, calendario, campañas, etc. |

### Admin / Staff Admin

| Campo | Valor |
|---|---|
| Email | `admin.maiteguerra@sendmestudio.cl` |
| Password | `MaiteAdmin2026!` |
| Rol | `admin` |
| Tenant | Maite Guerra Beauty Studio |
| Ruta esperada | `/` (Home tenant) |
| Acceso | Gestión del tenant sin permisos de owner |

## Barber Kings Studio

### Owner

| Campo | Valor |
|---|---|
| Email | `owner.barberkings@sendmestudio.cl` |
| Password | `BarberOwner2026!` |
| Rol | `owner` |
| Tenant | Barber Kings Studio |
| Ruta esperada | `/` (Home tenant) |
| Acceso | Full del tenant |

### Admin / Staff Admin

| Campo | Valor |
|---|---|
| Email | `admin.barberkings@sendmestudio.cl` |
| Password | `BarberAdmin2026!` |
| Rol | `admin` |
| Tenant | Barber Kings Studio |
| Ruta esperada | `/` (Home tenant) |
| Acceso | Gestión del tenant sin permisos de owner |

---

## Rutas esperadas después de login

| Rol | Ruta | Comportamiento |
|---|---|---|
| `super_admin` | `/admin` | Dashboard admin global |
| `platform_admin` | `/admin` | Dashboard admin global |
| `owner` | `/` | Home del tenant con datos del negocio |
| `admin` | `/` | Home del tenant con datos del negocio |
| `staff` | `/` | Home del tenant con datos del negocio |
| Sin tenant | `/onboarding` | Pantalla de registro/onboarding |

## Notas

- `admin@sendmestudio.cl` / `Admin2026!` es **legacy** — no usar como credencial principal.
- Si no existe el tenant "Barber Kings Studio", ejecutar primero `npx tsx scripts/seed-barber-kings.ts`.
- Ejecutar `npx tsx scripts/seed-demo-credentials.ts` para crear/actualizar todas las credenciales demo.
- Las contraseñas pueden actualizarse ejecutando el seed nuevamente (es idempotente).
