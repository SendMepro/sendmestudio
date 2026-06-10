// ================================================================
// admin/tenants/[id]/page.tsx — Super Admin: Detalle de Tenant
// ================================================================

"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, UserPlus, Trash2, ShieldAlert, ExternalLink } from "lucide-react";

interface TenantDetail {
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
    id: string;
    plan: { name: string; monthlyPriceClp: number };
    status: string;
    paymentStatus: string;
    startDate: string;
    nextBilling: string | null;
    currentPeriodEnd: string | null;
  }>;
  userTenants: Array<{
    id: string;
    role: string;
    isActive: boolean;
    user: {
      id: string;
      email: string;
      name: string | null;
      isActive: boolean;
    };
  }>;
}

export default function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [form, setForm] = useState({
    businessName: "",
    businessType: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    isActive: true,
    licenseStatus: "trial",
    licenseExpiresAt: "",
  });

  useEffect(() => {
    fetch(`/api/admin/tenants/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.tenant) {
          setTenant(data.tenant);
          setForm({
            businessName: data.tenant.businessName,
            businessType: data.tenant.businessType,
            ownerName: data.tenant.ownerName || "",
            ownerEmail: data.tenant.ownerEmail || "",
            ownerPhone: data.tenant.ownerPhone || "",
            isActive: data.tenant.isActive,
            licenseStatus: data.tenant.licenseStatus,
            licenseExpiresAt: data.tenant.licenseExpiresAt
              ? data.tenant.licenseExpiresAt.split("T")[0]
              : "",
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/tenants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al guardar");
        return;
      }

      setSuccess("Cambios guardados correctamente");
      setTenant(data.tenant);
    } catch (err: any) {
      setError(err.message || "Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm("¿Archivar este cliente? Los usuarios no podrán acceder.")) return;

    try {
      await fetch(`/api/admin/tenants/${id}`, { method: "DELETE" });
      router.push("/admin/tenants");
    } catch (err: any) {
      setError(err.message || "Error al archivar");
    }
  };

  const statusColors: Record<string, string> = {
    active: "#10B981",
    trial: "#3B82F6",
    expired: "#e74c3c",
    suspended: "#F59E0B",
    cancelled: "#94a3b8",
  };

  if (loading) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.container}>
          <div style={{ textAlign: "center", color: "#94a3b8", padding: 60 }}>Cargando...</div>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.container}>
          <div style={{ textAlign: "center", color: "#e74c3c", padding: 60 }}>Tenant no encontrado.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <Link href="/admin/tenants" style={styles.backLink}>
          <ArrowLeft size={16} strokeWidth={1.5} />
          Volver a clientes
        </Link>

        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>{tenant.businessName}</h1>
            <p style={styles.slug}>Slug: <code>{tenant.slug}</code></p>
          </div>
          <div style={styles.headerActions}>
            <button
              onClick={() => {
                window.location.href = "/?tenantId=" + tenant.id + "&impersonating=true";
              }}
              style={styles.impersonateBtn}
              title="Ver dashboard como este cliente"
            >
              <ExternalLink size={14} strokeWidth={1.5} />
              Entrar como cliente
            </button>
            <button
              onClick={handleArchive}
              style={styles.archiveBtn}
              title="Archivar cliente"
            >
              <Trash2 size={14} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {error ? <div style={styles.error}>{error}</div> : null}
        {success ? <div style={styles.success}>{success}</div> : null}

        {/* Settings Form */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Configuración</h2>

          <div style={styles.grid}>
            <div style={styles.field}>
              <label style={styles.label}>Nombre del negocio *</label>
              <input
                style={styles.input}
                value={form.businessName}
                onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Tipo</label>
              <select
                style={styles.input}
                value={form.businessType}
                onChange={(e) => setForm((f) => ({ ...f, businessType: e.target.value }))}
              >
                <option value="salon">Salón</option>
                <option value="barber">Barbería</option>
                <option value="spa">Spa</option>
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Dueño</label>
              <input
                style={styles.input}
                value={form.ownerName}
                onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Email dueño</label>
              <input
                style={styles.input}
                value={form.ownerEmail}
                onChange={(e) => setForm((f) => ({ ...f, ownerEmail: e.target.value }))}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Teléfono dueño</label>
              <input
                style={styles.input}
                value={form.ownerPhone}
                onChange={(e) => setForm((f) => ({ ...f, ownerPhone: e.target.value }))}
              />
            </div>
          </div>

          <button onClick={handleSave} style={styles.saveBtn} disabled={saving}>
            <Save size={16} strokeWidth={2} />
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>

        {/* License */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>
            <ShieldAlert size={16} strokeWidth={1.5} style={{ marginRight: 8 }} />
            Licencia
          </h2>

          <div style={styles.grid}>
            <div style={styles.field}>
              <label style={styles.label}>Estado de licencia</label>
              <select
                style={styles.input}
                value={form.licenseStatus}
                onChange={(e) => setForm((f) => ({ ...f, licenseStatus: e.target.value }))}
              >
                <option value="active">Activa</option>
                <option value="trial">Trial</option>
                <option value="expired">Vencida</option>
                <option value="suspended">Suspendida</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Expira el</label>
              <input
                style={styles.input}
                type="date"
                value={form.licenseExpiresAt}
                onChange={(e) => setForm((f) => ({ ...f, licenseExpiresAt: e.target.value }))}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Activo</label>
              <select
                style={styles.input}
                value={form.isActive ? "true" : "false"}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value === "true" }))}
              >
                <option value="true">Sí</option>
                <option value="false">No (bloqueado)</option>
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Plan actual</label>
              <div style={{ padding: "12px 0", fontSize: 14, color: "#0f172a" }}>
                {tenant.subscriptions?.[0]?.plan?.name || "Sin plan"} —{" "}
                {tenant.subscriptions?.[0]?.status || "—"}
              </div>
            </div>
          </div>
        </div>

        {/* Users */}
        <div style={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={styles.cardTitle}>Usuarios ({tenant._count.userTenants})</h2>
          </div>

          <table style={styles.userTable}>
            <thead>
              <tr>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Rol</th>
                <th style={styles.th}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {tenant.userTenants.map((ut) => (
                <tr key={ut.id}>
                  <td style={styles.td}>{ut.user.name || "—"}</td>
                  <td style={styles.td}>{ut.user.email}</td>
                  <td style={styles.td}>
                    <span style={styles.roleBadge}>{ut.role}</span>
                  </td>
                  <td style={styles.td}>
                    {ut.user.isActive ? (
                      <span style={{ color: "#10B981" }}>Activo</span>
                    ) : (
                      <span style={{ color: "#e74c3c" }}>Inactivo</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: "100vh",
    background: "#f8f6ff",
    fontFamily: "'Inter', sans-serif",
  },
  container: {
    maxWidth: 800,
    margin: "0 auto",
    padding: "48px 32px",
  },
  backLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    color: "#7c5cff",
    fontSize: 13,
    fontWeight: 600,
    textDecoration: "none",
    marginBottom: 24,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
  },
  title: { fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 },
  slug: { fontSize: 13, color: "#64748b", marginTop: 4 },
  headerActions: { display: "flex", gap: 8 },
  archiveBtn: {
    padding: "8px 12px",
    background: "rgba(231,76,60,0.06)",
    border: "1px solid rgba(231,76,60,0.1)",
    borderRadius: 8,
    cursor: "pointer",
    color: "#e74c3c",
  },
  impersonateBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 14px",
    background: "linear-gradient(135deg, #7c5cff, #9b7dff)",
    color: "#fff",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    textDecoration: "none",
    whiteSpace: "nowrap",
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: "24px",
    border: "1px solid rgba(124,58,237,0.04)",
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: "#0f172a",
    margin: "0 0 20px",
    display: "flex",
    alignItems: "center",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: "#475569" },
  input: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(124,58,237,0.1)",
    fontSize: 14,
    outline: "none",
    background: "#fafafa",
    color: "#0f172a",
  },
  saveBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
    padding: "10px 24px",
    background: "linear-gradient(135deg, #7c5cff, #9b7dff)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  error: {
    background: "rgba(231,76,60,0.08)",
    color: "#e74c3c",
    padding: "12px 16px",
    borderRadius: 10,
    fontSize: 13,
    marginBottom: 16,
  },
  success: {
    background: "rgba(16,185,129,0.08)",
    color: "#10B981",
    padding: "12px 16px",
    borderRadius: 10,
    fontSize: 13,
    marginBottom: 16,
  },
  userTable: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: "10px 12px",
    fontSize: 11,
    fontWeight: 600,
    color: "#94a3b8",
    textTransform: "uppercase",
    borderBottom: "1px solid rgba(124,58,237,0.04)",
  },
  td: { padding: "10px 12px", fontSize: 13, color: "#0f172a", borderBottom: "1px solid rgba(124,58,237,0.03)" },
  roleBadge: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 8,
    background: "rgba(124,92,255,0.08)",
    color: "#7c5cff",
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
  },
};
