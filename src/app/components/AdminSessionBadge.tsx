// ================================================================
// components/AdminSessionBadge.tsx — Badge de sesión admin
// Muestra email, rol, tenant, super admin status e impersonación.
// Botón de cerrar sesión.
// ================================================================

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, LogOut, Eye, Crown } from "lucide-react";

type SessionInfo = {
  email: string;
  role: string | null;
  tenantId: string | null;
  tenantName: string | null;
  isSuperAdmin: boolean;
  isImpersonating: boolean;
};

export default function AdminSessionBadge() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/admin/session")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setSession(data.session);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  };

  if (loading) return null;
  if (!session) return null;

  const isSuperAdmin = session.isSuperAdmin;
  const roleLabel = session.role && session.role !== "null"
    ? session.role.toUpperCase()
    : null;

  return (
    <div
      style={{
        padding: "12px 18px",
        borderRadius: 14,
        background: isSuperAdmin
          ? "linear-gradient(135deg, rgba(124,92,255,0.08), rgba(124,92,255,0.03))"
          : "rgba(148,163,184,0.06)",
        border: `1px solid ${
          isSuperAdmin ? "rgba(124,92,255,0.15)" : "rgba(148,163,184,0.12)"
        }`,
        fontSize: 12,
        lineHeight: 1.5,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Icon */}
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: isSuperAdmin
                ? "linear-gradient(135deg, #7c5cff, #6630c2)"
                : "rgba(148,163,184,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {isSuperAdmin ? (
              <Shield size={16} strokeWidth={2} color="#fff" />
            ) : (
              <Shield size={16} strokeWidth={1.5} color="#94a3b8" />
            )}
          </div>
          <div>
            {/* Email */}
            <div style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>
              {session.email}
            </div>
            {/* Badges row */}
            <div
              style={{
                display: "flex",
                gap: 6,
                marginTop: 4,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {/* Super Admin badge — always shows */}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "2px 8px",
                  borderRadius: 6,
                  background: isSuperAdmin
                    ? "rgba(124,92,255,0.12)"
                    : "rgba(148,163,184,0.08)",
                  color: isSuperAdmin ? "#7c5cff" : "#94a3b8",
                  fontWeight: 700,
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {isSuperAdmin ? (
                  <><Crown size={11} strokeWidth={2} /> SUPER ADMIN</>
                ) : (
                  <>{roleLabel || "USUARIO"}</>
                )}
              </span>

              {/* Impersonating */}
              {session.isImpersonating && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                    padding: "2px 8px",
                    borderRadius: 6,
                    background: "rgba(245,158,11,0.10)",
                    color: "#F59E0B",
                    fontWeight: 600,
                    fontSize: 10,
                    textTransform: "uppercase",
                  }}
                >
                  <Eye size={10} /> IMPERSONANDO
                </span>
              )}

              {/* Tenant name (when impersonating or admin) */}
              {session.tenantName && (
                <span style={{ color: "#94a3b8", fontSize: 11 }}>
                  {session.tenantName}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "5px 10px",
            borderRadius: 6,
            border: "1px solid rgba(148,163,184,0.2)",
            background: "rgba(255,255,255,0.5)",
            color: "#64748b",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <LogOut size={12} /> Cerrar sesión
        </button>
      </div>
    </div>
  );
}
