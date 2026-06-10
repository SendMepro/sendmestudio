// ================================================================
// lib/security/audit-log.ts — Security audit logging
// ================================================================
// Registra eventos de seguridad para trazabilidad.
// No loggea tokens, cookies ni datos sensibles.
// ================================================================

export type SecurityEventType =
  | "bola_attempt"
  | "tenantid_override_attempt"
  | "field_override_attempt"
  | "ssrf_blocked"
  | "admin_access_denied"
  | "mass_assignment_blocked"
  | "upload_type_blocked";

export interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  tenantId?: string;
  targetId?: string;
  field?: string;
  ip?: string;
  path?: string;
  method?: string;
  detail?: string;
}

const SENSITIVE_KEYS = [
  "token", "secret", "password", "authorization", "cookie",
  "accessToken", "refreshToken", "apiKey", "privateKey",
];

function sanitizeMeta(meta: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    const lowerKey = k.toLowerCase();
    if (SENSITIVE_KEYS.some((sk) => lowerKey.includes(sk))) {
      safe[k] = "[REDACTED]";
    } else if (typeof v === "string" && v.length > 500) {
      safe[k] = v.substring(0, 500) + "...";
    } else {
      safe[k] = v;
    }
  }
  return safe;
}

/**
 * Loggea un evento de seguridad a la consola con formato estructurado.
 * En producción, aquí se podría integrar con servicio externo (Sentry, DataDog, etc.)
 */
export function logSecurityEvent(event: SecurityEvent): void {
  const timestamp = new Date().toISOString();
  const entry = {
    timestamp,
    type: event.type,
    userId: event.userId ?? "anonymous",
    tenantId: event.tenantId ?? "none",
    targetId: event.targetId ?? null,
    field: event.field ?? null,
    ip: event.ip ?? null,
    path: event.path ?? null,
    method: event.method ?? null,
    detail: event.detail ?? null,
  };

  console.warn(`[SECURITY] ${JSON.stringify(sanitizeMeta(entry as any))}`);
}

/**
 * Loggea intento de BOLA (acceso a recurso de otro tenant)
 */
export function logBolaAttempt(params: {
  userId?: string;
  tenantId?: string;
  targetId?: string;
  path?: string;
  method?: string;
  detail?: string;
}): void {
  logSecurityEvent({
    type: "bola_attempt",
    ...params,
  });
}

/**
 * Loggea intento de un usuario normal de modificar su tenantId
 */
export function logTenantOverrideAttempt(params: {
  userId?: string;
  tenantId?: string;
  providedTenantId?: string;
  path?: string;
}): void {
  logSecurityEvent({
    type: "tenantid_override_attempt",
    detail: `User tried to override tenantId: provided=${params.providedTenantId}`,
    ...params,
  });
}

/**
 * Loggea SSRF bloqueado
 */
export function logSsrfBlocked(params: {
  url?: string;
  ip?: string;
  detail?: string;
}): void {
  logSecurityEvent({
    type: "ssrf_blocked",
    detail: `Blocked URL: ${params.url}`,
    ...params,
  });
}

/**
 * Loggea intento de modificar campos protegidos (role, isAdmin, etc.)
 */
export function logFieldOverrideAttempt(params: {
  userId?: string;
  tenantId?: string;
  field?: string;
  path?: string;
  detail?: string;
}): void {
  logSecurityEvent({
    type: "field_override_attempt",
    ...params,
  });
}
