// ================================================================
// hooks/useTenant.ts — Tenant hook
// Expone tenantId, businessName, y helpers multi-tenant.
// ================================================================

"use client";

import { useAuth } from "./useAuth";

export interface TenantInfo {
  tenantId: string | null;
  businessName: string | null;
  slug: string | null;
  role: string | null;
  isSuperAdmin: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isViewer: boolean;
}

export function useTenant(): TenantInfo {
  const { tenantId, role, isSuperAdmin } = useAuth();

  return {
    tenantId,
    businessName: null, // se resuelve desde /api/auth/session en el futuro
    slug: null,         // se resuelve desde /api/auth/session en el futuro
    role,
    isSuperAdmin,
    isOwner: role === "owner",
    isAdmin: role === "admin" || role === "owner",
    isStaff: role === "staff",
    isViewer: role === "viewer",
  };
}
