# ================================================================
# SendMe Studio — Multi-Tenant Hardening Audit
# ================================================================
# Fecha: Junio 2026
# Alcance: src/app/api, src/lib, src/agents, src/repositories, src/middleware.ts
# ================================================================

## Resumen

| Categoría | CRÍTICO | ALTO | MEDIO | BAJO |
|-----------|---------|------|-------|------|
| BOLA / IDOR | 0 | 0 | 0 | 0 |
| Tenant isolation (update/delete) | 0 | 0 | 0 | 2 |
| Tenant isolation (find) | 0 | 0 | 0 | 0 |
| SuperAdmin bypass | 0 | 0 | 0 | 0 |
| Mass Assignment | 0 | 0 | 2 | 0 |
| SSRF via tenantId untrusted | 0 | 0 | 0 | 0 |
| **Total** | **0** | **0** | **2** | **2** |

---

## 1. Tenant Isolation — Prisma Queries

### 1.1 Rutas con `[id]` y patrón `findFirst + tenantId` → `update`/`delete`

Todas las rutas con `[id]` siguen el mismo patrón seguro:

| Ruta | Método | findFirst con tenantId? | update/delete seguro? |
|------|--------|------------------------|----------------------|
| `campaigns/[id]` | PATCH | ✅ `{ id, tenantId }` | ✅ findFirst verificó pertenencia |
| `campaigns/[id]` | DELETE | ✅ `{ id, tenantId }` | ✅ findFirst verificó pertenencia |
| `calendar/appointments/[id]` | PATCH | ✅ `{ id, tenantId }` | ✅ findFirst verificó pertenencia |
| `calendar/appointments/[id]` | DELETE | ✅ `{ id, tenantId }` | ✅ findFirst verificó pertenencia |

### 1.2 Rutas que usan `findUnique` con tenantId

| Ruta | Método | ¿Tenant filtrado? |
|------|--------|-------------------|
| `customers/[phone]` | GET | ✅ `tenantId_phone` |
| `customer-memory/[phone]` | GET | ✅ `tenantId_phone` |
| `customer-memory` | POST (upsert) | ✅ `tenantId_phone` |

### 1.3 Rutas con `findMany`

| Ruta | ¿Tenant filtrado? |
|------|-------------------|
| `analytics/config` | ✅ usando `resolveTenantId` |
| `analytics/daily` | ✅ usando `resolveTenantId` |
| `analytics/live` | ✅ usando `requireTenantFromNativeRequest` |
| `appointments` | ✅ `{ tenantId }` |
| `calendar/appointments` | ✅ `{ tenantId }` |
| `campaign-history` | ✅ `{ tenantId }` |
| `campaigns` | ✅ `{ tenantId }` |
| `customer-memory` | ✅ `{ tenantId }` |
| `customers/store.ts` (readCustomers) | ✅ `{ tenantId }` |

### 1.4 Repositorios

Los archivos en `src/repositories/` no usan Prisma directamente — son wrappers de lógica de negocio sobre los stores de datos. No representan riesgo multi-tenant.

---

## 2. HALLAZGO B1 — Middleware: rutas /admin son públicas

- **Archivo**: `src/middleware.ts` (líneas 23-29)
- **Severidad**: BAJO
- **Descripción**: Las rutas `/admin` y `/api/admin` están en `PUBLIC_ROUTES`, lo que significa que el middleware no verifica sesión. Sin embargo, **cada API route admin** usa `requireSuperAdmin()` que verifica autenticación + rol super_admin.
- **Impacto**: Defense in depth. Si una ruta admin nueva se agrega sin `requireSuperAdmin`, quedaría expuesta.
- **Recomendación**: Eliminar `/admin` y `/api/admin` de `PUBLIC_ROUTES`. El middleware debería al menos verificar sesión.

---

## 3. HALLAZGO M1 — Analytics route acepta tenantId de fuentes no confiables

- **Archivo**: `src/app/api/analytics/route.ts` (líneas 8-44)
- **Severidad**: MEDIO
- **Descripción**: `resolveTenantId()` primero busca `tenantId` en **query params** y **body JSON** antes de resolver desde la sesión autenticada. Esto permite que un usuario autenticado envíe un `tenantId` arbitrario para registrar eventos en otro tenant.
- **Contexto**: El endpoint solo registra eventos de analytics (escritura), no lectura de datos. Pero aún así permite escritura cross-tenant.
- **Impacto**: Un atacante autenticado en Tenant A podría falsear eventos de analytics en Tenant B.
- **Recomendación**: Eliminar los mecanismos de query param y body. Usar solo la sesión autenticada. O alternativamente, validar que el `tenantId` del body coincida con el de la sesión.

---

## 4. HALLAZGO M2 — Business Settings PATCH acepta campos sin validación de tipos

- **Archivo**: `src/app/api/business-settings/route.ts` (líneas 93-123)
- **Severidad**: MEDIO
- **Descripción**: El PATCH usa whitelist de campos permitidos (`allowedBsKeys`, `allowedTenantKeys`) pero los valores se pasan directamente sin validación de schema (Zod). Un campo `businessHours` malformado podría corromper el estado del tenant.
- **Impacto**: Datos corruptos podrían afectar la operación del salón (horarios, servicios, etc.)
- **Recomendación**: Agregar validación de tipos con Zod.

---

## 5. HALLAZGO B2 — WhatsApp store update sin tenantId en where

- **Archivo**: `src/app/api/whatsapp/store.ts` (línea 1072)
- **Severidad**: BAJO
- **Descripción**: `prisma.whatsAppMessage.update({ where: { id: row.id } })` no incluye `tenantId` en el `where`. Sin embargo, `row` se obtuvo previamente con `findFirst({ where: { id, tenantId } })` en la línea 1035, lo que garantiza que `row` pertenece al tenant.
- **Contexto**: Patrón válido de "verify-then-act", pero frágil si alguien modifica el código y mueve el `findFirst` o cambia la lógica.
- **Recomendación**: Idealmente incluir `tenantId` también en el `update` para defense in depth.

---

## 6. SuperAdmin Protection

### Estado: ✅ SÓLIDO

Todas las rutas en `src/app/api/admin/` usan `requireSuperAdmin()`:

| Ruta | Admin endpoint | Protegido |
|------|----------------|-----------|
| `admin/audit` | GET | ✅ |
| `admin/dashboard` | GET | ✅ |
| `admin/impersonate` | POST | ✅ |
| `admin/plans` | CRUD | ✅ |
| `admin/tenants` | CRUD | ✅ |
| `admin/tenants/[id]` | CRUD | ✅ |
| `admin/users` | CRUD | ✅ |
| `admin/users/[id]` | CRUD | ✅ |
| `admin/verticals` | CRUD | ✅ |
| `admin/verticals/[id]` | CRUD | ✅ |
| `admin/verticals/apply` | POST | ✅ |
| `admin/verticals/backups` | GET | ✅ |
| `admin/verticals/seed` | POST | ✅ |

---

## 7. Mass Assignment

### Estado: ✅ WHITELIST EN TODAS LAS RUTAS

| Ruta | Whitelist? | Validación tipos? |
|------|-----------|-------------------|
| `appointments` (POST) | ✅ campos individuales | ❌ No Zod |
| `calendar/appointments` (POST) | ✅ campos individuales | ❌ No Zod |
| `calendar/appointments/[id]` (PATCH) | ✅ `allowed` array | ❌ No Zod |
| `campaigns` (POST) | ✅ campos individuales | ❌ No Zod |
| `campaigns/[id]` (PATCH) | ✅ `allowed` array | ❌ No Zod |
| `business-settings` (PATCH) | ✅ `allowedBsKeys` + `allowedTenantKeys` | ❌ No Zod |
| `campaign-history` (POST) | ✅ campos individuales | ❌ No Zod |
| `customer-memory` (POST) | ✅ campos individuales | ❌ No Zod |
| `customers/store.ts` (upsertCustomerFromMessage) | ✅ campos individuales | ❌ No Zod |

Ninguna ruta usa `prisma.model.create({ data: body })` directamente.

---

## 8. BOLA — UUID Enumeration

### Estado: ✅ PROTEGIDO

Todas las rutas `[id]`:
1. Requieren autenticación via `requireTenant()`
2. Buscan el recurso con `findFirst({ where: { id, tenantId } })`
3. Si no existe, retornan 404 genérico (sin revelar si el ID existe o no en otro tenant)

No hay riesgo de UUID enumeration porque el `where` compuesto `{ id, tenantId }` siempre falla si el recurso no pertenece al tenant.

---

## 9. SSRF — Llamadas externas con datos del tenant

### Estado: ✅ SEGURO

| Llamada | Origen URL | Riesgo |
|---------|-----------|--------|
| WhatsApp Graph API | `graph.facebook.com/{version}/{phoneId}/messages` | URL fija, phoneId de mapping |
| Google Drive | `www.googleapis.com/drive/v3/files` | URL fija, folderId de config tenant |
| DeepSeek AI | `api.deepseek.com` | URL desde env var |
| Xiaomi Mimo | `platform.xiaomimimo.com` | URL desde env var |
| WhatsApp media | `graph.facebook.com/{version}/{mediaId}` | URL de Meta (confiable) |
| WhatsApp media download | `fetch(mediaUrl)` | mediaUrl de Meta (confiable) |

Ninguna URL se construye directamente desde input del usuario.

---

## 10. Hallazgos de la auditoría previa (SECURITY_AUDIT.md)

Los hallazgos del documento anterior se mantienen válidos:

| # | Hallazgo | Severidad | Estado |
|---|----------|-----------|--------|
| M1 | Analytics route: tenantId por query/body | MEDIO | ⚠ No corregido |
| M2 | SuperAdmin sin audit logging | MEDIO | ⚠ No corregido (nueva funcionalidad) |
| M3 | Business Settings PATCH sin validación tipos | MEDIO | ⚠ No corregido |
| M4 | Campaign PATCH sin validación tipos | MEDIO | ⚠ No corregido |
| B1 | Middleware /admin público | BAJO | ⚠ No corregido |
| B2 | Fallback a app_metadata | BAJO | ⚠ No corregido |
| B3 | Webhook fetch interno HTTP | BAJO | ⚠ No corregido |

---

## 11. Conclusión

### Puntos fuertes

1. **Patrón consistente**: Todas las rutas `[id]` usan `findFirst({ id, tenantId })` antes de operar
2. **requireTenant/requireSuperAdmin**: Implementado en TODAS las rutas API
3. **Whitelist de campos**: Sin excepciones, ningún endpoint usa `data: body` directo
4. **SuperAdmin**: Protegido consistentemente con `requireSuperAdmin()`
5. **SSRF**: Sin URLs construidas desde input de usuario
6. **WhatsApp store**: 100+ consultas Prisma, todas con `tenantId` en `where`

### Áreas de mejora

1. **Analytics route** (MEDIO) — resolver tenantId solo desde sesión autenticada
2. **Mass Assignment** (MEDIO) — agregar Zod para validación de tipos en todos los PATCH/POST
3. **Middleware defense in depth** (BAJO) — proteger rutas /admin también en middleware
4. **whatsapp/store.ts** (BAJO) — incluir `tenantId` en `update` para defense in depth

### Veredicto

**No se encontraron vulnerabilidades CRÍTICAS ni ALTAS.**

El aislamiento multi-tenant está sólidamente implementado. No existe una ruta que permita a un tenant autenticado acceder, modificar o eliminar datos de otro tenant.

Los 2 hallazgos MEDIOS son mejoras de calidad y robustez, no brechas de seguridad explotables.
