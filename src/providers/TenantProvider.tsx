// ================================================================
// providers/TenantProvider.tsx — Tenant context provider
// Provee información del tenant activo a toda la app.
// ================================================================

"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useTenant, type TenantInfo } from "@/hooks/useTenant";

const TenantContext = createContext<TenantInfo | null>(null);

export function TenantProvider({ children }: { children: ReactNode }) {
  const tenant = useTenant();

  return (
    <TenantContext.Provider value={tenant}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenantContext(): TenantInfo {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenantContext debe usarse dentro de un TenantProvider");
  }
  return context;
}
