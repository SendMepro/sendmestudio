// ================================================================
// components/LicenseExpiryBanner.tsx — Banner de licencia próxima a vencer
// Muestra "Tu licencia vence en X días" cuando quedan <15 días
// ================================================================

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AlertTriangle, X } from "lucide-react";

interface LicenseInfo {
  daysLeft: number;
  expiresAt: string;
}

export default function LicenseExpiryBanner() {
  const { user, tenantId, isLoading } = useAuth();
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user || !tenantId || isLoading) return;

    // Fetch license info from the API or from user metadata
    const expiresAt = user.app_metadata?.license_expires_at;
    if (expiresAt) {
      const daysLeft = Math.ceil(
        (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      if (daysLeft > 0 && daysLeft <= 15) {
        setLicense({ daysLeft, expiresAt });
      }
    }
  }, [user, tenantId, isLoading]);

  if (!license || dismissed) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 9998,
        background: "rgba(245,158,11,0.95)",
        color: "#fff",
        borderRadius: 16,
        padding: "16px 20px",
        fontFamily: "'Inter', sans-serif",
        fontSize: 13,
        boxShadow: "0 8px 32px rgba(245,158,11,0.25)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        maxWidth: 340,
        backdropFilter: "blur(8px)",
      }}
    >
      <AlertTriangle size={18} strokeWidth={1.5} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, lineHeight: 1.4 }}>
        <strong>Tu licencia vence en {license.daysLeft} día{license.daysLeft !== 1 ? "s" : ""}</strong>
        <div style={{ opacity: 0.8, fontSize: 11, marginTop: 2 }}>
          {new Date(license.expiresAt).toLocaleDateString("es-CL")}
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        style={{
          background: "rgba(255,255,255,0.15)",
          border: "none",
          borderRadius: 8,
          width: 28,
          height: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "#fff",
          flexShrink: 0,
        }}
      >
        <X size={14} strokeWidth={2} />
      </button>
    </div>
  );
}
