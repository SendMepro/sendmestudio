# ================================================================
# SendMe Studio — Security P0 Hardening Report
# ================================================================
# Fecha: Junio 2026
# Branch: security/p0-hardening
# ================================================================

## A. Resumen de cambios

| # | Hallazgo / Mejora | Archivos modificados | Severidad |
|---|-------------------|---------------------|-----------|
| 1 | Analytics route: resolveTenantId prioriza sesión | `src/app/api/analytics/route.ts` | MEDIO |
| 2 | Zod strict() en Business Settings PATCH | `src/app/api/business-settings/route.ts` | MEDIO |
| 3 | Zod strict() en Campaigns PATCH | `src/app/api/campaigns/[id]/route.ts` | MEDIO |
| 4 | /admin quitado de PUBLIC_ROUTES en middleware | `src/middleware.ts` | BAJO |
| 5 | Headers de seguridad (CSP, XFO, etc.) | `src/middleware.ts` | BAJO |
| 6 | SSRF helper | `src/lib/security/ssrf.ts` (nuevo) | ALTO |
| 7 | Audit log helper | `src/lib/security/audit-log.ts` (nuevo) | MEDIO |
| 8 | Mass Assignment: rejección de campos prohibidos | `business-settings`, `campaigns/[id]` | MEDIO |

---

## B. Archivos creados

| Archivo | Líneas | Propósito |
|---------|--------|-----------|
| `src/lib/security/ssrf.ts` | 198 | Safe fetch wrapper: solo https, bloquea IPs internas |
| `src/lib/security/audit-log.ts` | 133 | Security event logging (BOLA, override, SSRF, etc.) |

## C. Archivos modificados

| Archivo | Cambios |
|---------|---------|
| `src/app/api/analytics/route.ts` | resolveTenantId: sesión primero, body/query solo para super admin, audit log |
| `src/app/api/business-settings/route.ts` | Zod schemas strict con validación de tipos, campos prohibidos bloqueados |
| `src/app/api/campaigns/[id]/route.ts` | Zod strict schema, campos prohibidos bloqueados, tipos validados |
| `src/middleware.ts` | /admin quitado de PUBLIC_ROUTES, security headers agregados |

---

## D. Cambios aplicados en detalle

### 1. Analytics route (MEDIO → CORREGIDO)

**Antes**: `resolveTenantId()` primero buscaba tenantId en query params y body JSON, luego en sesión.

**Después**:
- Primero resuelve sesión Supabase
- Si el usuario NO es super admin y envía tenantId en query → rechaza y loggea intento
- Si el usuario NO es super admin y envía tenantId distinto en body → loggea intento
- Super admin puede overridear tenantId por query param (útil para debugging)
- Se agregó validación de tipos (`typeof` check)

### 2. Business Settings PATCH (MEDIO → CORREGIDO)

**Antes**: Whitelist de campos sin validación de tipos.

**Después**:
- Zod schema strict con validación de tipos
- `logoUrl`, `bannerUrl`, `faviconUrl` validados como URLs
- `minimumBufferMinutes` validado como `number.int().min(0)`
- `lastAcceptedTime` validado como `string`
- Rechaza campos desconocidos gracias a `.strict()`
- Bloquea campos prohibidos: `tenantId`, `role`, `isAdmin`, `permissions`, etc.

### 3. Campaigns PATCH (MEDIO → CORREGIDO)

**Antes**: Whitelist sin validación de tipos.

**Después**:
- Zod schema strict
- `name`: `string().min(1).max(200)`
- `status`: `enum(["draft", "active", "paused", "completed", "cancelled"])`
- `targetCount`, `estimatedMessages`: `number().int().min(0)`
- Bloquea campos prohibidos

### 4. Middleware PUBLIC_ROUTES (BAJO → CORREGIDO)

**Antes**: `/admin`, `/api/admin` y subrutas estaban en PUBLIC_ROUTES.

**Después**: Eliminadas de PUBLIC_ROUTES. Ahora el middleware verifica sesión antes de llegar a admin pages. Las API routes admin mantienen su propia protección con `requireSuperAdmin()`.

### 5. Security Headers (NUEVO)

Agregados en middleware vía `addSecurityHeaders()`:
- `Content-Security-Policy`: default-src 'self', frame-ancestors 'none'
- `X-Frame-Options`: DENY
- `X-Content-Type-Options`: nosniff
- `Referrer-Policy`: strict-origin-when-cross-origin
- `Permissions-Policy`: cámara, micrófono, geolocalización deshabilitados
- `X-DNS-Prefetch-Control`: off

### 6. SSRF Helper (NUEVO)

`src/lib/security/ssrf.ts`:
- Solo permite URLs `https:`
- Bloquea protocolos: `file:`, `gopher:`, `ftp:`, `dict:`, `ldap:`, `data:`, `blob:`
- Bloquea hostnames internos: localhost, 127.0.0.1, 0.0.0.0, ::1
- Bloquea rangos RFC 1918: 10.x, 172.16-31.x, 192.168.x
- Bloquea cloud metadata: 169.254.169.254
- Bloquea CGNAT: 100.64.x
- Timeout configurable (default 10s)
- Control de redirects
- `safeServerFetch()` wrapper y `validateUrlSafety()` para validación sin request

### 7. Audit Log Helper (NUEVO)

`src/lib/security/audit-log.ts`:
- `logSecurityEvent()` — event genérico
- `logBolaAttempt()` — intento de BOLA/IDOR
- `logTenantOverrideAttempt()` — intento de cambiar tenantId
- `logFieldOverrideAttempt()` — intento de cambiar campos protegidos
- `logSsrfBlocked()` — SSRF bloqueado
- Sanitiza tokens/contraseñas antes de loggear
- Trunca strings >500 chars

### 8. Mass Assignment Hardening

En `business-settings` y `campaigns/[id]`:
- Lista `BLOCKED_FIELDS` con campos que nunca deben venir del frontend
- Si se detecta un campo prohibido → 400 + audit log
- Zod `.strict()` rechaza cualquier campo no definido en el schema

---

## E. Tests de seguridad

No se agregaron tests automatizados (no existe framework de test en el proyecto).
Se documentan los comandos de validación manual:

```bash
# Test: Analytics route rechaza tenantId override
curl -X POST https://app.sendmestudio.com/api/analytics \
  -H "Authorization: Bearer <token_tenant_a>" \
  -H "Content-Type: application/json" \
  -d '{"tenantId":"tenant-b","conversationId":"xxx","type":"test"}'
# Debe usar tenantId del token, ignorando el del body

# Test: tenantId en query param para no-admin
curl -X POST "https://app.sendmestudio.com/api/analytics?tenantId=tenant-b" \
  -H "Authorization: Bearer <token_tenant_a>"
# Debe ignorar query param

# Test: Campaign PATCH con campo desconocido
curl -X PATCH https://app.sendmestudio.com/api/campaigns/<id> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"test","hackedField":"malicious"}'
# Debe responder 400

# Test: Campaign PATCH con tenantId
curl -X PATCH https://app.sendmestudio.com/api/campaigns/<id> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"tenantId":"other-tenant"}'
# Debe responder 400

# Test: Business Settings PATCH con tipo inválido
curl -X PATCH https://app.sendmestudio.com/api/business-settings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"minimumBufferMinutes":"string-en-vez-de-numero"}'
# Debe responder 400

# Test: Business Settings PATCH con campo prohibido
curl -X PATCH https://app.sendmestudio.com/api/business-settings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"role":"super_admin"}'
# Debe responder 400

# Test: Business Settings PATCH con campo desconocido
curl -X PATCH https://app.sendmestudio.com/api/business-settings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"unknownField":"test"}'
# Debe responder 400

# Test: SSRF validation (unit test via curl mock o script)
# validateUrlSafety("http://169.254.169.254/latest/meta-data/") debe retornar error
# validateUrlSafety("file:///etc/passwd") debe retornar error
# validateUrlSafety("https://api.deepseek.com/chat") debe retornar null (safe)

# Test: Security headers
curl -sI https://app.sendmestudio.com | grep -i "x-frame-options\|content-security-policy\|x-content-type-options"
# Debe mostrar todos los headers

# Test: Página admin sin sesión
curl -s -o /dev/null -w "%{http_code}" https://app.sendmestudio.com/admin
# Debe redirigir a /login (302)
```

---

## F. Comandos ejecutados

```bash
npm run build   # ✅ Éxito: 49 páginas, 87 API routes, 0 errores
npx tsc --noEmit # ✅ 0 errores
```

---

## G. Resultado final

| Item | Estado |
|------|--------|
| TypeScript check | ✅ 0 errores |
| Build | ✅ 49 páginas, 87 API routes |
| Hallazgos corregidos | 4/4 (MEDIOS y BAJOS) |
| Nuevos helpers de seguridad | 2 (ssrf.ts, audit-log.ts) |
| Security headers | ✅ Agregados en middleware |
| Mass Assignment hardening | ✅ Zod strict + BLOCKED_FIELDS |
| BOLA/IDOR hardening | ✅ Analytics: tenantId solo desde sesión |
| Tests automatizados | ❌ No hay framework de test |
| Commit | `[hash]` en `security/p0-hardening` |

## H. Pendientes para próximas iteraciones

1. **SSRF aplicar en fetches externos**: Reemplazar `fetch()` en `sender.ts`, `customer-assets.ts` y `webhook/route.ts` por `safeServerFetch()`.
2. **SuperAdmin audit logging**: Implementar registro de acciones de super admin.
3. **Upload hardening**: Revisar endpoints de upload (customer-assets, knowledge/upload, brain-admin/upload).
4. **Tests automatizados**: Implementar framework de test (Vitest) y agregar tests de seguridad.
5. **Strict-Transport-Security**: Configurar en Nginx (no en Next.js middleware).
