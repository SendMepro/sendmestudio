// ================================================================
// admin/page.tsx — Super Admin Dashboard
// Muestra métricas en tiempo real: clientes, licencias, usuarios
// ================================================================

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  Activity,
  AlertTriangle,
  Clock,
  Shield,
  BarChart3,
  CreditCard,
  DollarSign,
  Sliders,
  Settings,
  FileText,
  ArrowRight,
  UserCheck,
  XCircle,
  Zap,
  CalendarClock,
  Sparkles,
  MessageSquare,
  Send,
  BookOpen,
  Layers,
} from "lucide-react";
import SendMeLogo from "@/components/brand/SendMeLogo";
import AdminSessionBadge from "@/app/components/AdminSessionBadge";

// ── Types ──

interface DashboardMetrics {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  expiredTenants: number;
  trialTenants: number;
  cancelledTenants: number;
  tenantsExpiringSoon: number;
  totalUsers: number;
  totalOwners: number;
  totalCustomers: number;
  totalAppointments: number;
  totalMessages: number;
  totalAudiences: number;
  totalCampaignHistory: number;
  totalKnowledgeItems: number;
  totalFiles: number;
}

// ── Metric Card ──

function MetricCard({
  icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
  bg: string;
}) {
  return (
    <div style={styles.metricCard}>
      <div style={{ ...styles.metricIcon, background: bg, color }}>{icon}</div>
      <div style={styles.metricValue}>{value}</div>
      <div style={styles.metricLabel}>{label}</div>
    </div>
  );
}

// ── Quick Module ──

function QuickModule({
  icon,
  title,
  desc,
  href,
  status,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  href: string;
  status: "active" | "coming_soon";
}) {
  return (
    <a
      href={status === "active" ? href : undefined}
      style={{
        ...styles.moduleCard,
        ...(status === "coming_soon" ? styles.moduleCardDisabled : styles.moduleCardActive),
        cursor: status === "active" ? "pointer" : "default",
        textDecoration: "none",
      }}
      onClick={(e) => {
        if (status === "coming_soon") {
          e.preventDefault();
          alert(`[${title}] — Módulo en desarrollo. Próximamente disponible.`);
        }
      }}
    >
      <div style={styles.moduleTop}>
        <div style={{ ...styles.moduleIconBox, color: status === "active" ? "#7c5cff" : "#cbd5e1" }}>
          {icon}
        </div>
        <span
          style={{
            ...styles.moduleBadge,
            background: status === "active" ? "rgba(16,185,129,0.10)" : "rgba(148,163,184,0.10)",
            color: status === "active" ? "#10B981" : "#94a3b8",
          }}
        >
          {status === "active" ? "Activo" : "Próximamente"}
        </span>
      </div>
      <h3 style={styles.moduleTitle}>{title}</h3>
      <p style={styles.moduleDesc}>{desc}</p>
      <div style={styles.moduleFooter}>
        <span style={styles.moduleAction}>
          {status === "active" ? "Abrir" : "Próximamente"}
          <ArrowRight size={13} strokeWidth={1.5} style={{ marginLeft: 4 }} />
        </span>
      </div>
    </a>
  );
}

// ── Page ──

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then((data) => {
        if (data.metrics) setMetrics(data.metrics);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const modules = [
    {
      id: "tenants",
      title: "Clientes / Tenants",
      desc: "Gestión de clientes, registro, configuración y estado de cada negocio.",
      href: "/admin/tenants",
      icon: <Building2 size={20} strokeWidth={1.5} />,
      status: "active" as const,
    },
    {
      id: "users",
      title: "Usuarios",
      desc: "Gestión de usuarios de todos los clientes: roles, estado y contraseñas.",
      href: "/admin/users",
      icon: <Users size={20} strokeWidth={1.5} />,
      status: "active" as const,
    },
    {
      id: "licenses",
      title: "License Center",
      desc: "Planes, pagos, bloqueos, licencias y funciones habilitadas por negocio.",
      href: "/admin/licenses",
      icon: <CreditCard size={20} strokeWidth={1.5} />,
      status: "active" as const,
    },
    {
      id: "ai-costs",
      title: "AI Cost Control",
      desc: "Control interno de gasto IA, límites y margen comercial por cliente.",
      href: "/admin/ai-costs",
      icon: <BarChart3 size={20} strokeWidth={1.5} />,
      status: "active" as const,
    },
    {
      id: "verticals",
      title: "Vertical Templates",
      desc: "Plantillas SaaS multi-vertical: salón, barbería, SPA, centro estético y clínica. CRUD + asignación por tenant.",
      href: "/admin/verticals",
      icon: <Layers size={20} strokeWidth={1.5} />,
      status: "active" as const,
    },
    {
      id: "billing",
      title: "Billing",
      desc: "Facturación, historial de pagos, recibos y reconciliación por negocio.",
      href: "#",
      icon: <DollarSign size={20} strokeWidth={1.5} />,
      status: "coming_soon" as const,
    },
    {
      id: "usage-limits",
      title: "Usage Limits",
      desc: "Límites globales de uso: requests IA, campañas, almacenamiento y API.",
      href: "#",
      icon: <Sliders size={20} strokeWidth={1.5} />,
      status: "coming_soon" as const,
    },
    {
      id: "system-health",
      title: "System Health",
      desc: "Estado de servicios, uptime, latencia, errores y monitoreo en vivo.",
      href: "#",
      icon: <Activity size={20} strokeWidth={1.5} />,
      status: "coming_soon" as const,
    },
    {
      id: "audit-logs",
      title: "Audit Logs",
      desc: "Registro de cambios, accesos admin y eventos del sistema.",
      href: "#",
      icon: <FileText size={20} strokeWidth={1.5} />,
      status: "coming_soon" as const,
    },
    {
      id: "provider-settings",
      title: "Provider Settings",
      desc: "Configuración de proveedores IA, API keys, modelos y pricing.",
      href: "#",
      icon: <Settings size={20} strokeWidth={1.5} />,
      status: "coming_soon" as const,
    },
  ];

  return (
      <div style={styles.wrapper}>
        <div style={styles.page}>
          {/* ── Header ── */}
          <header style={styles.header}>
            <div style={styles.headerRow}>
              <div style={{ ...styles.headerLeft, flex: 1 }}>
                <SendMeLogo variant="full" size="md" theme="dark" />
                <div style={{ marginLeft: 24 }}>
                  <span style={styles.headerKicker}>SendMe Studio · Admin</span>
                  <p style={styles.headerDesc}>
                    Centro de control comercial, licencias y operación SaaS.
                  </p>
                </div>
              </div>
              {/* Admin session badge */}
              <div style={{ marginTop: 16, marginBottom: 8 }}>
                <AdminSessionBadge />
              </div>
              <span style={{ ...styles.badge, ...styles.badgeDanger }}>
                <Shield size={12} strokeWidth={2} />
                Admin only
              </span>
            </div>
          </header>

          {/* ── Metrics Grid ── */}
          {loading ? (
            <div style={styles.loadingState}>Cargando métricas...</div>
          ) : metrics ? (
            <>
              <div style={styles.metricsGrid}>
                <MetricCard
                  icon={<Building2 size={18} strokeWidth={1.5} />}
                  label="Total Clientes"
                  value={metrics.totalTenants}
                  color="#7c5cff"
                  bg="rgba(124,92,255,0.10)"
                />
                <MetricCard
                  icon={<UserCheck size={18} strokeWidth={1.5} />}
                  label="Activos"
                  value={metrics.activeTenants}
                  color="#10B981"
                  bg="rgba(16,185,129,0.10)"
                />
                <MetricCard
                  icon={<XCircle size={18} strokeWidth={1.5} />}
                  label="Suspendidos"
                  value={metrics.suspendedTenants}
                  color="#F59E0B"
                  bg="rgba(245,158,11,0.10)"
                />
                <MetricCard
                  icon={<Clock size={18} strokeWidth={1.5} />}
                  label="En Trial"
                  value={metrics.trialTenants}
                  color="#3B82F6"
                  bg="rgba(59,130,246,0.10)"
                />
                <MetricCard
                  icon={<AlertTriangle size={18} strokeWidth={1.5} />}
                  label="Por Vencer (<15d)"
                  value={metrics.tenantsExpiringSoon}
                  color="#e74c3c"
                  bg="rgba(231,76,60,0.10)"
                />
                <MetricCard
                  icon={<Users size={18} strokeWidth={1.5} />}
                  label="Usuarios Activos"
                  value={metrics.totalUsers}
                  color="#06b6d4"
                  bg="rgba(6,182,212,0.10)"
                />
                <MetricCard
                  icon={<CalendarClock size={18} strokeWidth={1.5} />}
                  label="Owners"
                  value={metrics.totalOwners}
                  color="#8b5cf6"
                  bg="rgba(139,92,246,0.10)"
                />
                <MetricCard
                  icon={<Sparkles size={18} strokeWidth={1.5} />}
                  label="Vencidos"
                  value={metrics.expiredTenants}
                  color="#e74c3c"
                  bg="rgba(231,76,60,0.08)"
                />
              </div>

              {/* ── Data Metrics ── */}
              <div style={{ ...styles.sectionTitle, marginTop: 32 }}>Datos del Sistema</div>
              <div style={styles.metricsGrid}>
                <MetricCard
                  icon={<Users size={18} strokeWidth={1.5} />}
                  label="Clientes (CRM)"
                  value={metrics.totalCustomers}
                  color="#7c5cff"
                  bg="rgba(124,92,255,0.10)"
                />
                <MetricCard
                  icon={<CalendarClock size={18} strokeWidth={1.5} />}
                  label="Citas"
                  value={metrics.totalAppointments}
                  color="#10B981"
                  bg="rgba(16,185,129,0.10)"
                />
                <MetricCard
                  icon={<MessageSquare size={18} strokeWidth={1.5} />}
                  label="Mensajes"
                  value={metrics.totalMessages}
                  color="#3B82F6"
                  bg="rgba(59,130,246,0.10)"
                />
                <MetricCard
                  icon={<Send size={18} strokeWidth={1.5} />}
                  label="Audiencias"
                  value={metrics.totalAudiences}
                  color="#F59E0B"
                  bg="rgba(245,158,11,0.10)"
                />
                <MetricCard
                  icon={<Sparkles size={18} strokeWidth={1.5} />}
                  label="Campañas"
                  value={metrics.totalCampaignHistory}
                  color="#8b5cf6"
                  bg="rgba(139,92,246,0.10)"
                />
                <MetricCard
                  icon={<BookOpen size={18} strokeWidth={1.5} />}
                  label="Knowledge"
                  value={metrics.totalKnowledgeItems}
                  color="#06b6d4"
                  bg="rgba(6,182,212,0.10)"
                />
                <MetricCard
                  icon={<FileText size={18} strokeWidth={1.5} />}
                  label="Documentos"
                  value={metrics.totalFiles}
                  color="#e67e22"
                  bg="rgba(230,126,34,0.10)"
                />
              </div>

              {/* ── Quick actions ── */}
              <div style={styles.quickActions}>
                <Link href="/admin/tenants/new" style={styles.quickActionBtn}>
                  <Zap size={16} strokeWidth={2} />
                  Nuevo Cliente
                </Link>
                <Link href="/admin/tenants" style={styles.quickActionBtnSecondary}>
                  <Building2 size={16} strokeWidth={1.5} />
                  Ver Clientes
                </Link>
              </div>
            </>
          ) : (
            <div style={styles.loadingState}>Error al cargar métricas</div>
          )}

          {/* ── Modules Grid ── */}
          <div style={styles.sectionTitle}>Módulos de Administración</div>
          <div style={styles.modulesGrid}>
            {modules.map((m) => (
              <QuickModule key={m.id} {...m} />
            ))}
          </div>

          {/* ── Footer info ── */}
          <div style={styles.footer}>
            <Shield size={14} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              <strong>Acceso restringido:</strong> Todos los módulos admin requieren autenticación como Super Admin.
              No están visibles para clientes finales.
            </span>
          </div>
        </div>
      </div>
  );
}

// ── Styles ──

const font = {
  sans: "'Inter', sans-serif",
  outfit: "'Outfit', sans-serif",
};

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: "100vh",
    background: "linear-gradient(160deg, #f8f6ff 0%, #f0ecff 100%)",
    overflowX: "hidden",
  },
  page: {
    width: "100%",
    maxWidth: 1200,
    padding: "48px 48px 64px 48px",
    boxSizing: "border-box",
    margin: 0,
  },
  header: { marginBottom: 36 },
  headerRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 20,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 18 },
  headerKicker: {
    fontFamily: font.sans,
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "#7c5cff",
  },
  headerDesc: {
    fontFamily: font.sans,
    fontSize: 14,
    fontWeight: 400,
    color: "#64748b",
    margin: "2px 0 0 0",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 16px",
    borderRadius: 20,
    fontFamily: font.sans,
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  badgeDanger: {
    background: "rgba(231,76,60,0.08)",
    color: "#e74c3c",
    border: "1px solid rgba(231,76,60,0.15)",
  },
  loadingState: {
    textAlign: "center",
    color: "#94a3b8",
    padding: 60,
    fontSize: 14,
    fontFamily: font.sans,
  },

  // Metrics
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: 14,
    marginBottom: 24,
  },
  metricCard: {
    background: "rgba(255,255,255,0.70)",
    backdropFilter: "blur(4px)",
    borderRadius: 20,
    padding: "20px 18px",
    border: "1px solid rgba(124,58,237,0.04)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: 6,
  },
  metricIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  metricValue: {
    fontFamily: font.outfit,
    fontSize: 28,
    fontWeight: 700,
    color: "#0f172a",
    lineHeight: 1.1,
  },
  metricLabel: {
    fontFamily: font.sans,
    fontSize: 11,
    fontWeight: 600,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },

  // Quick actions
  quickActions: {
    display: "flex",
    gap: 10,
    marginBottom: 32,
  },
  quickActionBtn: {
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
    fontFamily: font.sans,
  },
  quickActionBtnSecondary: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 20px",
    background: "rgba(255,255,255,0.70)",
    color: "#7c5cff",
    borderRadius: 14,
    fontSize: 14,
    fontWeight: 600,
    border: "1px solid rgba(124,58,237,0.08)",
    textDecoration: "none",
    fontFamily: font.sans,
  },

  // Section title
  sectionTitle: {
    fontFamily: font.outfit,
    fontSize: 18,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 16,
  },

  // Modules
  modulesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 14,
  },
  moduleCard: {
    padding: "22px 22px 18px",
    borderRadius: 20,
    background: "rgba(255,255,255,0.70)",
    border: "1px solid rgba(124,58,237,0.06)",
    backdropFilter: "blur(4px)",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    transition: "all 0.2s ease",
  },
  moduleCardActive: {},
  moduleCardDisabled: { opacity: 0.55 },
  moduleTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  moduleIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  moduleBadge: {
    padding: "3px 10px",
    borderRadius: 12,
    fontFamily: font.sans,
    fontSize: 10,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  moduleTitle: {
    fontFamily: font.outfit,
    fontSize: 15,
    fontWeight: 600,
    color: "#0f172a",
    margin: 0,
  },
  moduleDesc: {
    fontFamily: font.sans,
    fontSize: 12,
    fontWeight: 400,
    color: "#64748b",
    margin: 0,
    lineHeight: 1.4,
    flex: 1,
  },
  moduleFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  moduleAction: {
    display: "inline-flex",
    alignItems: "center",
    fontFamily: font.sans,
    fontSize: 12,
    fontWeight: 600,
    color: "#7c5cff",
  },

  // Footer
  footer: {
    display: "flex",
    gap: 10,
    marginTop: 40,
    padding: "16px 20px",
    borderRadius: 16,
    background: "rgba(255,255,255,0.50)",
    border: "1px solid rgba(124,58,237,0.04)",
    fontFamily: font.sans,
    fontSize: 12,
    color: "#94a3b8",
    lineHeight: 1.4,
  },
};
