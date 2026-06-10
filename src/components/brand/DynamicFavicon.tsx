// ================================================================
// components/brand/DynamicFavicon.tsx
// Client component that updates the favicon based on tenant branding.
// ================================================================

"use client";

import { useEffect } from "react";
import { useTenantBranding } from "@/hooks/useTenantBranding";

export function DynamicFavicon() {
  const { branding } = useTenantBranding();

  useEffect(() => {
    if (!branding?.faviconUrl) return;

    const faviconLink = document.querySelector<HTMLLinkElement>("#dynamic-favicon");
    const appleLink = document.querySelector<HTMLLinkElement>("#dynamic-apple-favicon");

    if (faviconLink) {
      faviconLink.href = branding.faviconUrl;
    }
    if (appleLink) {
      appleLink.href = branding.faviconUrl;
    }
  }, [branding?.faviconUrl]);

  return null;
}
