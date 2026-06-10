"use client";

import { useCallback, useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import PageLayout from "../components/PageLayout";
import PageHeader from "../components/PageHeader";
import {
  Sparkles,
  Clock,
  Headphones,
  UserRound,
  Zap,
  Settings,
  ShieldCheck,
  Check,
  X,
  DollarSign,
  CalendarCheck,
  TrendingUp,
  Ban,
  Eye,
} from "lucide-react";
import { useAnalyticsData, type DailyAnalyticsRow } from "./hooks/useAnalyticsData";
import styles from "./analytics.module.css";

type ConfigData = {
  defaultMode: "manual" | "automatic" | "scheduled";
  scheduleStart: string;
  scheduleEnd: string;
  averageHumanResponseMinutes: number;
};

const MODE_LABELS: Record<string, string> = {
  manual: "Manual",
  automatic: "Automático",
  scheduled: "Horario",
};

const MODE_STATUS: Record<string, { label: string; dot: string }> = {
  automatic: { label: "Activa ahora", dot: "#7c5cff" },
  scheduled: { label: "Activa ahora", dot: "#7c5cff" },
  manual: { label: "Recepción toma control", dot: "#999" },
};

function formatHours(m: number): string {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r > 0 ? `${h}h ${r}m` : `${h}h`;
}

/* ── Demo data ──────────────────────────────────── */

const DEMO_LIVE = {
  date: new Date().toISOString().slice(0, 10),
  conversationsTotal: 51,
  conversationsAI: 36,
  conversationsHuman: 15,
  conversationsScheduled: 22,
  iaMessagesSent: 158,
  iaDraftsGenerated: 42,
  automationPercent: 71,
  iaMinutesSaved: 420,
  avgResponseMinutes: 0.8,
  currentMode: "automatic",
  activeConversations: 3,
  messagesLastHour: 12,
  coveragePercent: 70,
};

const DEMO_HOURLY: Record<string, { ai: number; human: number }> = {
  "08": { ai: 2, human: 1 },
  "09": { ai: 4, human: 2 },
  "10": { ai: 6, human: 2 },
  "11": { ai: 5, human: 3 },
  "12": { ai: 3, human: 1 },
  "13": { ai: 2, human: 2 },
  "14": { ai: 5, human: 1 },
  "15": { ai: 4, human: 2 },
  "16": { ai: 3, human: 1 },
  "17": { ai: 2, human: 0 },
};

const DEMO_DAILY = {
  date: new Date().toISOString().slice(0, 10),
  conversationsTotal: 51,
  conversationsAI: 36,
  conversationsHuman: 15,
  conversationsScheduled: 22,
  iaMessagesSent: 158,
  iaDraftsGenerated: 42,
  iaMinutesSaved: 420,
  automationPercent: 71,
  coveragePercent: 70,
  hourly: DEMO_HOURLY,
};

function generateDemoHistory(): DailyAnalyticsRow[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  }
  return days.map((date, idx) => ({
    date,
    conversationsTotal: 40 + idx * 3,
    conversationsAI: 28 + idx * 2,
    conversationsHuman: 12 + idx,
    conversationsScheduled: 15 + idx,
    iaMessagesSent: 120 + idx * 8,
    iaDraftsGenerated: 30 + idx * 3,
    iaMinutesSaved: 350 + idx * 20,
    automationPercent: 65 + idx,
    coveragePercent: 62 + idx,
    hourly: DEMO_HOURLY,
  }));
}

const DEMO_ATTRIBUTION = {
  reservationsAI: 11,
  reservationsHuman: 8,
  valueGeneratedAI: 720000,
  conversionRateAI: 64,
  cancellationRateAI: 8,
};

export default function AnalyticsPage() {
  const { live, daily, history, loading, error, refresh } = useAnalyticsData();

  // ── Demo mode ──
  const [demoMode, setDemoMode] = useState(false);

  // ── Config state ──────────────────────────────────────────────
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [editing, setEditing] = useState(false);
  const [draftConfig, setDraftConfig] = useState<ConfigData | null>(null);
  const [saving, setSaving] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [configSuccess, setConfigSuccess] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/analytics/config");
      if (!res.ok) throw new Error("Error al cargar configuración");
      const json = await res.json();
      setConfig(json.config);
      setDraftConfig(json.config);
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = useCallback(async () => {
    if (!draftConfig) return;
    setSaving(true);
    setConfigError(null);
    setConfigSuccess(false);
    try {
      const res = await fetch("/api/analytics/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftConfig),
      });
      if (!res.ok) throw new Error("Error al guardar");
      const json = await res.json();
      setConfig(json.config);
      setDraftConfig(json.config);
      setEditing(false);
      setConfigSuccess(true);
      setTimeout(() => setConfigSuccess(false), 2000);
      refresh();
    } catch (e) {
      setConfigError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  }, [draftConfig, refresh]);

  // ── Attribution state ────────────────────────────────────
  type AttributionMetrics = {
    reservationsAI: number;
    reservationsHuman: number;
    valueGeneratedAI: number;
    conversionRateAI: number;
    cancellationRateAI: number;
  };
  const [attribution, setAttribution] = useState<AttributionMetrics | null>(null);
  const [attributionLoading, setAttributionLoading] = useState(true);

  const fetchAttribution = useCallback(async () => {
    try {
      const res = await fetch("/api/attribution");
      if (!res.ok) throw new Error("Error al cargar atribución");
      const json = await res.json();
      setAttribution(json.metrics);
    } catch {
      // Silently fail
    } finally {
      setAttributionLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttribution();
    const interval = setInterval(fetchAttribution, 30000);
    return () => clearInterval(interval);
  }, [fetchAttribution]);

  const convWord = (n: number) => n === 1 ? "conversación" : "conversaciones";
  const msgWord = (n: number) => n === 1 ? "mensaje" : "mensajes";

  // ── Resolve display data ──
  const dataLive = demoMode ? DEMO_LIVE : live;
  const dataDaily = demoMode ? DEMO_DAILY : daily;
  const dataHistory = demoMode ? generateDemoHistory() : history;
  const dataAttribution = demoMode ? DEMO_ATTRIBUTION : attribution;
  const dataLoading = demoMode ? false : loading;
  const dataError = demoMode ? null : error;

  const modeKey = dataLive?.currentMode || config?.defaultMode || "manual";
  const status = MODE_STATUS[modeKey] || MODE_STATUS.manual;
  const scheduleLabel =
    config?.defaultMode === "scheduled" && config?.scheduleStart && config?.scheduleEnd
      ? `Lu–Vie ${config.scheduleStart} – ${config.scheduleEnd}`
      : null;

  const COVERAGE_TARGET = 80;

  const conversationsTotal =
    (dataLive?.conversationsAI ?? 0) + (dataLive?.conversationsHuman ?? 0);
  const coverage = conversationsTotal > 0
    ? Math.round(((dataLive?.conversationsAI ?? 0) / conversationsTotal) * 100)
    : 0;
  const aboveTarget = coverage >= COVERAGE_TARGET;
  const coverageGap = Math.max(0, COVERAGE_TARGET - coverage);

  const hasRealData = !demoMode && (
    (live && (live.conversationsAI > 0 || live.conversationsHuman > 0))
  );

  return (
    <AppShell>
      <PageLayout loading={dataLoading} error={dataError}>
        <PageHeader icon={Sparkles} title="Recepcionista IA" kicker="Dashboard">
          {config && (
            <button onClick={() => setEditing(!editing)} style={{
              border: "1px solid rgba(197,184,229,0.18)",
              borderRadius: "var(--radius-full)",
              background: "rgba(255,255,255,0.5)",
              padding: "4px 12px",
              fontSize: "9px",
              fontWeight: 600,
              color: "var(--text-secondary)",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontFamily: "inherit",
            }}>
              <Settings size={10} strokeWidth={1.5} />
              Config
            </button>
          )}
          <button
            className={`${styles.demoToggle} ${demoMode ? styles.demoToggleActive : ""}`}
            onClick={() => setDemoMode(!demoMode)}
          >
            <Eye size={10} strokeWidth={1.5} />
            {demoMode ? "Demo ON" : "Demo"}
          </button>
        </PageHeader>

        {/* ── Demo note ── */}
        {demoMode && (
          <div className={styles.demoNote}>
            <span className={styles.demoBadge}>Demo</span>
            Vista demostrativa para presentación
          </div>
        )}

        {/* ── Empty state (no data, no demo) ── */}
        {!demoMode && !dataLoading && !dataError && !hasRealData && (
          <div className={styles.emptyState}>
            <Sparkles size={40} strokeWidth={1.2} className={styles.emptyIcon} />
            <div className={styles.emptyTitle}>Sin actividad registrada aún</div>
            <div className={styles.emptyDesc}>
              La recepcionista IA aún no ha atendido conversaciones. Los datos aparecerán aquí automáticamente cuando haya actividad.
            </div>
          </div>
        )}

        {/* ── Dashboard (only when data or demo) ── */}
        {(demoMode || hasRealData) && (
        <>

        {/* ── Config Panel ── */}
        {editing && draftConfig && (
          <div className={styles.configPanel}>
            <div className={styles.configHeader}>
              <div className={styles.configTitle}>Configuración Global</div>
              <div className={styles.configActions}>
                {configSuccess && (
                  <span className={styles.configSuccess}><Check size={12} /> Guardado</span>
                )}
                {configError && (
                  <span className={styles.configError}><X size={12} /> {configError}</span>
                )}
                <button onClick={() => { setDraftConfig(config); setEditing(false); }} style={{
                  border: "1px solid rgba(197,184,229,0.20)", borderRadius: "var(--radius-full)",
                  background: "transparent", padding: "4px 12px", fontSize: "9.5px",
                  fontWeight: 600, color: "var(--text-muted)", cursor: "pointer",
                  fontFamily: "inherit",
                }}>
                  Cancelar
                </button>
                <button onClick={handleSave} disabled={saving} style={{
                  border: "none", borderRadius: "var(--radius-full)", background: "var(--primary)",
                  padding: "4px 14px", fontSize: "9.5px", fontWeight: 600, color: "#fff",
                  cursor: "pointer", opacity: saving ? 0.6 : 1, fontFamily: "inherit",
                }}>
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
            <div className={styles.configRow}>
              <div className={styles.configField}>
                <label className={styles.configLabel}>MODO PREDETERMINADO</label>
                <div className={styles.modeToggle}>
                  {(["manual", "automatic", "scheduled"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setDraftConfig({ ...draftConfig, defaultMode: m })}
                      className={`${styles.modeBtn} ${draftConfig.defaultMode === m ? styles.modeBtnActive : ""}`}
                    >
                      {MODE_LABELS[m]}
                    </button>
                  ))}
                </div>
              </div>
              {draftConfig.defaultMode === "scheduled" && (
                <div className={styles.configField}>
                  <label className={styles.configLabel}>HORARIO IA</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>Desde</span>
                    <input type="time" value={draftConfig.scheduleStart}
                      onChange={(e) => setDraftConfig({ ...draftConfig, scheduleStart: e.target.value })}
                      className={styles.configTimeInput} />
                    <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>Hasta</span>
                    <input type="time" value={draftConfig.scheduleEnd}
                      onChange={(e) => setDraftConfig({ ...draftConfig, scheduleEnd: e.target.value })}
                      className={styles.configTimeInput} />
                  </div>
                </div>
              )}
              <div className={styles.configField}>
                <label className={styles.configLabel}>TIEMPO PROMEDIO HUMANO</label>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <input type="number" min={1} max={60}
                    value={draftConfig.averageHumanResponseMinutes}
                    onChange={(e) => setDraftConfig({ ...draftConfig, averageHumanResponseMinutes: Math.max(1, Math.min(60, Number(e.target.value))) })}
                    className={styles.configInput} />
                  <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>minutos</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ───── HERO CARD — Recepcionista IA ───────── */}
        <div className={styles.heroCard}>
          <div className={styles.heroStatusRow}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{
                width: "5px", height: "5px", borderRadius: "50%",
                background: status.dot, boxShadow: `0 0 6px ${status.dot}`,
                display: "inline-block",
              }} />
              {status.label}
            </span>
            <span style={{ width: "1.5px", height: "1.5px", borderRadius: "50%", background: "rgba(197,184,229,0.6)" }} />
            <span style={{ fontSize: "10px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "3px", fontFamily: "inherit" }}>
              <Zap size={10} strokeWidth={1.5} style={{ color: "var(--primary)" }} /> {MODE_LABELS[modeKey]}
            </span>
            {scheduleLabel && (
              <>
                <span style={{ width: "1.5px", height: "1.5px", borderRadius: "50%", background: "rgba(197,184,229,0.6)" }} />
                <span style={{ fontSize: "10px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "3px", fontFamily: "inherit" }}>
                  <Clock size={10} strokeWidth={1.5} style={{ color: "var(--primary)" }} /> {scheduleLabel}
                </span>
              </>
            )}
          </div>

          <div className={styles.heroGrid}>
            <div className={styles.narrativeColumn}>
              <div className={styles.narrativeLine}>
                Hoy atendió: <span className={styles.narrativeStrong}>{dataLive?.conversationsAI ?? 0} {convWord(dataLive?.conversationsAI ?? 0)}</span>
              </div>
              <div className={styles.narrativeLine}>
                Respondió: <span className={styles.narrativeStrong}>{dataLive?.iaMessagesSent ?? 0} {msgWord(dataLive?.iaMessagesSent ?? 0)}</span>
              </div>
              <div className={styles.narrativeLine}>
                Ahorró: <span className={styles.narrativeStrong}>{formatHours(dataLive?.iaMinutesSaved ?? 0)}</span>
              </div>
            </div>

            <div>
              <div className={styles.coverageWrapper}>
                <span className={styles.coverageLabel}>
                  Cobertura: {dataLive?.conversationsAI ?? 0} de {conversationsTotal}
                </span>
                <span className={styles.coveragePercent}>{coverage}%</span>
              </div>
              <div className={styles.coverageBar}>
                <div className={styles.coverageFill} style={{
                  width: `${Math.min(coverage, 100)}%`,
                  background: `linear-gradient(90deg, var(--primary), ${aboveTarget ? "#10B981" : "#f59e0b"})`,
                }} />
              </div>
              {coverage > 0 && (
                <div className={styles.coverageMeta}>
                  {aboveTarget ? (
                    <>
                      <ShieldCheck size={10} strokeWidth={1.5} style={{ color: "#10B981" }} />
                      <span style={{ fontSize: "8px", color: "#10B981", fontWeight: 600, fontFamily: "inherit" }}>Sobre objetivo</span>
                      <span className={styles.coverageMetaLabel} style={{ color: "var(--text-muted)" }}>
                        · Meta: {COVERAGE_TARGET}% — superaste por {coverage - COVERAGE_TARGET}%
                      </span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={10} strokeWidth={1.5} style={{ color: "#f59e0b" }} />
                      <span style={{ fontSize: "8px", color: "#f59e0b", fontWeight: 600, fontFamily: "inherit" }}>Debajo del objetivo</span>
                      <span className={styles.coverageMetaLabel} style={{ color: "var(--text-muted)" }}>
                        · Meta: {COVERAGE_TARGET}% — faltan {coverageGap}%
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ───── CHART IA vs Humano ──────────────── */}
        {dataDaily?.hourly && (
          <div className={styles.sectionCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "20px" }}>
              <div>
                <div className={styles.sectionTitle} style={{ marginBottom: "4px" }}>
                  Actividad del Salón
                </div>
                <p className={styles.sectionSubtitle}>
                  Hoy · distribución por hora
                </p>
              </div>
              <div className={styles.chartLegend}>
                <span>
                  <span className={styles.legendDot} style={{ background: "var(--primary)" }} />
                  IA
                </span>
                <span>
                  <span className={styles.legendDot} style={{ background: "rgba(124,92,255,0.14)" }} />
                  Humano
                </span>
              </div>
            </div>
            <div className={styles.chart}>
              {Object.entries(dataDaily.hourly).map(([h, data]) => {
                const maxVal = Math.max(
                  ...Object.values(dataDaily.hourly!).map((v) => v.ai + v.human),
                  1
                );
                return (
                  <div key={h} className={styles.chartBar}>
                    <div className={styles.chartBars}>
                      <div className={styles.chartBarHuman} style={{ height: `${(data.human / maxVal) * 130}px` }} />
                      <div className={styles.chartBarAI} style={{ height: `${(data.ai / maxVal) * 130}px` }} />
                    </div>
                    <span className={styles.chartLabel}>{h}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ───── ROI IA ──────────────────────────── */}
        {dataAttribution && (
          <div className={styles.sectionCard}>
            <div className={styles.sectionTitle}>
              <DollarSign size={15} strokeWidth={1.5} />
              ROI IA
            </div>
            <div className={styles.roiGrid}>
              <div className={styles.roiMainCard}>
                <div className={styles.roiMainValue}>
                  ${dataAttribution.valueGeneratedAI.toLocaleString("es-CL")}
                </div>
                <div className={styles.roiMainLabel}>
                  <DollarSign size={10} strokeWidth={1.5} />
                  Valor generado {demoMode ? "(demo)" : "IA"}
                </div>
              </div>

              <div>
                <div className={styles.roiValue}>{dataAttribution.reservationsAI}</div>
                <div className={styles.roiLabel}>
                  <CalendarCheck size={9.5} strokeWidth={1.5} />
                  Reservas IA
                </div>
              </div>

              <div>
                <div className={styles.roiValue} style={{ color: "#10B981" }}>{dataAttribution.conversionRateAI}%</div>
                <div className={styles.roiLabel}>
                  <TrendingUp size={9.5} strokeWidth={1.5} />
                  Conversión IA
                </div>
              </div>

              <div>
                <div className={styles.roiValue} style={{ color: dataAttribution.cancellationRateAI > 20 ? "#e74c3c" : "var(--text-muted)" }}>
                  {dataAttribution.cancellationRateAI}%
                </div>
                <div className={styles.roiLabel}>
                  <Ban size={9.5} strokeWidth={1.5} />
                  Cancelación IA
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ───── COMPACT KPI ROW ──────────────────── */}
        <div className={styles.kpiRow}>
          {[
            { label: "Atendidas por IA", value: String(dataLive?.conversationsAI ?? 0), icon: Headphones },
            { label: "Atención humana", value: String(dataLive?.conversationsHuman ?? 0), icon: UserRound },
            { label: "Modo horario", value: String(dataLive?.conversationsScheduled ?? 0), icon: Clock },
          ].map((card, i) => (
            <div key={i} className={styles.kpiCard}>
              <div className={styles.kpiIconBox}>
                <card.icon size={17} strokeWidth={1.5} />
              </div>
              <div className={styles.kpiValue}>{card.value}</div>
              <div className={styles.kpiLabel}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* ───── Daily Summary Table ──────────────── */}
        {dataHistory.length > 0 && (
          <div className={styles.sectionCard}>
            <div className={styles.sectionTitle}>Resumen Diario</div>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>IA / Humano</th>
                    <th>Auto%</th>
                    <th>Cobertura</th>
                    <th>Ahorro</th>
                  </tr>
                </thead>
                <tbody>
                  {dataHistory.map((row) => (
                    <tr key={row.date}>
                      <td style={{ fontWeight: 500 }}>{row.date}</td>
                      <td>
                        <span className={styles.aiCount}>{row.conversationsAI}</span> / {row.conversationsHuman}
                      </td>
                      <td>{row.automationPercent}%</td>
                      <td style={{ fontWeight: 600 }}>{row.coveragePercent}%</td>
                      <td className={styles.hoursColor}>{formatHours(row.iaMinutesSaved)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </>
        )}
      </PageLayout>
    </AppShell>
  );
}
