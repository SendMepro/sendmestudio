// ================================================================
// components/DebugOverlay.tsx — Overlay de debug para desarrollo
//
// Reglas de visibilidad:
// - En producción: NUNCA se muestra (no compila el JS siquiera)
// - En desarrollo: solo si NEXT_PUBLIC_DEBUG_OVERLAY=true
// - En staging/demo comercial: oculto por defecto
// - Discreto, no afecta layout (position: fixed, bottom-right)
// ================================================================

"use client";

import { useState, useEffect } from "react";
import {
  Bug,
  X,
  RefreshCw,
  Eye,
  EyeOff,
  Settings,
} from "lucide-react";

// ── Condición de visibilidad (compile-time + runtime) ──
// En producción, esta evaluación es false constante, y el
// tree-shaking de Next/Turbopack puede eliminar este componente.
const IS_DEV = process.env.NODE_ENV === "development";
const OVERLAY_ENABLED = process.env.NEXT_PUBLIC_DEBUG_OVERLAY === "true";

const SHOULD_SHOW = IS_DEV && OVERLAY_ENABLED;

export default function DebugOverlay() {
  const [open, setOpen] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<Record<string, any> | null>(null);
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState(false);

  // NO renderizar nada en producción, ni siquiera un div vacío
  if (!SHOULD_SHOW) return null;

  useEffect(() => {
    if (!open) return;
    // Fetch session info on open
    Promise.all([
      fetch("/api/auth/session").then((r) => r.json()).catch(() => ({ error: "No disponible" })),
      fetch("/api/admin/session").then((r) => r.json()).catch(() => ({ error: "No disponible" })),
    ]).then(([publicSession, adminSession]) => {
      setSessionInfo({ public: publicSession, admin: adminSession });
    });
  }, [open]);

  const refresh = () => {
    setSessionInfo(null);
    Promise.all([
      fetch("/api/auth/session").then((r) => r.json()).catch(() => ({ error: "No disponible" })),
      fetch("/api/admin/session").then((r) => r.json()).catch(() => ({ error: "No disponible" })),
    ]).then(([publicSession, adminSession]) => {
      setSessionInfo({ public: publicSession, admin: adminSession });
    });
  };

  return (
    <>
      {/* ── Trigger button (discreto, abajo a la derecha) ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          position: "fixed",
          bottom: 8,
          right: 8,
          width: 32,
          height: 32,
          borderRadius: 8,
          background: open
            ? "rgba(124,58,237,0.15)"
            : "rgba(124,58,237,0.06)",
          border: "1px solid rgba(124,58,237,0.1)",
          color: "#7c5cff",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 99999,
          opacity: 0.4,
          transition: "opacity 0.2s ease",
          fontFamily: "'Inter', sans-serif",
        }}
        title="Debug overlay (desarrollo)"
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
        onMouseLeave={(e) => { if (!open) (e.currentTarget as HTMLButtonElement).style.opacity = "0.4"; }}
      >
        <Bug size={14} strokeWidth={1.5} />
      </button>

      {/* ── Panel ── */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 48,
            right: 8,
            width: 360,
            maxHeight: "70vh",
            background: "rgba(15, 23, 42, 0.92)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(124,58,237,0.15)",
            borderRadius: 14,
            padding: "14px 16px",
            zIndex: 99999,
            overflowY: "auto",
            fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
            fontSize: 11,
            lineHeight: 1.5,
            color: "#e2e8f0",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
              paddingBottom: 8,
              borderBottom: "1px solid rgba(124,58,237,0.12)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Bug size={13} strokeWidth={1.5} color="#7c5cff" />
              <span style={{ fontWeight: 700, fontSize: 12, color: "#f1f5f9" }}>
                Debug Overlay
              </span>
              <span style={{ fontSize: 10, color: "#64748b", marginLeft: 4 }}>
                dev only
              </span>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button
                type="button"
                onClick={refresh}
                style={chipBtnStyle}
                title="Refrescar"
              >
                <RefreshCw size={11} />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{ ...chipBtnStyle, color: "#94a3b8" }}
                title="Cerrar"
              >
                <X size={11} />
              </button>
            </div>
          </div>

          {/* Environment info */}
          <div style={{ marginBottom: 10 }}>
            <div style={sectionTitle}>ENTORNO</div>
            <div style={kvStyle}>
              <span style={keyStyle}>NODE_ENV</span>
              <span style={valStyle}>{process.env.NODE_ENV || "—"}</span>
            </div>
            <div style={kvStyle}>
              <span style={keyStyle}>DEBUG_OVERLAY</span>
              <span style={{ ...valStyle, color: OVERLAY_ENABLED ? "#22c55e" : "#e74c3c" }}>
                {OVERLAY_ENABLED ? "true" : "false"}
              </span>
            </div>
          </div>

          {/* Session info */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ ...sectionTitle, display: "flex", alignItems: "center", gap: 6 }}>
              SESIÓN
              <button
                type="button"
                onClick={() => setShowSecrets((v) => !v)}
                style={{
                  ...chipBtnStyle,
                  fontSize: 9,
                  padding: "1px 6px",
                  background: showSecrets ? "rgba(124,58,237,0.15)" : "transparent",
                }}
                title="Mostrar datos sensibles"
              >
                {showSecrets ? <EyeOff size={9} /> : <Eye size={9} />}
              </button>
            </div>
            {sessionInfo ? (
              <div style={{ maxHeight: 250, overflowY: "auto" }}>
                <pre style={{ fontSize: 10, margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all", color: "#94a3b8" }}>
                  {JSON.stringify(sessionInfo, showSecrets ? undefined : (maskSensitive as (this: any, key: string, value: any) => any), 2)}
                </pre>
              </div>
            ) : (
              <div style={{ color: "#64748b", fontStyle: "italic" }}>
                Cargando...
              </div>
            )}
          </div>

          {/* Actions */}
          <div>
            <div style={sectionTitle}>ACCIONES</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <a
                href="/api/auth/session"
                target="_blank"
                style={actionLinkStyle}
              >
                /api/auth/session
              </a>
              <a
                href="/api/admin/session"
                target="_blank"
                style={actionLinkStyle}
              >
                /api/admin/session
              </a>
              <button
                type="button"
                onClick={async () => {
                  await fetch("/api/auth/logout", { method: "POST" });
                  window.location.href = "/login";
                }}
                style={{ ...actionLinkStyle, color: "#e74c3c", background: "rgba(231,76,60,0.08)", border: "1px solid rgba(231,76,60,0.15)" }}
              >
                Forzar logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Helpers ──

function maskSensitive(_key: string, val: any) {
  // Ocultar tokens, passwords, secret keys
  if (typeof val === "string" && (
    val.startsWith("eyJ") || // JWT
    val.length > 40 || // potential token
    _key.toLowerCase().includes("token") ||
    _key.toLowerCase().includes("secret") ||
    _key.toLowerCase().includes("password")
  )) {
    return "***";
  }
  return val;
}

const chipBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 22,
  height: 22,
  borderRadius: 6,
  border: "1px solid rgba(124,58,237,0.12)",
  background: "rgba(124,58,237,0.06)",
  color: "#7c5cff",
  cursor: "pointer",
  fontFamily: "'Inter', sans-serif",
};

const sectionTitle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: "#7c5cff",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 6,
};

const kvStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "2px 0",
};

const keyStyle: React.CSSProperties = {
  color: "#64748b",
  fontWeight: 600,
};

const valStyle: React.CSSProperties = {
  color: "#e2e8f0",
  fontWeight: 500,
  maxWidth: "60%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const actionLinkStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "5px 10px",
  borderRadius: 6,
  background: "rgba(124,58,237,0.06)",
  border: "1px solid rgba(124,58,237,0.1)",
  color: "#7c5cff",
  fontSize: 10,
  fontWeight: 600,
  textDecoration: "none",
  fontFamily: "'Inter', sans-serif",
  cursor: "pointer",
};
