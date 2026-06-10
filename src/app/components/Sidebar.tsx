"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef, useSyncExternalStore, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  Activity,
  BarChart3,
  Brain,
  BookOpen,
  CalendarDays,
  Clock,
  Cpu,
  Database,
  Gem,
  Heart,
  House,
  MessageSquare,
  Package,
  Send,
  Settings,
  Sparkles,
  TrendingUp,
  Users,
  ChevronDown,
  ChevronRight,
  Settings2,
  Newspaper,
  Building2,
  LogOut,
  User,
  SwitchCamera,
  Shield,
  LayoutDashboard,
  Key,
  FileText,
  DollarSign,
  Server,
  PanelTop,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import SendMeLogo from "@/components/brand/SendMeLogo";
import SendMeStudioIcon from "@/components/brand/SendMeStudioIcon";
import { useTenantBranding, type TenantBranding } from "@/hooks/useTenantBranding";
import { useAuth } from "@/hooks/useAuth";
import styles from "./Sidebar.module.css";
import {
  bindUnreadTitleVisibility,
  formatUnreadCount,
  refreshUnreadMessages,
  setCurrentRoute,
  subscribeUnreadMessages,
  unreadMessagesSnapshot,
} from "./sidebarUnreadStore";

/* ── Grupos colapsables ── */
type CollapsibleGroup = {
  id: string;
  icon: React.ComponentType<any>;
  label: string;
  items: readonly NavItemDef[];
};

type NavItemDef = {
  href: string;
  icon: React.ComponentType<any>;
  label: string;
  match: "exact" | "prefix" | "none";
  badge?: string;
};

/* Items principales (siempre visibles, parte superior) */
const topItems = [
  { href: "/", icon: House, label: "Home", match: "exact" },
  { href: "/inbox", icon: MessageSquare, label: "Mensajes", match: "prefix" },
  { href: "/calendar", icon: CalendarDays, label: "Agenda", match: "exact" },
  { href: "/contacts", icon: Users, label: "Contactos", match: "prefix" },
  { href: "/analytics", icon: BarChart3, label: "Asistente IA", match: "exact" },
  { href: "/business", icon: Building2, label: "Business Center", match: "exact" },
  { href: "/growth", icon: TrendingUp, label: "Motor de Crecimiento", match: "exact" },
] as const;

/* ── Admin menu items (Super Admin / route /admin*) ── */
const adminTopItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard Admin", match: "exact" },
  { href: "/admin/tenants", icon: Building2, label: "Clientes / Tenants", match: "prefix" },
  { href: "/admin/tenants/new", icon: User, label: "Nuevo Cliente", match: "exact" },
  { href: "/admin/licenses", icon: Key, label: "Licencias", match: "prefix" },
  { href: "/admin/users", icon: Users, label: "Usuarios", match: "prefix" },
  { href: "/admin/verticals", icon: PanelTop, label: "Vertical Templates", match: "prefix" },
  { href: "/admin/ai-costs", icon: DollarSign, label: "Costos IA", match: "prefix" },
] as const;

/* Grupos colapsables en orden — todos cerrados por defecto */
const collapsibleGroups: CollapsibleGroup[] = [
  {
    id: "campanas",
    icon: Send,
    label: "Campañas",
    items: [
      { href: "/campaigns", icon: Send, label: "Campañas activas", match: "prefix" },
      { href: "/campaigns/history", icon: Clock, label: "Historial", match: "prefix" },
    ],
  },
  {
    id: "inteligencia",
    icon: Brain,
    label: "Inteligencia",
    items: [
      { href: "/brain-admin", icon: Heart, label: "Emotional Brain", match: "prefix" },
      { href: "/brain", icon: Cpu, label: "Agentes", match: "prefix", badge: "Nuevo" },
      { href: "/news", icon: Newspaper, label: "News", match: "prefix" },
      { href: "/salon-intelligence", icon: Sparkles, label: "Inteligencia Salón", match: "prefix" },
      { href: "/studio-pulse", icon: Activity, label: "Pulso Studio", match: "prefix" },
    ],
  },
  {
    id: "contenido",
    icon: BookOpen,
    label: "Contenido",
    items: [
      { href: "/editorial", icon: BookOpen, label: "Editorial", match: "prefix" },
      { href: "/knowledge", icon: Database, label: "Base de conocimiento", match: "prefix" },
    ],
  },
  {
    id: "negocio",
    icon: Settings2,
    label: "Negocio",
    items: [
      { href: "/business", icon: Building2, label: "Centro de Negocio", match: "prefix" },
      { href: "/business/settings", icon: Settings, label: "Personalizar Branding", match: "prefix" },
      { href: "/settings/atelier-memory", icon: Package, label: "Inventario", match: "prefix" },
      { href: "/settings", icon: Settings, label: "Ajustes", match: "exact" },
    ],
  },
];

function isRouteActive(pathname: string, item: NavItemDef) {
  if (item.match === "exact") {
    return pathname === item.href;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

type SidebarProps = {
  expanded?: boolean;
  onToggle?: () => void;
};

export default function Sidebar({ expanded = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, tenantId, role, isSuperAdmin, isLoading: authLoading } = useAuth();
  console.log("SIDEBAR", { pathname, tenantId, role, isSuperAdmin, authLoading });
  const [loggingOut, setLoggingOut] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // ── Impersonación SÍNCRONA: leer search params antes del primer render ──
  const searchParams = useSearchParams();
  const isImpersonating = useMemo(() => {
    const imp = searchParams?.get("impersonating") === "true";
    const tid = searchParams?.get("tenantId");
    return imp && !!tid;
  }, [searchParams]);

  // ── Compute admin mode synchronously from pathname (no wait for auth) ──
  const isAdminRoute = pathname.startsWith("/admin");
  // isAdminMode is computed on every render — no delay, no async dependency
  const isAdminMode = isAdminRoute && !isImpersonating;

  // ── Determine which menu to show ──
  // On admin routes: always show admin menu (synchronous decision).
  // On owner routes: if super admin sees non-admin page, show admin menu too.
  // This is computed on every render and doesn't wait for authLoading.
  const showAdminMenu = (isSuperAdmin || isAdminRoute) && !isImpersonating;

  // Click fuera del menú lo cierra
  useEffect(() => {
    if (!profileMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [profileMenuOpen]);

  const handleLogout = useCallback(async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setProfileMenuOpen(false);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignorar error de red, redirigir de todas formas
    }
    router.push("/login");
    router.refresh();
  }, [router, loggingOut]);

  /* ── Estado colapsable: leer localStorage SÍNCRONO antes del primer render ── */
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const saved = window.localStorage.getItem("sidebar-groups");
      if (saved) return JSON.parse(saved) as Record<string, boolean>;
    } catch { /* fall through */ }
    return {};
  });

  useEffect(() => {
    try {
      window.localStorage.setItem("sidebar-groups", JSON.stringify(openGroups));
    } catch { /* quota exceeded */ }
  }, [openGroups]);

  const toggleGroup = useCallback((id: string) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const unreadState = useSyncExternalStore(
    subscribeUnreadMessages,
    unreadMessagesSnapshot,
    unreadMessagesSnapshot,
  );
  const tenantBrandingData = useTenantBranding();
  console.log("SIDEBAR BRANDING", {
    isAdminMode,
    loading: tenantBrandingData.loading,
    hasBranding: !!tenantBrandingData.branding,
    businessName: tenantBrandingData.branding?.businessName,
  });
  // When in admin mode (super admin or /admin route, not impersonating),
  // force null branding regardless of what hook returns.
  const isBrandingReady = showAdminMenu || !tenantBrandingData.loading;
  const tenantBranding = showAdminMenu
    ? null
    : (tenantBrandingData.loading ? null : tenantBrandingData.branding);
  useEffect(() => {
    setCurrentRoute(pathname);
  }, [pathname]);

  useEffect(() => {
    let isDisposed = false;
    let eventSource: EventSource | null = null;
    const unbindTitleVisibility = bindUnreadTitleVisibility();

    const refresh = () => {
      if (!isDisposed) {
        void refreshUnreadMessages();
      }
    };

    refresh();
    const pollTimer = window.setInterval(refresh, 12000);

    try {
      eventSource = new EventSource("/api/whatsapp/events");
      eventSource.onmessage = (message) => {
        try {
          const event = JSON.parse(message.data) as {
            type?: string;
            message?: { direction?: string };
          };

          if (
            event.type === "new_message" ||
            event.type === "conversation_updated"
          ) {
            refresh();
          }
        } catch {
          refresh();
        }
      };
    } catch {
      eventSource = null;
    }

    return () => {
      isDisposed = true;
      window.clearInterval(pollTimer);
      eventSource?.close();
      unbindTitleVisibility();
    };
  }, []);

  const renderItem = (item: NavItemDef) => {
    const Icon = item.icon;
    const isActive = isRouteActive(pathname, item);
    const showUnreadBadge =
      item.href === "/inbox" && unreadState.unreadMessagesCount > 0;

    return (
      <Link
        key={`${item.label}-${item.href}`}
        href={item.href}
        className={styles.item}
        data-active={isActive ? "true" : "false"}
        title={item.label}
      >
        <span className={styles.icon}>
          <Icon size={16} strokeWidth={isActive ? 2 : 1.45} />
        </span>
        <span className={styles.label}>{item.label}</span>
        {item.badge && <span className={styles.badge}>{item.badge}</span>}
        {item.href === "/brain-admin" && (
          <span className={styles.premiumGem} title="Premium">
            <Gem size={10} strokeWidth={1.8} />
          </span>
        )}
        {showUnreadBadge ? (
          <span
            className={styles.unreadBadge}
            data-new={unreadState.isNewUnread ? "true" : "false"}
          >
            {formatUnreadCount(unreadState.unreadMessagesCount)}
          </span>
        ) : null}
      </Link>
    );
  };

  const renderGroup = (group: CollapsibleGroup) => {
    const GroupIcon = group.icon;
    const isOpen = openGroups[group.id] ?? false;

    return (
      <div key={group.id} className={styles.group}>
        <button
          type="button"
          className={styles.groupHeader}
          data-open={isOpen ? "true" : "false"}
          onClick={() => toggleGroup(group.id)}
          title={group.label}
        >
          <span className={styles.groupHeaderIcon}>
            <GroupIcon size={16} strokeWidth={1.45} />
          </span>
          <span className={styles.groupLabel}>{group.label}</span>
          <ChevronDown size={12} className={styles.groupChevron} />
        </button>
        <div
          className={styles.groupBody}
          data-open={isOpen ? "true" : "false"}
        >
          {group.items.map(renderItem)}
        </div>
      </div>
    );
  };

  return (
    <div
      className={styles.sidebar}
      data-expanded={expanded ? "true" : "false"}
    >
      <div className={styles.surface}>
        <div className={styles.brand}>
          {/* Brand logo: show admin/static when showAdminMenu, tenant branding otherwise */}
          {showAdminMenu ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 2px" }}>
              <SendMeStudioIcon size={expanded ? "md" : "sm"} />
              {expanded && (
                <span style={{ fontFamily: "'Arimo', sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: "-0.04em", color: "#14121c" }}>
                  SendMe Studio
                </span>
              )}
            </div>
          ) : !isBrandingReady ? (
            // Skeleton mientras carga branding — evita flash de "SendMe Studio"
            <div className={styles.tenantLogo} style={{ opacity: 0.5 }}>
              <div className={styles.tenantLogoImg}
                style={{
                  width: expanded ? 32 : 28,
                  height: expanded ? 32 : 28,
                  borderRadius: 8,
                  background: "rgba(124,92,255,0.12)",
                }}
              />
              {expanded && (
                <div style={{
                  height: 14,
                  width: 120,
                  borderRadius: 4,
                  background: "rgba(124,92,255,0.08)",
                }} />
              )}
            </div>
          ) : tenantBranding?.logoUrl ? (
            <div className={styles.tenantLogo}>
              <img
                src={tenantBranding.logoUrl}
                alt={tenantBranding.businessName}
                className={styles.tenantLogoImg}
                style={{ width: expanded ? 32 : 28, height: expanded ? 32 : 28 }}
              />
              {expanded && (
                <span className={styles.tenantName}>{tenantBranding.businessName}</span>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 2px" }}>
              <SendMeStudioIcon size={expanded ? "md" : "sm"} />
              {expanded && (
                <span style={{ fontFamily: "'Arimo', sans-serif", fontWeight: 800, fontSize: 16, letterSpacing: "-0.04em", color: "#14121c" }}>
                  SendMe Studio
                </span>
              )}
            </div>
          )}
        </div>

        <nav className={styles.nav} aria-label="Navegación principal">
          {showAdminMenu ? (
            /* ── Admin Menu ── */
            <div className={styles.navTop}>
              {adminTopItems.map(renderItem)}
            </div>
          ) : (
            /* ── Owner / Tenant Menu ── */
            <>
              <div className={styles.navTop}>
                {topItems.map(renderItem)}
              </div>

              <div className={styles.groupDivider} />

              <div className={styles.navGroups}>
                {collapsibleGroups.map(renderGroup)}
              </div>
            </>
          )}

          {/* ── Toggle sidebar expand/collapse — al final del nav, como item más ── */}
          <button
            type="button"
            className={styles.toggleBtn}
            onClick={onToggle}
            title={expanded ? "Colapsar menú" : "Expandir menú"}
          >
            <span className={styles.icon}>
              {expanded ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
            </span>
            <span className={styles.label}>{expanded ? "Colapsar menú" : "Expandir"}</span>
          </button>
        </nav>

        <div className={styles.profileArea} ref={profileRef}>
          <button
            type="button"
            className={styles.profileTrigger}
            onClick={() => setProfileMenuOpen((v) => !v)}
            aria-haspopup="true"
            aria-expanded={profileMenuOpen}
            title="Perfil"
          >
            {/* Avatar: show admin when showAdminMenu, tenant logo otherwise */}
            {showAdminMenu ? (
              <SendMeStudioIcon
                key="admin-avatar"
                size="sm"
                className={styles.avatar}
                style={{ border: "1px solid rgba(35,30,60,0.12)", borderRadius: "50%" }}
              />
            ) : !isBrandingReady ? (
              <div className={styles.avatar}
                style={{
                  borderRadius: "50%",
                  background: "rgba(124,92,255,0.12)",
                  width: 32,
                  height: 32,
                }}
              />
            ) : tenantBranding?.logoUrl ? (
              <img
                src={tenantBranding.logoUrl}
                alt={tenantBranding.businessName || ""}
                className={styles.avatar}
              />
            ) : (
              <SendMeStudioIcon
                key="fallback-avatar"
                size="sm"
                className={styles.avatar}
                style={{ border: "1px solid rgba(35,30,60,0.12)", borderRadius: "50%" }}
              />
            )}
            <div className={styles.profileCopy}>
              <div className={styles.profileName}>
                {showAdminMenu ? "SendMe Studio" : !isBrandingReady ? "" : (tenantBranding?.businessName || "SendMe Studio")}
              </div>
              <div className={styles.profileRole}>
                {showAdminMenu ? "Admin" : !isBrandingReady ? "" : (tenantBranding?.tagline || "AI Business Workspace")}
              </div>
            </div>
            <ChevronDown size={12} strokeWidth={1.5} className={styles.profileChevron} data-open={profileMenuOpen ? "true" : "false"} />
          </button>

          {profileMenuOpen && (
            <div className={styles.profileMenu}>
              {showAdminMenu ? (
                <>
                  {/* ── User info header ── */}
                  <div style={{
                    padding: "10px 12px 6px",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "rgba(20,18,28,0.45)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}>
                    {user?.email || "admin@sendme.studio"}
                  </div>
                  <div style={{
                    padding: "0 12px 10px",
                    fontSize: 11,
                    color: "rgba(124,92,255,0.7)",
                    fontWeight: 500,
                  }}>
                    Super Admin
                  </div>
                  <div className={styles.menuDivider} />
                  <Link href="/admin" className={styles.menuItem} onClick={() => setProfileMenuOpen(false)}>
                    <LayoutDashboard size={14} strokeWidth={1.5} />
                    <span>Dashboard Admin</span>
                  </Link>
                  <Link href="/admin/tenants" className={styles.menuItem} onClick={() => setProfileMenuOpen(false)}>
                    <Building2 size={14} strokeWidth={1.5} />
                    <span>Clientes / Tenants</span>
                  </Link>
                  <Link href="/admin/settings" className={styles.menuItem} onClick={() => setProfileMenuOpen(false)}>
                    <Settings2 size={14} strokeWidth={1.5} />
                    <span>Configuración</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/business/settings" className={styles.menuItem} onClick={() => setProfileMenuOpen(false)}>
                    <User size={14} strokeWidth={1.5} />
                    <span>Ver perfil del negocio</span>
                  </Link>
                  <Link href="/business/settings" className={styles.menuItem} onClick={() => setProfileMenuOpen(false)}>
                    <Settings2 size={14} strokeWidth={1.5} />
                    <span>Configuración</span>
                  </Link>
                  <Link href="/login" className={styles.menuItem} onClick={() => setProfileMenuOpen(false)}>
                    <SwitchCamera size={14} strokeWidth={1.5} />
                    <span>Cambiar cuenta</span>
                  </Link>
                </>
              )}

              <div className={styles.menuDivider} />

              <button
                type="button"
                className={styles.menuItem}
                onClick={handleLogout}
                disabled={loggingOut}
                style={{ color: "#e74c3c" }}
              >
                <LogOut size={14} strokeWidth={1.5} />
                <span>{loggingOut ? "Cerrando..." : "Cerrar sesión"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
