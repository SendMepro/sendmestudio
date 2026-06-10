// ================================================================
// components/inbox/InboxGate.tsx
// Gate component for /inbox that prevents any tenant data rendering
// for super admins who are not impersonating.
// Renders only after auth resolves, showing a neutral loading state.
// ================================================================

"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

type InboxGateProps = {
  children: ReactNode;
};

/**
 * InboxGate — Guards the /inbox route.
 *
 * - While auth is loading: shows a neutral loading screen (no branding).
 * - If super admin without impersonation: redirects to /admin.
 * - Otherwise: renders children (the real inbox content).
 */
export default function InboxGate({ children }: InboxGateProps) {
  const { isSuperAdmin, isLoading } = useAuth();
  const router = useRouter();

  // Detect impersonation from URL (synchronous, read once)
  const [impersonating, setImpersonating] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setImpersonating(
      params.get("impersonating") === "true" && !!params.get("tenantId")
    );
  }, []);

  // Super admin guard: redirect to /admin
  const [redirected, setRedirected] = useState(false);
  useEffect(() => {
    if (isLoading) return;
    if (isSuperAdmin && !impersonating && !redirected) {
      setRedirected(true);
      router.replace("/admin");
    }
  }, [isLoading, isSuperAdmin, impersonating, redirected, router]);

  // While auth is loading, show neutral loading (no tenant content at all)
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          width: "100vw",
          background: "#0b0b0f",
          color: "#888",
          fontFamily: "system-ui, sans-serif",
          fontSize: 14,
        }}
      >
        Cargando...
      </div>
    );
  }

  // Super admin not impersonating — redirecting, don't render anything
  if (isSuperAdmin && !impersonating) {
    return null;
  }

  // All good — render real inbox content
  return <>{children}</>;
}
