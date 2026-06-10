// ================================================================
// admin/users/page.tsx — Super Admin: Gestión de usuarios
// ================================================================

"use client";

import { useState, useEffect } from "react";
import { Users, Search, Shield, UserCheck, UserX, LogOut } from "lucide-react";
import AdminSessionBadge from "@/app/components/AdminSessionBadge";

interface User {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  isSuperAdmin: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  userTenants: Array<{
    id: string;
    role: string;
    tenant: { businessName: string; slug: string };
  }>;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/users?includeInactive=true")
      .then((r) => r.json())
      .then((data) => setUsers(data.users || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.name || "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Usuarios</h1>
            <p style={styles.subtitle}>
              Gestión de usuarios de todos los clientes.
            </p>
          </div>
          <div>
            <AdminSessionBadge />
          </div>
        </div>

        <div style={styles.searchBar}>
          <Search size={16} strokeWidth={1.5} color="#94a3b8" />
          <input
            style={styles.searchInput}
            placeholder="Buscar por email o nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={styles.loading}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>Sin resultados</div>
        ) : (
          <div style={styles.list}>
            {filtered.map((u) => (
              <div key={u.id} style={styles.userCard}>
                <div style={styles.userLeft}>
                  <div style={styles.avatar}>
                    {(u.name || u.email)[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={styles.userName}>
                      {u.name || "Sin nombre"}
                      {u.isSuperAdmin && (
                        <Shield
                          size={14}
                          strokeWidth={2}
                          color="#7c5cff"
                          style={{ marginLeft: 8 }}
                        />
                      )}
                    </div>
                    <div style={styles.userEmail}>{u.email}</div>
                  </div>
                </div>

                <div style={styles.userInfo}>
                  <div style={styles.tenantList}>
                    {u.userTenants.map((ut) => (
                      <span key={ut.id} style={styles.tenantBadge}>
                        {ut.tenant.businessName}{" "}
                        <span style={{ fontWeight: 400 }}>({ut.role})</span>
                      </span>
                    ))}
                    {u.userTenants.length === 0 && (
                      <span style={{ color: "#94a3b8", fontSize: 12 }}>
                        Sin tenant asignado
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  {u.isActive ? (
                    <span style={styles.statusActive}>
                      <UserCheck size={12} strokeWidth={2} />
                      Activo
                    </span>
                  ) : (
                    <span style={styles.statusInactive}>
                      <UserX size={12} strokeWidth={2} />
                      Inactivo
                    </span>
                  )}
                  {u.mustChangePassword && (
                    <span style={styles.pendingBadge}>Pendiente password</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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
    maxWidth: 900,
    margin: "0 auto",
    padding: "48px 32px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
  },
  title: { fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 },
  subtitle: { fontSize: 14, color: "#64748b", marginTop: 4 },
  searchBar: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 16px",
    background: "#fff",
    border: "1px solid rgba(124,58,237,0.06)",
    borderRadius: 14,
    marginBottom: 24,
  },
  searchInput: {
    border: "none",
    outline: "none",
    flex: 1,
    fontSize: 14,
    background: "transparent",
    color: "#0f172a",
  },
  loading: { textAlign: "center", color: "#94a3b8", padding: 60 },
  empty: { textAlign: "center", color: "#94a3b8", padding: 60, background: "#fff", borderRadius: 16 },
  list: { display: "flex", flexDirection: "column", gap: 8 },
  userCard: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "16px 20px",
    background: "#fff",
    borderRadius: 14,
    border: "1px solid rgba(124,58,237,0.04)",
  },
  userLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minWidth: 220,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #7c5cff, #9b7dff)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 700,
    flexShrink: 0,
  },
  userName: {
    fontSize: 14,
    fontWeight: 600,
    color: "#0f172a",
    display: "flex",
    alignItems: "center",
  },
  userEmail: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  userInfo: { flex: 1 },
  tenantList: { display: "flex", flexWrap: "wrap", gap: 6 },
  tenantBadge: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 8,
    background: "rgba(124,92,255,0.06)",
    color: "#7c5cff",
    fontSize: 11,
    fontWeight: 600,
  },
  statusActive: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "3px 10px",
    borderRadius: 8,
    background: "rgba(16,185,129,0.08)",
    color: "#10B981",
    fontSize: 11,
    fontWeight: 600,
  },
  statusInactive: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "3px 10px",
    borderRadius: 8,
    background: "rgba(231,76,60,0.08)",
    color: "#e74c3c",
    fontSize: 11,
    fontWeight: 600,
  },
  pendingBadge: {
    display: "inline-flex",
    marginLeft: 6,
    padding: "3px 8px",
    borderRadius: 8,
    background: "rgba(245,158,11,0.1)",
    color: "#F59E0B",
    fontSize: 10,
    fontWeight: 600,
  },
};
