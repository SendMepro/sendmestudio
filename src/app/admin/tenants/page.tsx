// ================================================================
// admin/tenants/page.tsx — Super Admin: Lista de Tenants
// Muestra: Logo, Nombre, Owner, Email, Licencia, Plan, Vto, Activo, Acciones
// Acciones: Editar, Suspender/Reactivar, Entrar como cliente
// ================================================================

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  Search,
  ExternalLink,
  Eye,
  ToggleLeft,
  ToggleRight,
  MoreHorizontal,
  User,
  Mail,
  CalendarDays,
  Clock,
} from "lucide-react";
import SendMeLogo from "@/components/brand/SendMeLogo";
import AdminSessionBadge from "@/app/components/AdminSessionBadge";

interface Tenant {
  id: string;
  slug: string;
  businessName: string;
  businessType: string;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerPhone: string | null;
  logoUrl: string | null;
  isActive: boolean;
  licenseStatus: string;
  licenseExpiresAt: string | null;
  createdAt: string;
  _count: { userTenants: number };
  subscriptions: Array<{
    plan: { name: string };
    status: string;
  }>;
}

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/tenants")
      .then((r) => r.json())
      .then((data) => setTenants(data.tenants || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tenants.filter(
    (t) =>
      t.businessName.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase()) ||
      (t.ownerName || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.ownerEmail || "").toLowerCase().includes(search.toLowerCase()),
  );

  const handleToggleActive = async (tenant: Tenant) => {
    const newActive = !tenant.isActive;
    try {
      const res = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newActive }),
      });
      if (res.ok) {
        setTenants((prev) =>
          prev.map((t) => (t.id === tenant.id ? { ...t, isActive: newActive } : t)),
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleLicense = async (tenant: Tenant) => {
    const newStatus = tenant.licenseStatus === "suspended" ? "active" : "suspended";
    try {
      const res = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          licenseStatus: newStatus,
          isActive: newStatus === "active",
        }),
      });
      if (res.ok) {
        setTenants((prev) =>
          prev.map((t) =>
            t.id === tenant.id
              ? { ...t, licenseStatus: newStatus, isActive: newStatus === "active" }
              : t,
          ),
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, { bg: string; color: string; label: string }> = {
      active: { bg: "rgba(16,185,129,0.12)", color: "#059669", label: "Activa" },
      trial: { bg: "rgba(59,130,246,0.12)", color: "#2563eb", label: "Trial" },
      expired: { bg: "rgba(231,76,60,0.12)", color: "#dc2626", label: "Vencida" },
      suspended: { bg: "rgba(245,158,11,0.12)", color: "#d97706", label: "Suspendida" },
      cancelled: { bg: "rgba(148,163,184,0.12)", color: "#64748b", label: "Cancelada" },
    };
    const c = colors[status] || colors.trial;
    return (
      <span
        style={{
          display: "inline-block",
          padding: "3px 10px",
          borderRadius: 12,
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          background: c.bg,
          color: c.color,
        }}
      >
        {c.label}
      </span>
    );
  };

  const daysUntilExpiry = (date: string | null): number | null => {
    if (!date) return null;
    const diff = new Date(date).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Clientes / Tenants</h1>
            <p style={styles.subtitle}>
              Gestión de todos los salones registrados en SendMe Studio.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
            <Link href="/admin/tenants/new" style={styles.createBtn}>
              <Plus size={16} strokeWidth={2} />
              Nuevo Cliente
            </Link>
            <AdminSessionBadge />
          </div>
        </div>

        {/* Search */}
        <div style={styles.searchBar}>
          <Search size={16} strokeWidth={1.5} color="#94a3b8" />
          <input
            style={styles.searchInput}
            placeholder="Buscar por nombre, slug, dueño o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Error */}
        {error ? <div style={styles.error}>{error}</div> : null}

        {/* Table */}
        {loading ? (
          <div style={styles.loading}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>
            {search ? "Sin resultados" : "No hay clientes registrados"}
          </div>
        ) : (
          <div style={styles.tableOuter}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Negocio</th>
                  <th style={styles.th}>Dueño</th>
                  <th style={styles.th}>Licencia</th>
                  <th style={styles.th}>Plan</th>
                  <th style={styles.th}>Vence</th>
                  <th style={styles.th}>Estado</th>
                  <th style={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const days = daysUntilExpiry(t.licenseExpiresAt);
                  const isExpiring = days !== null && days >= 0 && days <= 15;
                  const isExpired = days !== null && days < 0;

                  return (
                    <tr key={t.id} style={styles.tr}>
                      {/* Business */}
                      <td style={styles.td}>
                        <div style={styles.businessCell}>
                          <div style={styles.businessIcon}>
                            <Building2 size={14} strokeWidth={1.5} color="#7c5cff" />
                          </div>
                          <div>
                            <div
                              style={{
                                ...styles.businessName,
                                ...(t.isActive ? {} : { color: "#94a3b8", textDecoration: "line-through" }),
                              }}
                            >
                              {t.businessName}
                            </div>
                            <div style={styles.businessSlug}>{t.slug}</div>
                          </div>
                        </div>
                      </td>

                      {/* Owner */}
                      <td style={styles.td}>
                        {t.ownerName || t.ownerEmail ? (
                          <div>
                            {t.ownerName && (
                              <div style={styles.ownerName}>{t.ownerName}</div>
                            )}
                            {t.ownerEmail && (
                              <div style={styles.ownerEmail}>
                                <Mail size={10} strokeWidth={1.5} style={{ marginRight: 4 }} />
                                {t.ownerEmail}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>
                        )}
                      </td>

                      {/* License */}
                      <td style={styles.td}>{statusBadge(t.licenseStatus)}</td>

                      {/* Plan */}
                      <td style={styles.td}>
                        <span style={styles.planName}>
                          {t.subscriptions?.[0]?.plan?.name || "—"}
                        </span>
                      </td>

                      {/* Expiry */}
                      <td style={styles.td}>
                        {t.licenseExpiresAt ? (
                          <div>
                            <div style={styles.expiryDate}>
                              {new Date(t.licenseExpiresAt).toLocaleDateString("es-CL")}
                            </div>
                            {isExpiring && !isExpired && (
                              <div style={styles.expiringBadge}>
                                <Clock size={10} strokeWidth={1.5} />
                                {days} día{days !== 1 ? "s" : ""}
                              </div>
                            )}
                            {isExpired && (
                              <div style={styles.expiredBadge}>Vencida</div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>
                        )}
                      </td>

                      {/* Active */}
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.statusDot,
                            background: t.isActive ? "#10B981" : "#e74c3c",
                          }}
                        />
                        {t.isActive ? "Activo" : "Inactivo"}
                      </td>

                      {/* Actions */}
                      <td style={styles.td}>
                        <div style={styles.actionsRow}>
                          <Link
                            href={`/admin/tenants/${t.id}`}
                            style={styles.actionBtn}
                            title="Editar cliente"
                          >
                            <ExternalLink size={13} strokeWidth={1.5} />
                          </Link>

                          <button
                            onClick={() => handleToggleLicense(t)}
                            style={{
                              ...styles.actionBtn,
                              background:
                                t.licenseStatus === "suspended"
                                  ? "rgba(16,185,129,0.10)"
                                  : "rgba(245,158,11,0.10)",
                              color:
                                t.licenseStatus === "suspended" ? "#10B981" : "#F59E0B",
                            }}
                            title={
                              t.licenseStatus === "suspended"
                                ? "Reactivar licencia"
                                : "Suspender licencia"
                            }
                          >
                            {t.licenseStatus === "suspended" ? (
                              <ToggleRight size={14} strokeWidth={1.5} />
                            ) : (
                              <ToggleLeft size={14} strokeWidth={1.5} />
                            )}
                          </button>

                          <button
                            onClick={() => {
                              window.location.href = "/?tenantId=" + t.id + "&impersonating=true";
                            }}
                            style={{
                              ...styles.actionBtn,
                              background: "rgba(124,92,255,0.10)",
                              color: "#7c5cff",
                            }}
                            title="Entrar como cliente"
                          >
                            <Eye size={13} strokeWidth={1.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Styles ──

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: "100vh",
    background: "#f8f6ff",
    fontFamily: "'Inter', sans-serif",
  },
  container: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "48px 32px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
    gap: 16,
  },
  title: { fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 },
  subtitle: { fontSize: 14, color: "#64748b", marginTop: 4 },
  createBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 20px",
    background: "linear-gradient(135deg, #7c5cff, #9b7dff)",
    color: "#fff",
    borderRadius: 14,
    fontSize: 14,
    fontWeight: 600,
    textDecoration: "none",
    whiteSpace: "nowrap",
  },
  searchBar: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 16px",
    background: "#fff",
    border: "1px solid rgba(124,58,237,0.06)",
    borderRadius: 14,
    marginBottom: 20,
  },
  searchInput: {
    border: "none",
    outline: "none",
    flex: 1,
    fontSize: 14,
    background: "transparent",
    color: "#0f172a",
  },
  error: {
    background: "rgba(231,76,60,0.08)",
    color: "#e74c3c",
    padding: "12px 16px",
    borderRadius: 10,
    fontSize: 13,
    marginBottom: 16,
  },
  loading: { textAlign: "center", color: "#94a3b8", padding: 60, fontSize: 14 },
  empty: {
    textAlign: "center",
    color: "#94a3b8",
    padding: 60,
    fontSize: 14,
    background: "#fff",
    borderRadius: 16,
  },
  tableOuter: {
    background: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    border: "1px solid rgba(124,58,237,0.04)",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: "14px 16px",
    fontSize: 10,
    fontWeight: 600,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    borderBottom: "1px solid rgba(124,58,237,0.04)",
  },
  tr: { borderBottom: "1px solid rgba(124,58,237,0.03)" },
  td: { padding: "14px 16px", fontSize: 13, color: "#0f172a" },

  // Business
  businessCell: { display: "flex", alignItems: "center", gap: 10 },
  businessIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    background: "rgba(124,92,255,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  businessName: { fontWeight: 600, fontSize: 13, color: "#0f172a" },
  businessSlug: { fontSize: 11, color: "#94a3b8", marginTop: 1 },

  // Owner
  ownerName: { fontWeight: 500, fontSize: 12, color: "#334155" },
  ownerEmail: {
    fontSize: 11,
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
    marginTop: 2,
  },

  // Plan
  planName: {
    fontSize: 12,
    fontWeight: 500,
    color: "#475569",
  },

  // Expiry
  expiryDate: { fontSize: 12, color: "#64748b" },
  expiringBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
    fontSize: 10,
    fontWeight: 600,
    color: "#e74c3c",
    background: "rgba(231,76,60,0.08)",
    padding: "2px 6px",
    borderRadius: 6,
  },
  expiredBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
    fontSize: 10,
    fontWeight: 600,
    color: "#dc2626",
    background: "rgba(220,38,38,0.08)",
    padding: "2px 6px",
    borderRadius: 6,
  },

  // Active status
  statusDot: {
    display: "inline-block",
    width: 6,
    height: 6,
    borderRadius: "50%",
    marginRight: 6,
    verticalAlign: "middle",
  },

  // Actions
  actionsRow: { display: "flex", gap: 6 },
  actionBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    textDecoration: "none",
    background: "rgba(124,58,237,0.06)",
    color: "#64748b",
    transition: "all 0.15s",
  },
};
