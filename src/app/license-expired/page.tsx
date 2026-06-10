// ================================================================
// license-expired/page.tsx — Pantalla de licencia vencida
// Se muestra cuando:
//   - El tenant tiene isActive = false
//   - licenseStatus = expired | suspended | cancelled
//   - licenseExpiresAt < now
// ================================================================

"use client";

import Link from "next/link";
import { ShieldAlert, Mail } from "lucide-react";
import SendMeLogo from "@/components/brand/SendMeLogo";

export default function LicenseExpiredPage() {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <SendMeLogo variant="full" size="md" />
        </div>
        <div style={styles.iconContainer}>
          <ShieldAlert size={40} strokeWidth={1.5} color="#fff" />
        </div>

        <h1 style={styles.title}>Licencia no activa</h1>

        <p style={styles.description}>
          Tu licencia de <strong>SendMe Studio</strong> está vencida o suspendida.
        </p>

        <div style={styles.divider} />

        <p style={styles.body}>
          Para reactivar tu servicio, contacta a nuestro equipo de soporte:
        </p>

        <div style={styles.contactRow}>
          <Mail size={16} strokeWidth={1.5} color="#7c5cff" />
          <a href="mailto:soporte@sendmestudio.cl" style={styles.link}>
            soporte@sendmestudio.cl
          </a>
        </div>

        <div style={styles.divider} />

        <Link href="/login" style={styles.backLink}>
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(160deg, #f8f6ff 0%, #f0ecff 100%)",
    fontFamily: "'Inter', sans-serif",
    padding: "2rem",
  },
  card: {
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(124,58,237,0.08)",
    borderRadius: 24,
    padding: "3rem 2.5rem",
    maxWidth: 440,
    width: "100%",
    textAlign: "center",
    boxShadow: "0 8px 32px rgba(124,92,255,0.04)",
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    background: "linear-gradient(135deg, #e74c3c, #f39c12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 1.5rem",
    boxShadow: "0 12px 28px rgba(231,76,60,0.25)",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#0f172a",
    margin: "0 0 0.75rem",
  },
  description: {
    fontSize: "0.95rem",
    color: "#475569",
    margin: "0 0 1.5rem",
    lineHeight: 1.5,
  },
  divider: {
    height: 1,
    background: "rgba(124,58,237,0.06)",
    margin: "1.25rem 0",
  },
  body: {
    fontSize: "0.9rem",
    color: "#64748b",
    margin: "0 0 1rem",
    lineHeight: 1.5,
  },
  contactRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: "0.5rem",
  },
  link: {
    color: "#7c5cff",
    fontWeight: 600,
    fontSize: "0.95rem",
    textDecoration: "none",
  },
  backLink: {
    display: "inline-block",
    color: "#94a3b8",
    fontSize: "0.85rem",
    textDecoration: "none",
    borderBottom: "1px solid transparent",
  },
};
