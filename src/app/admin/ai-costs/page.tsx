"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  CreditCard,
  Eye,
  Lock,
  MessageSquare,
  Shield,
  Sliders,
  TrendingUp,
  Zap,
  Building2,
  Users,
  Brain,
  Clock,
  DollarSign,
} from "lucide-react";
import styles from "./ai-costs.module.css";
import { CURRENCY_RATES, type CurrencyCode } from "@/config/ai-pricing";

// ── Types ──

interface AICostReport {
  ok: boolean;
  adminOnly: boolean;
  tenantId: string;
  month: string;
  currency: "CLP";
  totals: {
    requests: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCostUsd: number;
    estimatedCostClp: number;
  };
  limits: {
    monthlyBudgetClp: number;
    usagePercent: number;
    monthlyRequestLimit: number;
    isAIEnabled: boolean;
    warningThresholdPercent: number;
    hardLimitEnabled: boolean;
  };
  commercialPricing: {
    realCostClp: number;
    suggestedInternalMinimumClp: number;
    suggestedCommercialPriceClp: number;
    targetMarginPercent: number;
  };
  byProvider: { name: string; requests: number; totalTokens: number; estimatedCostClp: number }[];
  byTask: { name: string; requests: number; totalTokens: number; estimatedCostClp: number }[];
  byDay: { date: string; costClp: number; requests: number }[];
  byAgent: { name: string; requests: number; totalTokens: number; estimatedCostClp: number }[];
  byPlatformArea: { name: string; requests: number; totalTokens: number; estimatedCostClp: number; percentOfTotalCost: number }[];
  byHour: { hour: string; requests: number; estimatedCostClp: number }[];
  byWeekday: { weekday: string; requests: number; estimatedCostClp: number }[];
  events: {
    id: string;
    tenantId: string;
    provider: string;
    model: string;
    taskType: string;
    inputTokens: number;
    outputTokens: number;
    estimatedCostClp: number;
    createdAt: string;
  }[];
}

interface TenantInfo {
  id: string;
  name: string;
}

// ── Helpers ──

function fmt(n: number): string {
  return n.toLocaleString("es-CL");
}

function fmtClp(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

/** Formatea un valor en CLP a la moneda seleccionada */
function fmtMoney(clp: number, currency: CurrencyCode): string {
  if (currency === "CLP") return fmtClp(clp);
  const converted = clp / CURRENCY_RATES[currency];
  const symbol = currency === "USD" ? "US$" : "€";
  if (converted >= 1_000) return `${symbol}${(converted / 1_000).toFixed(1)}K`;
  if (converted >= 1) return `${symbol}${converted.toFixed(2)}`;
  return `${symbol}${converted.toFixed(4)}`;
}

function fmtPct(n: number): string {
  return `${n}%`;
}

function fmtDate(iso: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-CL", { day: "2-digit", month: "short" });
  } catch {
    return "—";
  }
}

// ── Login Gate ──

function LoginGate({ onLogin }: { onLogin: (token: string) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Ingresa la clave de administración");
      return;
    }
    onLogin(password.trim());
  };

  return (
    <div className={styles.gate}>
      <div className={styles.gateCard}>
        <div className={styles.gateIcon}>
          <Lock size={26} strokeWidth={1.5} color="#fff" />
        </div>
        <h2 className={styles.gateTitle}>Acceso restringido</h2>
        <p className={styles.gateDesc}>
          Esta página es solo para administradores del sistema.
          Ingresa la clave de control de costos para continuar.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            className={styles.gateInput}
            type="password"
            placeholder="ADMIN_COSTS_PASSWORD"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            autoFocus
          />
          <button className={styles.gateButton} type="submit">
            <Eye size={15} strokeWidth={1.5} style={{ marginRight: 8 }} />
            Ver panel de costos
          </button>
        </form>
        {error && <div className={styles.gateError}>{error}</div>}
      </div>
    </div>
  );
}

// ── Page ──

export default function AICostsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AICostReport | null>(null);
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [selectedTenant, setSelectedTenant] = useState("salon-demo");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Form state
  const [formBudget, setFormBudget] = useState(50000);
  const [formRequestLimit, setFormRequestLimit] = useState(3000);
  const [formWarning, setFormWarning] = useState(80);
  const [formHardLimit, setFormHardLimit] = useState(false);
  const [formAIEnabled, setFormAIEnabled] = useState(true);
  const [currency, setCurrency] = useState<CurrencyCode>("CLP");

  // Read ?currency= from URL on mount
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const c = sp.get("currency");
    if (c === "USD" || c === "EUR" || c === "CLP") {
      setCurrency(c);
    }
  }, []);

  // 🔍 Auto-login on mount: check if user is super admin → bypass password gate
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/session");
        const data = await res.json();
        if (data.ok && data.session?.isSuperAdmin === true) {
          // Super admin → bypass password gate
          setToken("__super_admin__");
          setLoading(true);
          try {
            await Promise.all([
              fetchReport("salon-demo", ""),
              fetchTenants(""),
            ]);
          } finally {
            setLoading(false);
          }
        }
      } catch {
        // Not super admin → show gate
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchReport = useCallback(async (tenantId: string, authToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ tenantId });
      const res = await fetch(`/api/admin/ai-costs?${params}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.status === 401) {
        setToken(null);
        setLoading(false);
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Error ${res.status}`);
      }
      const json = await res.json();
      setData(json);
      setFormBudget(json.limits.monthlyBudgetClp);
      setFormRequestLimit(json.limits.monthlyRequestLimit);
      setFormWarning(json.limits.warningThresholdPercent);
      setFormHardLimit(json.limits.hardLimitEnabled);
      setFormAIEnabled(json.limits.isAIEnabled);
    } catch (err: any) {
      setError(err.message || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTenants = useCallback(async (authToken: string) => {
    try {
      const res = await fetch("/api/admin/ai-costs?tenantId=__tenants__", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const json = await res.json();
        setTenants(json.tenants ?? []);
      }
    } catch { /* silencio */ }
  }, []);

  // Login handler
  const handleLogin = useCallback(async (pwd: string) => {
    setToken(pwd);
    setLoading(true);
    try {
      await Promise.all([
        fetchReport("salon-demo", pwd),
        fetchTenants(pwd),
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchReport, fetchTenants]);

  // Refresh when tenant changes
  useEffect(() => {
    if (token) {
      fetchReport(selectedTenant, token);
    }
  }, [selectedTenant, token, fetchReport]);

  // Save limits
  const handleSaveLimits = async () => {
    if (!token || !data) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/admin/ai-costs", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tenantId: selectedTenant,
          monthlyBudgetClp: formBudget,
          monthlyRequestLimit: formRequestLimit,
          warningThresholdPercent: formWarning,
          hardLimitEnabled: formHardLimit,
          isAIEnabled: formAIEnabled,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Error al guardar");
      }
      setSaveMsg("Límites actualizados correctamente");
      fetchReport(selectedTenant, token);
    } catch (err: any) {
      setSaveMsg(`Error: ${err.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 4000);
    }
  };

  const usagePercent = data?.limits.usagePercent ?? 0;
  const isWarning = usagePercent >= (data?.limits.warningThresholdPercent ?? 80) && usagePercent < 100;
  const isDanger = usagePercent >= 100;

  // ── Gate ──
  if (!token) {
    return (
        <div className={styles.wrapper}>
          <div className={styles.page}>
            <LoginGate onLogin={handleLogin} />
          </div>
        </div>
    );
  }

  // ── Loading / Error ──
  if (loading) {
    return (
        <div className={styles.wrapper}>
          <div className={styles.page}>
            <div className={styles.loadingBlock}>Cargando panel de costos IA…</div>
          </div>
        </div>
    );
  }

  if (error) {
    return (
        <div className={styles.wrapper}>
          <div className={styles.page}>
            <div className={styles.errorBlock}>{error}</div>
          </div>
        </div>
    );
  }

  if (!data) return null;

  // ── Dashboard ──
  return (
      <div className={styles.wrapper}>
        <div className={styles.page}>

          {/* ── Header ── */}
          <header className={styles.header}>
            <div className={styles.headerRow}>
              <div className={styles.headerLeft}>
                <div className={styles.headerIcon}>
                  <BarChart3 size={24} strokeWidth={1.5} color="#fff" />
                </div>
                <div className={styles.headerTitles}>
                  <span className={styles.headerKicker}>SendMe Studio · Admin</span>
                  <h1 className={styles.headerTitle}>AI Cost Control</h1>
                  <p className={styles.headerDesc}>
                    Control interno de gasto real, límites y margen comercial por cliente.
                  </p>
                </div>
              </div>
              <span className={`${styles.badge} ${styles.badgeDanger}`}>
                <Shield size={12} strokeWidth={2} />
                Admin only
              </span>
            </div>
          </header>

          {/* ── Tenant Selector ── */}
          <div className={styles.tenantSelector}>
            {tenants.length > 1 && (
              <>
                <Building2 size={14} strokeWidth={1.5} style={{ color: "#94a3b8" }} />
                <span className={styles.tenantLabel}>Cliente:</span>
                <select
                  className={styles.tenantSelect}
                  value={selectedTenant}
                  onChange={(e) => setSelectedTenant(e.target.value)}
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <span className={styles.statusSep} />
              </>
            )}
            <span className={styles.tenantLabel}>Mes:</span>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#475569", fontWeight: 500 }}>
              {data.month}
            </span>
            <span className={styles.statusSep} />
            <DollarSign size={13} strokeWidth={1.5} style={{ color: "#94a3b8" }} />
            <span className={styles.tenantLabel}>Moneda:</span>
            <select
              className={styles.tenantSelect}
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            >
              <option value="CLP">CLP</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>

          {/* ── Status Bar ── */}
          <div className={styles.statusBar}>
            <span className={styles.statusItem}>
              <span className={styles.dot} style={{ background: isDanger ? "#e74c3c" : isWarning ? "#f59e0b" : "#10B981" }} />
              <span className={styles.statusLabel}>Estado</span>
              {isDanger ? "Excedido" : isWarning ? "Advertencia" : "Normal"}
            </span>
            <span className={styles.statusSep} />
            <span className={styles.statusItem}>
              <span className={styles.statusLabel}>Uso</span>
              {fmtPct(usagePercent)}
            </span>
            <span className={styles.statusSep} />
            <span className={styles.statusItem}>
              <span className={styles.statusLabel}>Presupuesto</span>
              {fmtMoney(data.limits.monthlyBudgetClp, currency)}
            </span>
            <span className={styles.statusSep} />
            <span className={styles.statusItem}>
              <span className={styles.statusLabel}>Requests</span>
              {fmt(data.totals.requests)} / {fmt(data.limits.monthlyRequestLimit)}
            </span>
            <span className={styles.statusSep} />
            <span className={styles.statusItem}>
              <span className={styles.statusLabel}>IA activa</span>
              {data.limits.isAIEnabled ? "Sí" : "Desactivada"}
            </span>
          </div>

          {/* ── Warning / Danger banners ── */}
          {isDanger && (
            <div className={`${styles.banner} ${styles.bannerDanger}`}>
              <AlertTriangle size={16} strokeWidth={1.5} />
              Límite de presupuesto excedido. El gasto real supera el presupuesto mensual de {fmtMoney(data.limits.monthlyBudgetClp, currency)}.
              {data.limits.hardLimitEnabled ? " El hard limit está activo — las solicitudes IA están bloqueadas." : " El hard limit está desactivado — revisa si deseas activarlo."}
            </div>
          )}
          {isWarning && !isDanger && (
            <div className={`${styles.banner} ${styles.bannerWarning}`}>
              <AlertTriangle size={16} strokeWidth={1.5} />
              Has alcanzado el {fmtPct(usagePercent)} del presupuesto mensual ({fmtMoney(data.limits.monthlyBudgetClp, currency)}).
              Umbral de advertencia: {fmtPct(data.limits.warningThresholdPercent)}.
            </div>
          )}

          {/* ── Metrics Grid ── */}
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <div className={styles.metricValue}>{fmtMoney(data.totals.estimatedCostClp, currency)}</div>
              <div className={styles.metricLabel}>Gasto real del mes</div>
              <div className={styles.metricSub}>${data.totals.estimatedCostUsd.toFixed(4)} USD</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricValue}>{fmtMoney(data.limits.monthlyBudgetClp, currency)}</div>
              <div className={styles.metricLabel}>Límite mensual</div>
              <div className={styles.metricSub}>{fmtPct(usagePercent)} utilizado</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricValue}>{fmt(data.totals.requests)}</div>
              <div className={styles.metricLabel}>Requests IA</div>
              <div className={styles.metricSub}>{fmt(data.totals.totalTokens)} tokens totales</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricValue}>{fmtMoney(data.commercialPricing.suggestedCommercialPriceClp, currency)}</div>
              <div className={styles.metricLabel}>Precio comercial sugerido</div>
              <div className={styles.metricSub}>Margen {fmtPct(data.commercialPricing.targetMarginPercent)}</div>
            </div>
          </div>

          {/* ── Commercial Pricing ── */}
          <div className={`${styles.sectionCard} ${styles.sectionBlock}`}>
            <div className={styles.sectionTitle}>
              <CreditCard size={15} strokeWidth={1.5} />
              Estructura de precios comerciales
            </div>
            <div className={styles.sectionSub}>
              Cálculo interno: costo real → mínimo interno (+15%) → precio comercial sugerido (70% margen)
            </div>
            <div className={styles.commercialGrid}>
              <div className={styles.commercialItem}>
                <div className={styles.commercialValue}>{fmtMoney(data.commercialPricing.realCostClp, currency)}</div>
                <div className={styles.commercialLabel}>Costo real (CLP)</div>
              </div>
              <div className={styles.commercialItem}>
                <div className={styles.commercialValue}>{fmtMoney(data.commercialPricing.suggestedInternalMinimumClp, currency)}</div>
                <div className={styles.commercialLabel}>Mínimo interno (+15%)</div>
              </div>
              <div className={styles.commercialItem} style={{ borderColor: "rgba(124,92,255,0.15)" }}>
                <div className={styles.commercialValue} style={{ color: "#7c5cff" }}>
                  {fmtMoney(data.commercialPricing.suggestedCommercialPriceClp, currency)}
                </div>
                <div className={styles.commercialLabel}>Precio comercial sugerido</div>
              </div>
            </div>
          </div>

          {/* ── Limits Editor + Day Chart ── */}
          <div className={styles.sectionGrid2}>
            {/* Limits */}
            <div className={`${styles.sectionCard} ${styles.sectionCardCompact}`}>
              <div className={styles.sectionTitle}>
                <Sliders size={15} strokeWidth={1.5} />
                Límites internos
              </div>
              <div className={styles.sectionSub}>
                Ajusta los límites para {tenants.find((t) => t.id === selectedTenant)?.name ?? selectedTenant}
              </div>
              <div className={styles.limitsForm}>
                <div className={styles.limitsFormCol}>
                  <label className={styles.limitsFormLabel}>Presupuesto mensual (CLP)</label>
                  <input
                    className={styles.limitsFormInput}
                    type="number"
                    value={formBudget}
                    onChange={(e) => setFormBudget(Number(e.target.value))}
                  />
                </div>
                <div className={styles.limitsFormCol}>
                  <label className={styles.limitsFormLabel}>Límite de requests</label>
                  <input
                    className={styles.limitsFormInput}
                    type="number"
                    value={formRequestLimit}
                    onChange={(e) => setFormRequestLimit(Number(e.target.value))}
                  />
                </div>
                <div className={styles.limitsFormCol}>
                  <label className={styles.limitsFormLabel}>Umbral de advertencia (%)</label>
                  <input
                    className={styles.limitsFormInput}
                    type="number"
                    min={0}
                    max={100}
                    value={formWarning}
                    onChange={(e) => setFormWarning(Number(e.target.value))}
                  />
                </div>
                <div className={styles.limitsFormCol}>
                  <label className={styles.limitsFormLabel}>Hard limit</label>
                  <div className={styles.limitsFormToggle}>
                    <input
                      type="checkbox"
                      checked={formHardLimit}
                      onChange={(e) => setFormHardLimit(e.target.checked)}
                    />
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#475569" }}>
                      Bloquear al exceder presupuesto
                    </span>
                  </div>
                </div>
                <div className={styles.limitsFormCol}>
                  <label className={styles.limitsFormLabel}>IA habilitada</label>
                  <div className={styles.limitsFormToggle}>
                    <input
                      type="checkbox"
                      checked={formAIEnabled}
                      onChange={(e) => setFormAIEnabled(e.target.checked)}
                    />
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#475569" }}>
                      Permitir solicitudes IA
                    </span>
                  </div>
                </div>
                <div className={styles.limitsFormActions}>
                  {saveMsg && (
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: saveMsg.startsWith("Error") ? "#e74c3c" : "#10B981", alignSelf: "center" }}>
                      {saveMsg}
                    </span>
                  )}
                  <button
                    className={`${styles.limitsFormButton} ${styles.buttonPrimary}`}
                    onClick={handleSaveLimits}
                    disabled={saving}
                  >
                    {saving ? "Guardando…" : "Guardar límites"}
                  </button>
                </div>
              </div>
              {currency !== "CLP" && (
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: "#94a3b8", marginTop: 8, paddingLeft: 2 }}>
                  Los límites se guardan internamente en CLP.
                </div>
              )}
            </div>

            {/* Day chart */}
            <div className={`${styles.sectionCard} ${styles.sectionCardCompact}`}>
              <div className={styles.sectionTitle}>
                <TrendingUp size={15} strokeWidth={1.5} />
                Gasto por día
              </div>
              <div className={styles.sectionSub}>
                {data.byDay.length} días con actividad · {fmtMoney(data.totals.estimatedCostClp, currency)} total
              </div>
              {data.byDay.length > 0 && (
                <>
                  <div className={styles.dayChart}>
                    {(() => {
                      const maxCost = Math.max(...data.byDay.map((d) => d.costClp), 1);
                      return data.byDay.map((d, i) => (
                        <div
                          key={d.date}
                          className={styles.dayBar}
                          style={{ height: `${Math.max((d.costClp / maxCost) * 100, 2)}%` }}
                          title={`${d.date}: ${fmtMoney(d.costClp, currency)} (${d.requests} requests)`}
                        />
                      ));
                    })()}
                  </div>
                  <div className={styles.dayLabels}>
                    {data.byDay.map((d, i) => {
                      const total = data.byDay.length;
                      const step = total > 24 ? 3 : total > 14 ? 2 : 1;
                      const show = i % step === 0 || i === total - 1;
                      return (
                        <span key={d.date} className={styles.dayLabel} style={{ visibility: show ? "visible" : "hidden" }}>
                          {fmtDate(d.date)}
                        </span>
                      );
                    })}
                  </div>
                </>
              )}
              {data.byDay.length === 0 && (
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#94a3b8", padding: "20px 0", textAlign: "center" }}>
                  Sin actividad este mes
                </div>
              )}
            </div>
          </div>

          {/* ── By Provider ── */}
          <div className={`${styles.sectionCard} ${styles.sectionBlock}`}>
            <div className={styles.sectionTitle}>
              <Zap size={15} strokeWidth={1.5} />
              Costo por proveedor
            </div>
            {data.byProvider.length > 0 ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Proveedor / Modelo</th>
                    <th style={{ textAlign: "right" }}>Requests</th>
                    <th style={{ textAlign: "right" }}>Tokens</th>
                    <th style={{ textAlign: "right" }}>Costo CLP</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byProvider.map((p) => (
                    <tr key={p.name}>
                      <td style={{ fontWeight: 500, color: "#0f172a" }}>{p.name}</td>
                      <td className={styles.tableNum}>{fmt(p.requests)}</td>
                      <td className={styles.tableNum}>{fmt(p.totalTokens)}</td>
                      <td className={styles.tableNum}>{fmtMoney(p.estimatedCostClp, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#94a3b8", padding: "20px 0" }}>
                Sin datos de proveedores
              </div>
            )}
          </div>

          {/* ── By Task ── */}
          <div className={`${styles.sectionCard} ${styles.sectionBlock}`}>
            <div className={styles.sectionTitle}>
              <MessageSquare size={15} strokeWidth={1.5} />
              Costo por tarea
            </div>
            {data.byTask.length > 0 ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Tipo de tarea</th>
                    <th style={{ textAlign: "right" }}>Requests</th>
                    <th style={{ textAlign: "right" }}>Tokens</th>
                    <th style={{ textAlign: "right" }}>Costo CLP</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byTask.map((t) => (
                    <tr key={t.name}>
                      <td style={{ fontWeight: 500, color: "#0f172a" }}>{t.name}</td>
                      <td className={styles.tableNum}>{fmt(t.requests)}</td>
                      <td className={styles.tableNum}>{fmt(t.totalTokens)}</td>
                      <td className={styles.tableNum}>{fmtMoney(t.estimatedCostClp, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#94a3b8", padding: "20px 0" }}>
                Sin datos de tareas
              </div>
            )}
          </div>

          {/* ── Recent events ── */}
          {data.events.length > 0 && (
            <div className={`${styles.sectionCard} ${styles.sectionBlock}`}>
              <div className={styles.sectionTitle}>
                <Calendar size={15} strokeWidth={1.5} />
                Eventos recientes
              </div>
              <div className={styles.sectionSub}>Últimos {data.events.length} eventos</div>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Modelo</th>
                    <th>Tarea</th>
                    <th style={{ textAlign: "right" }}>Tokens</th>
                    <th style={{ textAlign: "right" }}>Costo CLP</th>
                  </tr>
                </thead>
                <tbody>
                  {data.events.slice(-20).reverse().map((e) => (
                    <tr key={e.id}>
                      <td style={{ fontVariantNumeric: "tabular-nums", fontSize: 12 }}>{fmtDate(e.createdAt)}</td>
                      <td style={{ fontWeight: 500 }}>{e.model}</td>
                      <td>{e.taskType}</td>
                      <td className={styles.tableNum}>{fmt(e.inputTokens + e.outputTokens)}</td>
                      <td className={styles.tableNum}>{fmtMoney(e.estimatedCostClp, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Executive Highlight ── */}
          <div className={styles.execHighlight}>
            <div className={styles.execCard}>
              <div className={styles.execIcon}><Zap size={18} strokeWidth={1.5} color="#fff" /></div>
              <div className={styles.execContent}>
                <span className={styles.execLabel}>Mayor gasto</span>
                <span className={styles.execValue}>
                  {data.byAgent[0]?.name ?? "—"} en {data.byPlatformArea[0]?.name ?? "—"}
                </span>
              </div>
            </div>
            <div className={styles.execCard}>
              <div className={styles.execIcon}><Clock size={18} strokeWidth={1.5} color="#fff" /></div>
              <div className={styles.execContent}>
                <span className={styles.execLabel}>Peak horario</span>
                <span className={styles.execValue}>{data.byHour.reduce((a,b)=>a.estimatedCostClp>b.estimatedCostClp?a:b,data.byHour[0]??{hour:"—"}).hour}</span>
              </div>
            </div>
            <div className={styles.execCard}>
              <div className={styles.execIcon}><Calendar size={18} strokeWidth={1.5} color="#fff" /></div>
              <div className={styles.execContent}>
                <span className={styles.execLabel}>Día más caro</span>
                <span className={styles.execValue}>{data.byWeekday[0]?.weekday ?? "—"}</span>
              </div>
            </div>
          </div>

          {/* ── Costo por agente ── */}
          <div className={`${styles.sectionCard} ${styles.sectionBlock}`}>
            <div className={styles.sectionTitle}>
              <Users size={15} strokeWidth={1.5} />
              Costo por agente
            </div>
            <div className={styles.sectionSub}>Agentes con actividad IA este mes</div>
            {data.byAgent.length > 0 ? (
              <div className={styles.agentGrid}>
                {data.byAgent.map((a) => (
                  <div key={a.name} className={styles.agentCard}>
                    <div className={styles.agentCardName}>{a.name}</div>
                    <div className={styles.agentCardRow}><span>Requests</span><strong>{fmt(a.requests)}</strong></div>
                    <div className={styles.agentCardRow}><span>Tokens</span><strong>{fmt(a.totalTokens)}</strong></div>
                    <div className={styles.agentCardRow}><span>Costo</span><strong>{fmtMoney(a.estimatedCostClp, currency)}</strong></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.agentCardRow} style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#94a3b8", padding: "20px 0" }}>
                Sin datos de agentes
              </div>
            )}
          </div>

          {/* ── Costo por área de plataforma ── */}
          <div className={`${styles.sectionCard} ${styles.sectionBlock}`}>
            <div className={styles.sectionTitle}>
              <Brain size={15} strokeWidth={1.5} />
              Costo por área de plataforma
            </div>
            <div className={styles.sectionSub}>Distribución del gasto IA por módulo</div>
            {data.byPlatformArea.length > 0 ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Área</th>
                    <th style={{ textAlign: "right" }}>Requests</th>
                    <th style={{ textAlign: "right" }}>Tokens</th>
                    <th style={{ textAlign: "right" }}>Costo CLP</th>
                    <th style={{ textAlign: "right" }}>% del gasto</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byPlatformArea.map((a) => (
                    <tr key={a.name}>
                      <td style={{ fontWeight: 500, color: "#0f172a" }}>{a.name}</td>
                      <td className={styles.tableNum}>{fmt(a.requests)}</td>
                      <td className={styles.tableNum}>{fmt(a.totalTokens)}</td>
                      <td className={styles.tableNum}>{fmtMoney(a.estimatedCostClp, currency)}</td>
                      <td className={styles.tableNum}>{fmtPct(a.percentOfTotalCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#94a3b8", padding: "20px 0" }}>
                Sin datos de áreas
              </div>
            )}
          </div>

          {/* ── Horas de mayor consumo ── */}
          <div className={`${styles.sectionCard} ${styles.sectionBlock}`}>
            <div className={styles.sectionTitle}>
              <Clock size={15} strokeWidth={1.5} />
              Horas de mayor consumo
            </div>
            <div className={styles.sectionSub}>
              {data.byHour.length} horas con actividad
            </div>
            {data.byHour.length > 0 && (
              <>
                <div className={styles.hourChart}>
                  {(() => {
                    const maxCost = Math.max(...data.byHour.map((h) => h.estimatedCostClp), 1);
                    return data.byHour.map((h) => (
                      <div
                        key={h.hour}
                        className={styles.hourBar}
                        style={{ height: `${Math.max((h.estimatedCostClp / maxCost) * 100, 2)}%` }}
                        title={`${h.hour}: ${fmtMoney(h.estimatedCostClp, currency)} (${h.requests} requests)`}
                      />
                    ));
                  })()}
                </div>
                <div className={styles.hourLabels}>
                  {data.byHour.map((h) => (
                    <span key={h.hour} className={styles.hourLabel}>{h.hour}</span>
                  ))}
                </div>
              </>
            )}
            {data.byHour.length === 0 && (
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#94a3b8", padding: "20px 0", textAlign: "center" }}>
                Sin actividad este mes
              </div>
            )}
          </div>

          {/* ── Días de mayor consumo ── */}
          <div className={`${styles.sectionCard} ${styles.sectionBlock}`}>
            <div className={styles.sectionTitle}>
              <Calendar size={15} strokeWidth={1.5} />
              Días de mayor consumo
            </div>
            <div className={styles.sectionSub}>Ranking por día de la semana</div>
            {data.byWeekday.length > 0 ? (
              <div className={styles.weekdayList}>
                {(() => {
                  const maxCost = Math.max(...data.byWeekday.map((d) => d.estimatedCostClp), 1);
                  return data.byWeekday.map((d) => (
                    <div key={d.weekday} className={styles.weekdayRow}>
                      <span className={styles.weekdayName}>{d.weekday}</span>
                      <div className={styles.weekdayBar}>
                        <div className={styles.weekdayBarFill} style={{ width: `${(d.estimatedCostClp / maxCost) * 100}%` }} />
                      </div>
                      <span className={styles.weekdayStat}>{fmtMoney(d.estimatedCostClp, currency)}</span>
                      <span className={styles.weekdayStat}>{d.requests} req</span>
                    </div>
                  ));
                })()}
              </div>
            ) : (
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#94a3b8", padding: "20px 0" }}>
                Sin datos de días
              </div>
            )}
          </div>

          {/* ── Footnote ── */}
          <div className={styles.footnote}>
            <Shield size={16} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              <strong>Privacidad:</strong> Estos costos y precios son internos y no se muestran al cliente final.
              La información de esta página no está visible en ninguna sección pública ni en el panel del salón.
              Ajusta <code style={{ background: "rgba(124,92,255,0.08)", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>ADMIN_COSTS_PASSWORD</code> en tus variables de entorno para proteger esta ruta.
            </span>
          </div>

        </div>
      </div>
  );
}
