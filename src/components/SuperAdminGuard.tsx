// ================================================================
// components/SuperAdminGuard.tsx
// Guard component that redirects super admins to /admin
// when they visit tenant-owner routes without impersonation.
// ================================================================

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

type SuperAdminGuardProps = {
  /** Ruta a la que redirigir. Default: "/admin" */
  redirectTo?: string;
  /** Children (opcional) — si no se provee, el guard solo redirige sin renderizar nada */
  children?: React.ReactNode;
  /** Comportamiento: "redirect" (default) o "block" (no renderizar children) */
  behavior?: "redirect" | "block";
};

/**
 * SuperAdminGuard — Redirige o bloquea a super admins no impersonando.
 *
 * Uso:
 * ```tsx
 * // Para redirigir:
 * <SuperAdminGuard>
 *   <InboxPage />
 * </SuperAdminGuard>
 *
 * // Para bloquear con null:
 * <SuperAdminGuard behavior="block">
 *   <BusinessPage />
 * </SuperAdminGuard>
 * ```
 */
export default function SuperAdminGuard({
  redirectTo = "/admin",
  children,
  behavior = "redirect",
}: SuperAdminGuardProps) {
  const { isSuperAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [redirected, setRedirected] = useState(false);

  // Detect impersonation from URL
  const [isImpersonating, setIsImpersonating] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setIsImpersonating(
      params.get("impersonating") === "true" && !!params.get("tenantId")
    );
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (isSuperAdmin && !isImpersonating && behavior === "redirect" && !redirected) {
      setRedirected(true);
      router.replace(redirectTo);
    }
  }, [isLoading, isSuperAdmin, isImpersonating, behavior, redirected, router, redirectTo]);

  // Block behavior: don't render children for super admin not impersonating
  if (!isLoading && isSuperAdmin && !isImpersonating && behavior === "block") {
    return null;
  }

  // If redirecting, return null
  if (redirected) {
    return null;
  }

  return <>{children}</>;
}
