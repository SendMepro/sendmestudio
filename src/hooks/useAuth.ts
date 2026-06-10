// ================================================================
// hooks/useAuth.ts — Auth hook
// Expone sesión, login, logout, y estado de autenticación.
// Usa Supabase client-side SDK para detectar sesión rápidamente,
// y /api/auth/session como fuente de verdad para DB data.
// ================================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  tenantId: string | null;
  role: string | null;
  is_super_admin: boolean;
  isSuperAdmin: boolean;
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export type UseAuthResult = AuthState & AuthActions;

const EMPTY_STATE: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  tenantId: null,
  role: null,
  is_super_admin: false,
  isSuperAdmin: false,
};

export function useAuth() {
  const [state, setState] = useState<AuthState>(EMPTY_STATE);

  const resolveSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      if (data.ok && data.session) {
        const s = data.session;
        if (s.isAuthenticated) {
          setState({
            user: null,
            isLoading: false,
            isAuthenticated: true,
            tenantId: s.tenantId ?? null,
            role: s.role ?? null,
            is_super_admin: s.is_super_admin === true,
            isSuperAdmin: s.isSuperAdmin === true,
          });
        } else {
          setState({ ...EMPTY_STATE, isLoading: false });
        }
      } else {
        setState({ ...EMPTY_STATE, isLoading: false });
      }
    } catch (err) {
      console.warn("[useAuth] resolveSession failed:", err);
      setState({ ...EMPTY_STATE, isLoading: false });
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();

    // Intentar resolver desde sesión local de Supabase primero
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Hay sesión local — refrescar desde server
        resolveSession();
      } else {
        // No hay sesión — marcar como cargado
        setState({ ...EMPTY_STATE, isLoading: false });
      }
    });

    // Escuchar cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        resolveSession();
      } else {
        setState({ ...EMPTY_STATE, isLoading: false });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [resolveSession]);

  const login = useCallback(async (email: string, password: string) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error) {
      await resolveSession();
    }
    return { error };
  }, [resolveSession]);

  const logout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setState({ ...EMPTY_STATE, isLoading: false });
  }, []);

  return {
    ...state,
    login,
    logout,
    refresh: resolveSession,
  };
}
