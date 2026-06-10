// ================================================================
// components/ImpersonationBanner.tsx — Banner de impersonación
// Muestra "Modo Impersonación: [Negocio]" + botón "Volver"
// ================================================================

"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Eye, ArrowLeft } from "lucide-react";

interface ImpersonationInfo {
  tenantId: string;
  tenantName: string;
}

export default function ImpersonationBanner() {
  const searchParams = useSearchParams();
  const [info, setInfo] = useState<ImpersonationInfo | null>(null);

  useEffect(() => {
    const impersonating = searchParams.get("impersonating");
    const tenantId = searchParams.get("tenantId");

    if (impersonating === "true" && tenantId) {
      // Fetch tenant name
      fetch(`/api/admin/tenants/${tenantId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.tenant) {
            setInfo({
              tenantId,
              tenantName: data.tenant.businessName || data.tenant.slug,
            });
          }
        })
        .catch(() => {
          setInfo({ tenantId, tenantName: tenantId });
        });
    }
  }, [searchParams]);

  if (!info) return null;

  return (
    <div style={styles.banner}>
      <div style={styles.content}>
        <div style={styles.left}>
          <Eye size={14} strokeWidth={2} />
          <span>
            <strong>Modo Impersonación:</strong> {info.tenantName}
          </span>
        </div>
        <a
          href="/admin/tenants"
          style={styles.returnBtn}
          onClick={(e) => {
            // Remove impersonation params and reload
            e.preventDefault();
            const url = new URL(window.location.href);
            url.searchParams.delete("impersonating");
            url.searchParams.delete("tenantId");
            window.location.href = "/admin/tenants";
          }}
        >
          <ArrowLeft size={12} strokeWidth={2} />
          Volver a SendMe Studio
        </a>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  banner: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    background: "linear-gradient(135deg, #7c5cff, #6a4ae0)",
    color: "#fff",
    padding: "6px 16px",
    fontFamily: "'Inter', sans-serif",
    fontSize: 12,
    boxShadow: "0 4px 16px rgba(124,92,255,0.30)",
  },
  content: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  left: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  returnBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 12px",
    background: "rgba(255,255,255,0.15)",
    color: "#fff",
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 600,
    textDecoration: "none",
    cursor: "pointer",
    border: "1px solid rgba(255,255,255,0.20)",
    transition: "background 0.2s",
  },
};
