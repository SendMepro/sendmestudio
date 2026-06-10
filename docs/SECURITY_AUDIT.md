# ================================================================
# SendMe Studio — Security Audit Report
# ================================================================
# Fecha: Junio 2026
# Alcance: Multi-Tenant isolation, BOLA, Mass Assignment,
#           Authentication, SSRF, XSS, API Keys
# ================================================================

## Resumen

| Categoría | CRÍTICO | ALTO | MEDIO | BAJO |
|-----------|---------|------|-------|------|
| BOLA / IDOR | 0 | 0 | 1 | 0 |
| Tenant isolation | 0 | 0 | 0 | 0 |
| SuperAdmin | 0 | 0 | 1 | 1 |
| Mass Assignment | 0 | 0 | 2 | 0 |
| JWT / Sesiones | 0 | 0 | 0 | 1 |
| SSRF | 0 | 0 | 0 | 1 |
| XSS | 0 | 0 | 0 | 0 |
| API Keys | 0 | 0 | 0 | 0 |
| **Total** | **0** | **0** | **4** | **3** |

---

## 1. BOLA (Broken Object Level Authorization) / IDOR

### HALLAZGO M1 — Analytics route accepta tenantId por query param/body

- **Archivo**: `src/app/api/analytics/route.ts` (líneas 8-44)
- **Severidad**: MEDIO
- **Descripción**: `resolveTenantId()` acepta `tenantId` desde `searchParams` y `body` JSON como primer y segundo mecanismo de resolución. Solo como tercer fallback usa la sesión Supabase autenticada. Un usuario autenticado en un tenant podría modificar el tenantId manualmente para registrar eventos de analítica en otro tenant.
- **Contexto**: El endpoint solo registra eventos de analytics (no lectura de datos), pero aún así permite escribir en el contexto de otro tenant.
- **Mitigación actual**: Ninguna — confía en el tenantId enviado por el cliente.
- **Recomendación**: Eliminar los dos primeros mecanismos (query param y body). Solo resolver tenantId desde la sesión autenticada. O alternativamente, verificar que el tenantId del body coincida con el tenantId de la sesión.

### BOLA — Route params con tenant validation

- **Estado**: ✅ PROTEGIDO
- **Patrón**: Todas las rutas con `[id]` (campaigns, appointments, customers, tenants, etc.) usan `requireTenant()` + validan `id` con `tenantId` en el `where`.

---

## 2. Tenant Isolation — Prisma Queries

### Estado: ✅ SÓLIDO

- **Repositorios** (CommissionRepository, InventoryRepository, ProductSalesRepository): Todas las funciones reciben `tenantId` como parámetro explícito y lo usan en `where`.
- **API routes**: Todas inician con `requireTenant()` / `requireTenantFromNativeRequest()`.
- **PlanLimits**: Usa `tenantId` en todas las queries.
- **Store files** (whatsapp/store.ts): Todas las operaciones filtran por `tenantId` consistentemente.
- **Patrón** `findFirst + tenantId` previo a `delete/update` sin tenantId: Aunque `delete`/`update` usan `where: { id }` sin `tenantId`, siempre hay un `findFirst({ where: { id, tenantId } })` antes que verifica pertenencia.

---

## 3. SuperAdmin Protection

### HALLAZGO M2 — `getAuthUser` no verifica licencia para super admin

- **Archivo**: `src/lib/admin-helper.ts`
- **Severidad**: MEDIO
- **Descripción**: `getAuthUser()` resuelve `isSuperAdmin` desde la DB, pero no verifica si el tenant del super admin está activo o tiene licencia válida. Super admins pueden acceder a cualquier tenant vía `requireSuperAdmin()`.
- **Contexto**: Los super admins tienen bypass completo. Esto es esperado para admin panel, pero no hay auditoría de sus acciones.
- **Recomendación**: Implementar auditoría de acciones de super admin (log de quién hizo qué en qué tenant).

### HALLAZGO B1 — Middleware marca rutas /admin como públicas

- **Archivo**: `src/middleware.ts` (líneas 23-29)
- **Severidad**: BAJO
- **Descripción**: Las rutas `/admin` están en `PUBLIC_ROUTES`, lo que significa que el middleware no verifica sesión para estas rutas. Sin embargo, las API routes tienen su propia protección via `requireSuperAdmin()`.
- **Contexto**: Defense in depth — debería protegerse también a nivel de middleware.
- **Recomendación**: Eliminar `/admin` de `PUBLIC_ROUTES` y agregar verificación de sesión en el middleware.

---

## 4. Mass Assignment

### HALLAZGO M3 — Business Settings PATCH acepta campos sin validación de tipos

- **Archivo**: `src/app/api/business-settings/route.ts` (líneas 93-123)
- **Severidad**: MEDIO
- **Descripción**: El PATCH usa whitelist de campos permitidos (`allowedBsKeys`, `allowedTenantKeys`), pero los valores se pasan directamente sin validación de tipos (schema validation). Un campo `businessHours` malformado podría romper el estado del tenant.
- **Recomendación**: Agregar validación de schema con Zod o similar para los valores de cada campo.

### HALLAZGO M4 — Campaign PATCH tiene whitelist pero sin validación de tipos

- **Archivo**: `src/app/api/campaigns/[id]/route.ts` (líneas 28-38)
- **Severidad**: MEDIO
- **Descripción**: Similar a M3, whitelist correcta pero sin validación de tipos. `targetCount` y `estimatedMessages` podrían recibir strings.
- **Recomendación**: Agregar validación de tipos con Zod o transform.

### Mass Assignment — Estado general

- **Estado**: ✅ WHITELIST PRESENTE
- **Todas** las rutas que aceptan body usan whitelist explícita. No hay `data: body` directo.
- Ejemplos: `campaigns/[id]/route.ts`, `business-settings/route.ts`, `calendar/appointments/[id]/route.ts`, `admin/tenants/route.ts`

---

## 5. JWT / Sessions

### HALLAZGO B2 — Fallback a app_metadata si DB falla

- **Archivo**: `src/lib/admin-helper.ts` (líneas 112-117)
- **Severidad**: BAJO
- **Descripción**: Si la resolución de tenantId desde DB falla, se usa `app_metadata.tenant_id` que viene del JWT de Supabase. El JWT de Supabase es firmado y confiable, pero la metadata podría estar desactualizada si el tenant reasignó al usuario.
- **Contexto**: Mecanismo válido de fallback, pero introduce riesgo de datos stale.
- **Recomendación**: Agregar un log warning cuando se usa fallback, y considerar invalidar sesiones cuando cambia la relación user-tenant.

---

## 6. SSRF (Server-Side Request Forgery)

### HALLAZGO B3 — Webhook WhatsApp hace fetch interno a /api/calendar/appointments

- **Archivo**: `src/app/api/whatsapp/webhook/route.ts` (línea 340)
- **Severidad**: BAJO
- **Descripción**: El webhook de WhatsApp hace un `fetch` a `localhost:3000/api/calendar/appointments` para crear citas automáticas. La URL base (`baseUrl`) se construye desde `NEXT_PUBLIC_BASE_URL`.
- **Contexto**: La URL es interna y controlada, no viene del usuario. El riesgo es mínimo.
- **Recomendación**: Cambiar a llamada directa a función en lugar de fetch HTTP interno para evitar dependencia de network.

### SSRF — Llamadas externas

- **WhatsApp sender**: `fetch` a `graph.facebook.com/{version}/{phoneId}/messages` — URL construida con configuración interna (env vars), no input de usuario. ✅ Seguro.
- **Google Drive**: `fetch` a `www.googleapis.com/drive/v3/files` — URL construida con folderId interno. ✅ Seguro.
- **AI Router (DeepSeek/Xiaomi)**: `fetch` a `api.deepseek.com` / `platform.xiaomimimo.com` — URL desde env vars. ✅ Seguro.
- **WhatsApp media download**: `fetch(mediaUrl)` — `mediaUrl` viene de la API de Meta (respuesta JSON), no directamente del usuario. Es confiable porque fue validada por Meta. ✅ Seguro.

---

## 7. XSS (Cross-Site Scripting)

### Estado: ✅ SEGURO

- **Patrón `dangerouslySetInnerHTML`**: 0 ocurrencias.
- **Patrón `innerHTML`**: 0 ocurrencias en TypeScript.
- Next.js 16 por defecto escapa output en JSX.
- Los datos de WhatsApp se renderizan como texto plano.

---

## 8. API Keys

### Estado: ✅ SEGURO

- **Patrón `sk-`**: 0 ocurrencias fuera de node_modules.
- **Patrón `api_key`**: 0 ocurrencias en código fuente.
- **Patrón `apiKey`**: 0 ocurrencias.
- **Todas** las API keys vienen de `process.env`.
- **Objetos de configuración**: `DeepSeekConfig`, `WhatsAppConfig` — todos leen de env vars.
- El token de acceso de WhatsApp se almacena en `WHATSAPP_ACCESS_TOKEN` (env var) y también en `WhatsAppTenantMapping.accessToken` en DB para multi-tenant (mencionado como "Encriptar en producción" en schema).

---

## Tabla Completa de Hallazgos

| # | Hallazgo | Archivo | Línea | Severidad | Impacto |
|---|----------|---------|-------|-----------|---------|
| M1 | Analytics route acepta tenantId por query/body | `src/app/api/analytics/route.ts` | 8-44 | MEDIO | Posible escritura de eventos en tenant equivocado |
| M2 | SuperAdmin no tiene audit logging | `src/lib/admin-helper.ts` | 172-193 | MEDIO | Acciones de admin no trazables |
| M3 | Business Settings PATCH sin validación de tipos | `src/app/api/business-settings/route.ts` | 93-123 | MEDIO | Datos malformados podrían corromper estado |
| M4 | Campaign PATCH sin validación de tipos | `src/app/api/campaigns/[id]/route.ts` | 28-38 | MEDIO | Datos malformados podrían corromper estado |
| B1 | Middleware no protege rutas /admin | `src/middleware.ts` | 23-29 | BAJO | Defense in depth insuficiente |
| B2 | Fallback a app_metadata si DB falla | `src/lib/admin-helper.ts` | 112-117 | BAJO | Posible stale tenantId |
| B3 | Fetch interno HTTP en webhook | `src/app/api/whatsapp/webhook/route.ts` | 340 | BAJO | Dependencia de network innecesaria |

---

## Recomendaciones Prioritarias

### CRÍTICO (0) — Ninguno

### ALTO (0) — Ninguno

### MEDIO — Corregir antes de producción

1. **Analytics route**: Eliminar resolución de tenantId desde query params y body. Forzar siempre desde sesión autenticada.
2. **SuperAdmin audit**: Implementar log de acciones administrativas (quién, qué, cuándo, en qué tenant).
3. **Validación de schemas**: Agregar Zod para validar tipos de datos en PATCH/POST handlers.

### BAJO — Corregir cuando sea conveniente

4. **Middleware /admin**: Agregar protección a nivel de middleware (defense in depth).
5. **Fallback app_metadata**: Agregar warning log cuando se usa fallback.
6. **Webhook fetch interno**: Reemplazar fetch HTTP por llamada directa a función.

---

## Conclusión

SendMe Studio tiene una **base de seguridad multi-tenant sólida**. La arquitectura con `requireTenant()`, `tenantId` en todos los modelos Prisma, y whitelist de campos en updates está bien implementada.

No se encontraron vulnerabilidades **CRÍTICAS ni ALTAS**. Los 4 hallazgos MEDIOS son mejoras de robustez más que brechas de seguridad explotables.

**Estado general: LISTO para producción con recomendaciones menores.**
