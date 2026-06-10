"use client";

import { ReactNode, useState, useEffect, useMemo } from "react";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Sidebar from "./Sidebar";
import ImpersonationBanner from "@/components/ImpersonationBanner";
import LicenseExpiryBanner from "@/components/LicenseExpiryBanner";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import DebugOverlay from "./DebugOverlay";

type AppShellProps = {
  children: ReactNode;
};

/**
 * AppShell — Layout principal que envuelve todas las páginas.
 *
 * Aplica colores de marca del tenant como CSS variables para que
 * toda la app se sienta personalizada para cada cliente.
 * En /admin (sin impersonación) NO se aplica branding de tenant.
 */
export default function AppShell({ children }: AppShellProps) {
  return (
    <Suspense fallback={null}>
      <AppShellInner>{children}</AppShellInner>
    </Suspense>
  );
}

function AppShellInner({ children }: AppShellProps) {
  const pathname = usePathname();
  const { branding, loading: brandLoading } = useTenantBranding();
  console.log("APPSHELL", { pathname, hasBranding: !!branding, businessName: branding?.businessName, brandLoading });

  // ── Impersonación SÍNCRONA: search params antes del primer render ──
  const searchParams = useSearchParams();
  const isImpersonating = useMemo(() => {
    const imp = searchParams?.get("impersonating") === "true";
    const tid = searchParams?.get("tenantId");
    return imp && !!tid;
  }, [searchParams]);

  const isAdminRoute = pathname.startsWith("/admin");
  const shouldApplyTenantBranding = !isAdminRoute || isImpersonating;

  // ── Sidebar expanded state ──
  // Admin routes: expandido por defecto (primera carga). Si usuario colapsa, respeta localStorage.
  // Non-admin: usa localStorage normalmente.
  const [expanded, setExpanded] = useState(() => {
    if (typeof window === "undefined") return isAdminRoute;
    try {
      const saved = window.localStorage.getItem("sidebar-expanded");
      // Si hay valor guardado, respetarlo (usuario colapsó manualmente)
      if (saved !== null) return saved === "true";
    } catch {
      // ignore
    }
    // Sin preferencia guardada: admin routes se expanden por defecto
    return isAdminRoute;
  });

  // Persist sidebar state
  useEffect(() => {
    try {
      window.localStorage.setItem("sidebar-expanded", String(expanded));
    } catch { /* quota exceeded */ }
  }, [expanded]);

  // Set CSS custom properties for tenant branding (only when NOT in admin mode)
  useEffect(() => {
    const root = document.documentElement;
    
    // Aplicar transición suave antes de cambiar
    root.style.transition = "background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease";

    if (!branding || !shouldApplyTenantBranding) {
      // Clear tenant CSS variables when entering admin mode or when branding is null
      root.style.removeProperty("--tenant-primary");
      root.style.removeProperty("--tenant-secondary");
      root.style.removeProperty("--tenant-primary-rgb");
      root.style.removeProperty("--tenant-secondary-rgb");
      root.style.removeProperty("--tenant-primary-hover");
      root.style.removeProperty("--tenant-primary-light");
      root.style.removeProperty("--tenant-primary-lighter");
    } else {
      const primary = branding.primaryColor || "#7c5cff";
      const secondary = branding.secondaryColor || "#1a1a2e";
      root.style.setProperty("--tenant-primary", primary);
      root.style.setProperty("--tenant-secondary", secondary);
      root.style.setProperty("--tenant-primary-rgb", hexToRgb(primary));
      root.style.setProperty("--tenant-secondary-rgb", hexToRgb(secondary));
      root.style.setProperty("--tenant-primary-hover", adjustBrightness(primary, -10));
      root.style.setProperty("--tenant-primary-light", hexToRgba(primary, 0.1));
      root.style.setProperty("--tenant-primary-lighter", hexToRgba(primary, 0.06));
    }

    // Limpiar transición después de que termine
    const cleanup = setTimeout(() => {
      root.style.transition = "";
    }, 350);
    return () => clearTimeout(cleanup);
  }, [branding, shouldApplyTenantBranding]);

  const toggleSidebar = () => setExpanded((v) => !v);

  return (
    <div className="app-shell" data-sidebar-expanded={expanded ? "true" : "false"}>
      {/* Impersonation banner — wrapped in Suspense because it uses useSearchParams */}
      <Suspense fallback={null}>
        <ImpersonationBanner />
      </Suspense>
      <LicenseExpiryBanner />
      <aside className="shared-sidebar">
        <Suspense fallback={null}>
          <Sidebar expanded={expanded} onToggle={toggleSidebar} />
        </Suspense>
      </aside>
      <main className="app-main">{children}</main>
      <DebugOverlay />
    </div>
  );
}

/** Convert hex color to rgb string, e.g. "#7c5cff" → "124,92,255" */
function hexToRgb(hex: string): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "124,92,255";
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `${r},${g},${b}`;
}

/** Convert hex to rgba string with opacity */
function hexToRgba(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  return `rgba(${rgb}, ${alpha})`;
}

/** Adjust hex color brightness by percentage (negative = darker, positive = lighter) */
function adjustBrightness(hex: string, percent: number): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return hex;
  let r = parseInt(clean.substring(0, 2), 16);
  let g = parseInt(clean.substring(2, 4), 16);
  let b = parseInt(clean.substring(4, 6), 16);
  const factor = (100 + percent) / 100;
  r = Math.min(255, Math.max(0, Math.round(r * factor)));
  g = Math.min(255, Math.max(0, Math.round(g * factor)));
  b = Math.min(255, Math.max(0, Math.round(b * factor)));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
