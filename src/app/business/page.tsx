"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Building2,
  DollarSign,
  Receipt,
  ShoppingBag,
  Wallet,
  Bell,
  CalendarCheck,
  Package,
  Clock,
  Users,
  BarChart3,
  Send,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  Lightbulb,
  RefreshCw,
  AlertTriangle,
  Palette,
} from "lucide-react";
import AppShell from "../components/AppShell";
import styles from "./business.module.css";

/* ── Types ──────────────────────────────────────────────────── */

type KpiData = {
  id: string;
  label: string;
  value: number;
  display: string;
  trend: "up" | "down" | "neutral";
  trendValue: string;
  meta?: number;
  metaDisplay?: string;
  detail?: string;
  source: string;
  tooltip?: string;
};

type Opportunity = {
  id: string;
  icon: string;
  title: string;
  description: string;
  impact: number;
  impactDisplay: string;
  priority: "alta" | "media" | "baja";
  status: "pendiente" | "resuelto";
  cta: string;
  ctaAction: string;
  source: string;
};

type ExecutiveSummary = {
  text: string;
  cta: string;
  ctaAction: string;
  source: string;
  scores: {
    inventory: number;
    sales: number;
    commission: number;
    global: number;
    whatsapp: number;
  };
};

type AreaSummary = {
  id: string;
  icon: string;
  label: string;
  primary: string;
  primaryLabel: string;
  secondary: string;
  tertiary: string;
  source: string;
};

type BusinessReport = {
  hasRealData: boolean;
  source: string;
  generatedAt: string;
  kpis: KpiData[];
  opportunities: Opportunity[];
  executiveSummary: ExecutiveSummary;
  areaSummaries: AreaSummary[];
  agentScores: {
    operationsScore: number;
    businessScore: number;
    whatsappScore: number;
    whatsappMode: string;
    executiveRecommendations: string[];
  };
  insights: {
    topProduct: string | null;
    criticalCount: number;
    totalStockValue: number;
    totalStock: number;
  };
};

/* ── Icon picker ────────────────────────────────────────────── */

const iconMap: Record<string, React.ComponentType<any>> = {
  Bell, CalendarCheck, Package, Clock, Users, BarChart3, Send, Sparkles, ShoppingBag, Wallet, Receipt, DollarSign, Building2,
};

function pickIcon(name: string): React.ComponentType<any> {
  return iconMap[name] ?? Sparkles;
}

function trendIcon(trend: "up" | "down" | "neutral") {
  if (trend === "up") return TrendingUp;
  if (trend === "down") return TrendingDown;
  return Minus;
}

function scoreColor(score: number): string {
  if (score >= 70) return "good";
  if (score >= 40) return "mid";
  return "bad";
}

/* ── Page ───────────────────────────────────────────────────── */

export default function BusinessCenterPage() {
  const [report, setReport] = useState<BusinessReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/business-center");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Error ${res.status}`);
      }
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setReport(data as BusinessReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  /* ── Loading State ── */
  if (loading) {
    return (
      <AppShell>
        <div className={styles.page}>
          <div className={styles.header}>
            <div className={styles.kicker}>Dashboard Ejecutivo</div>
            <div className={styles.headerTop}>
              <div className={styles.headerTitleGroup}>
                <div className={`${styles.skeleton}`} style={{ width: 40, height: 40, borderRadius: 14 }} />
                <div className={`${styles.skeleton}`} style={{ width: 200, height: 24 }} />
              </div>
            </div>
          </div>
          <div className={styles.kpiGrid}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={`${styles.skeleton} ${styles.skeletonKpi}`} />
            ))}
          </div>
          <div className={styles.insightsRow}>
            <div className={`${styles.skeleton} ${styles.skeletonExec}`} />
            <div className={styles.insightGrid}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={`${styles.skeleton} ${styles.skeletonInsight}`} />
              ))}
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  /* ── Error State ── */
  if (error) {
    return (
      <AppShell>
        <div className={styles.page}>
          <div className={styles.errorState}>
            <AlertTriangle size={24} className={styles.errorIcon} />
            <span className={styles.errorMessage}>{error}</span>
            <button className={styles.retryButton} onClick={fetchReport}>
              <RefreshCw size={12} style={{ marginRight: 6 }} />
              Reintentar
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  /* ── Empty State ── */
  if (!report) {
    return (
      <AppShell>
        <div className={styles.page}>
          <div className={styles.errorState}>
            <Building2 size={24} className={styles.errorIcon} />
            <span className={styles.errorMessage}>Centro de Negocio no disponible</span>
            <span style={{ fontSize: 11, opacity: 0.6 }}>Conecta tus fuentes de datos para ver inteligencia de negocio</span>
          </div>
        </div>
      </AppShell>
    );
  }

  /* ── Empty State (no real data) ── */
  if (report && !report.hasRealData) {
    return (
      <AppShell>
        <div className={styles.page}>
          <div className={styles.header}>
            <div className={styles.kicker}>Dashboard Ejecutivo</div>
            <div className={styles.headerTop}>
              <div className={styles.headerTitleGroup}>
                <div className={styles.headerIcon}>
                  <Sparkles size={20} strokeWidth={1.5} />
                </div>
                <h1 className={styles.headerTitle}>Centro de Negocio</h1>
              </div>
            </div>
          </div>

          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: 60, textAlign: "center", gap: 16,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: "rgba(124,92,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Building2 size={28} color="#7c5cff" />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              Tu centro de negocio está listo
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", maxWidth: 400, margin: 0 }}>
              Una vez que tengas clientes, citas y ventas, aquí verás inteligencia de negocio en tiempo real con métricas, oportunidades y recomendaciones IA.
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <Link href="/business/settings" style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "10px 20px", borderRadius: 10,
                background: "#7c5cff", color: "#fff",
                fontWeight: 600, fontSize: 14, textDecoration: "none",
              }}>
                <Palette size={14} />
                Configurar negocio
              </Link>
              <Link href="/onboarding" style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "10px 20px", borderRadius: 10,
                border: "1px solid var(--glass-border)",
                color: "var(--text-primary)", fontWeight: 500, fontSize: 14, textDecoration: "none",
              }}>
                <Sparkles size={14} />
                Ver onboarding
              </Link>
            </div>
            <div style={{ display: "flex", gap: 24, marginTop: 16 }}>
              {[
                { icon: "📱", label: "Conecta WhatsApp", desc: "Recibe mensajes de clientes" },
                { icon: "✂️", label: "Configura servicios", desc: "Define lo que ofreces" },
                { icon: "📦", label: "Agrega productos", desc: "Gestiona tu inventario" },
              ].map((item) => (
                <div key={item.label} style={{ textAlign: "center", maxWidth: 140 }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{item.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  /* ── Render ── */
  const { kpis, opportunities, executiveSummary, areaSummaries, agentScores } = report;

  return (
    <AppShell>
      <div className={styles.page}>

        {/* ══════ Header ══════ */}
        <div className={styles.header}>
          <span className={styles.kicker}>Dashboard Ejecutivo</span>
          <div className={styles.headerTop}>
            <div className={styles.headerTitleGroup}>
              <div className={styles.headerIcon}>
                <Building2 size={20} strokeWidth={1.5} />
              </div>
              <h1 className={styles.headerTitle}>Centro de Negocio</h1>
            </div>
            <div className={styles.headerBadges}>
              <span className={`${styles.badge} ${styles.badgeAi}`}>
                <Sparkles size={10} strokeWidth={2} />
                IA Ejecutiva
              </span>
            </div>
          </div>
        </div>

        {/* ══════ KPI Row (4 columnas) ══════ */}
        <div className={styles.kpiGrid}>
          {kpis.map((kpi) => {
            const TrendIcon = trendIcon(kpi.trend);
            const KpiIcon = pickIcon(
              kpi.id === "ventas-mes" ? "DollarSign" :
              kpi.id === "ticket-promedio" ? "Receipt" :
              kpi.id === "productos-vendidos" ? "ShoppingBag" : "Wallet"
            );
            const iconColor =
              kpi.id === "ventas-mes" ? "#10b981" :
              kpi.id === "ticket-promedio" ? "#7c5cff" :
              kpi.id === "productos-vendidos" ? "#f59e0b" : "#06b6d4";

            return (
              <div key={kpi.id} className={styles.kpiCard} title={kpi.tooltip}>
                <div className={styles.kpiIconWrap} style={{ background: `${iconColor}12`, color: iconColor }}>
                  <KpiIcon size={17} strokeWidth={1.5} />
                </div>
                <div className={styles.kpiValue}>{kpi.display}</div>
                <div className={styles.kpiLabel}>{kpi.label}</div>
                {kpi.detail && <div className={styles.kpiDetail}>{kpi.detail}</div>}
                <div className={`${styles.kpiTrend} ${styles[`trend${kpi.trend === "up" ? "Up" : kpi.trend === "down" ? "Down" : "Neutral"}`]}`}>
                  <TrendIcon size={10} strokeWidth={2} />
                  {kpi.trendValue}
                </div>
                {kpi.metaDisplay && <div className={styles.kpiMeta}>{kpi.metaDisplay}</div>}
                <div className={styles.sourceLabel}>{kpi.source}</div>
              </div>
            );
          })}
        </div>

        {/* ══════ Insights Row ══════ */}
        <div className={styles.insightsRow}>

          {/* Executive Summary */}
          <div className={styles.execSummary}>
            <div className={styles.execSummaryHeader}>
              <Lightbulb size={16} className={styles.execSummaryIcon} />
              <span className={styles.execSummaryTitle}>Resumen Ejecutivo IA</span>
            </div>
            <p className={styles.execSummaryText}>{executiveSummary.text}</p>
            <button className={styles.execSummaryCta}>
              {executiveSummary.cta}
              <ChevronRight size={12} strokeWidth={2} />
            </button>
            <div className={styles.execSummaryScores}>
              <span className={`${styles.scoreChip} ${styles[`score${scoreColor(agentScores.businessScore)}`]}`}>
                Negocio {agentScores.businessScore}%
              </span>
              <span className={`${styles.scoreChip} ${styles[`score${scoreColor(executiveSummary.scores.inventory)}`]}`}>
                Inventario {executiveSummary.scores.inventory}%
              </span>
              <span className={`${styles.scoreChip} ${styles[`score${scoreColor(agentScores.whatsappScore)}`]}`}>
                WhatsApp {agentScores.whatsappScore}%
              </span>
            </div>
          </div>

          {/* Insight Cards (2×2) */}
          <div className={styles.insightGrid}>
            {opportunities.map((opp) => {
              const OppIcon = pickIcon(opp.icon);
              const iconBg =
                opp.id === "clientes-dormidos" ? "rgba(245,158,11,0.12)" :
                opp.id === "reservas-pendientes" ? "rgba(239,68,68,0.1)" :
                opp.id === "stock-critico" ? "rgba(59,130,246,0.1)" : "rgba(16,185,129,0.1)";
              const iconColor =
                opp.id === "clientes-dormidos" ? "#d97706" :
                opp.id === "reservas-pendientes" ? "#dc2626" :
                opp.id === "stock-critico" ? "#2563eb" : "#059669";

              return (
                <div key={opp.id} className={styles.insightCard}>
                  <div className={styles.insightHeader}>
                    <div className={styles.insightIcon} style={{ background: iconBg, color: iconColor }}>
                      <OppIcon size={14} strokeWidth={1.5} />
                    </div>
                    <span className={styles.insightTitle}>{opp.title}</span>
                  </div>
                  <span className={styles.insightDesc}>{opp.description}</span>
                  {opp.impact > 0 && (
                    <span className={styles.insightImpact}>{opp.impactDisplay}</span>
                  )}
                  {opp.impact === 0 && opp.impactDisplay && (
                    <span className={styles.insightDesc}>{opp.impactDisplay}</span>
                  )}
                  <div className={styles.insightBadges}>
                    <span className={`${styles.priorityBadge} ${styles[`priorityBadge${opp.priority === "alta" ? "Alta" : "Media"}`]}`}>
                      {opp.priority === "alta" ? "🟠 Alta" : "🟡 Media"}
                    </span>
                    <span className={`${styles.statusBadge} ${styles[`statusBadge${opp.status === "pendiente" ? "Pending" : "Resolved"}`]}`}>
                      {opp.status === "pendiente" ? "⏳ Pendiente" : "✅ Resuelto"}
                    </span>
                  </div>
                  <button className={styles.insightCta} onClick={() => console.log(opp.ctaAction)}>
                    {opp.cta}
                  </button>
                </div>
              );
            })}
          </div>

        </div>

        {/* ══════ Area Summary Grid (5 cards) ══════ */}
        <div className={styles.areaGrid}>
          {areaSummaries.map((area) => {
            const AreaIcon = pickIcon(area.icon);
            return (
              <div key={area.id} className={styles.areaCard}>
                <div className={styles.areaIcon}>
                  <AreaIcon size={18} strokeWidth={1.3} />
                </div>
                <div className={styles.areaLabel}>{area.label}</div>
                <div className={styles.areaPrimary}>{area.primary}</div>
                <div className={styles.areaPrimaryLabel}>{area.primaryLabel}</div>
                <div className={styles.areaSecondary}>{area.secondary}</div>
                <div className={styles.areaTertiary}>{area.tertiary}</div>
                <div className={styles.areaLink}>
                  Ver más →
                </div>
              </div>
            );
          })}
        </div>

        {/* ══════ Footer ── con datos reales ── */}
        <div className={styles.footer}>
          📊 Datos en vivo de tu negocio. Conecta más fuentes en Configuración para enriquecer tu dashboard.
        </div>

      </div>
    </AppShell>
  );
}
