// ================================================================
// providers/AuthProvider.tsx — Auth context provider
// Provee estado de autenticación a toda la app.
// ================================================================

"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useAuth, type UseAuthResult } from "@/hooks/useAuth";

const AuthContext = createContext<UseAuthResult | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): UseAuthResult {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext debe usarse dentro de un AuthProvider");
  }
  return context;
}
