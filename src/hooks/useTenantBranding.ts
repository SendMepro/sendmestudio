// ================================================================
// hooks/useTenantBranding.ts — Hook para cargar branding del tenant
// Devuelve logo, colores, banner, favicon, tagline desde API
// ================================================================

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { usePathname } from "next/navigation";

export interface TenantBranding {
  tenant: {
    id: string;
    slug: string;
    businessName: string;
    businessType: string;
    logoUrl: string | null;
    bannerUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
    faviconUrl: string | null;
    tagline: string | null;
    timezone: string;
    language: string;
    licenseStatus: string;
    licenseExpiresAt: string | null;
  } | null;
  businessSettings: any;
  aiSettings: any;
  branding: {
    logoUrl: string | null;
    bannerUrl: string | null;
    faviconUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
    businessName: string;
    businessType: string;
    tagline: string | null;
  } | null;
  loading: boolean;
}

/**
 * Determine if the current route is /admin without impersonation.
 * Uses pathname from next/navigation, which updates on client-side navigation.
 */
function isAdminWithoutImpersonation(pathname: string): boolean {
  const isAdmin = pathname.startsWith("/admin");
  if (!isAdmin) return false;
  if (typeof window === "undefined") return true; // SSR — safe default
  const params = new URLSearchParams(window.location.search);
  const isImpersonating = params.get("impersonating") === "true" && !!params.get("tenantId");
  return !isImpersonating;
}

export function useTenantBranding(): TenantBranding {
  const { user, tenantId, isLoading: authLoading } = useAuth();
  const pathname = usePathname();

  const [data, setData] = useState<TenantBranding>({
    tenant: null,
    businessSettings: null,
    aiSettings: null,
    branding: null,
    loading: true,
  });

  useEffect(() => {
    const isAdmin = isAdminWithoutImpersonation(pathname);
    console.log("BRANDING EFFECT RUN", { pathname, isAdmin, authLoading, hasUser: !!user, tenantId });
    // CRITICAL: On /admin without impersonation, never fetch tenant branding.
    // pathname is in the dependency array so this re-checks on every navigation.
    if (isAdminWithoutImpersonation(pathname)) {
      setData((prev) => ({ ...prev, loading: false }));
      return;
    }

    if (authLoading) return;
    if (!user || !tenantId) {
      setData((prev) => ({ ...prev, loading: false }));
      return;
    }

    fetch("/api/business-settings")
      .then((r) => r.json())
      .then((json) => {
        const tenant = json.tenant || null;
        console.log("BRANDING FETCH RESULT", {
          businessName: tenant?.businessName,
          logoUrl: tenant?.logoUrl,
          tenantId: tenant?.id,
          pathname,
        });
        setData({
          tenant,
          businessSettings: json.businessSettings || null,
          aiSettings: json.aiSettings || null,
          branding: tenant
            ? {
                logoUrl: tenant.logoUrl,
                bannerUrl: tenant.bannerUrl,
                faviconUrl: tenant.faviconUrl,
                primaryColor: tenant.primaryColor,
                secondaryColor: tenant.secondaryColor,
                businessName: tenant.businessName,
                businessType: tenant.businessType,
                tagline: tenant.tagline || getDefaultTagline(tenant.businessType),
              }
            : null,
          loading: false,
        });
      })
      .catch(() => {
        setData({
          tenant: null,
          businessSettings: null,
          aiSettings: null,
          branding: null,
          loading: false,
        });
      });
  }, [user, tenantId, authLoading, pathname]);

  return data;
}

/**
 * Devuelve un subtítulo por defecto según el tipo de negocio.
 */
function getDefaultTagline(businessType: string): string {
  const taglines: Record<string, string> = {
    salon: "Salon & Beauty Business",
    barberia: "Barbershop Management",
    spa: "Spa & Wellness Center",
    clinic: "Clinical Aesthetics",
    studio: "Independent Studio",
  };
  return taglines[businessType] || "AI Business Workspace";
}
