// ---------------------------------------------------------------
// ai-cost-store.ts — Store de costos IA y límites por tenant
// Datos en memoria con persistencia JSON opcional
// ---------------------------------------------------------------

import { calcCostUsd, usdToClp } from "../config/ai-pricing";

// ── Tipos ──

export interface AICostEvent {
  id: string;
  tenantId: string;
  tenantName: string;
  provider: string;
  model: string;
  taskType: string;
  agentName?: string | null;
  platformArea?: string | null;
  customerPhone?: string | null;
  conversationId?: string | null;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  estimatedCostClp: number;
  createdAt: string; // ISO
  metadata?: Record<string, unknown> | null;
}

export interface AICostLimit {
  tenantId: string;
  monthlyBudgetClp: number;       // tope de gasto mensual en CLP
  monthlyRequestLimit: number;    // tope de requests por mes
  isAIEnabled: boolean;
  warningThresholdPercent: number; // ej: 80 → warning si uso >= 80%
  hardLimitEnabled: boolean;       // true → bloquear si se excede budget
  updatedAt: string;               // ISO
}

export interface AICostTotals {
  requests: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  estimatedCostClp: number;
}

export interface AICostAggregation {
  name: string;
  requests: number;
  totalTokens: number;
  estimatedCostClp: number;
}

export interface CommercialPricing {
  realCostClp: number;
  suggestedInternalMinimumClp: number;   // +% interno
  suggestedCommercialPriceClp: number;   // precio final al cliente
  targetMarginPercent: number;            // margen sugerido
}

export interface AICostReport {
  ok: true;
  adminOnly: true;
  tenantId: string;
  month: string;
  currency: "CLP";
  totals: AICostTotals;
  limits: {
    monthlyBudgetClp: number;
    usagePercent: number;
    monthlyRequestLimit: number;
    isAIEnabled: boolean;
    warningThresholdPercent: number;
    hardLimitEnabled: boolean;
  };
  commercialPricing: CommercialPricing;
  byProvider: AICostAggregation[];
  byTask: AICostAggregation[];
  byDay: { date: string; costClp: number; requests: number }[];
  byAgent: AICostAggregation[];
  byPlatformArea: (AICostAggregation & { percentOfTotalCost: number })[];
  byHour: { hour: string; requests: number; estimatedCostClp: number }[];
  byWeekday: { weekday: string; requests: number; estimatedCostClp: number }[];
  events: AICostEvent[];
}

// ── Store ──

let _events: AICostEvent[] = [];
let _limits: Map<string, AICostLimit> = new Map();

// ── Seed demo data ──

const TENANTS = [
  { id: "salon-demo", name: "Salón Demo Spa" },
  { id: "salon-belleza-pro", name: "Belleza Pro Studio" },
  { id: "salon-luxor", name: "Luxor Beauty" },
];

const PROVIDER_MODELS = [
  { provider: "deepseek", model: "deepseek-chat" },
  { provider: "deepseek", model: "deepseek-reasoner" },
  { provider: "xiaomi", model: "xiaomi-mimo-flash" },
  { provider: "xiaomi", model: "xiaomi-mimo-pro" },
];

const TASK_TYPES = [
  "concierge-reply",
  "customer-analysis",
  "recommendation",
  "booking-summary",
  "email-draft",
];

// Mapeo taskType → (agentName, platformArea)
const TASK_AGENT_MAP: Record<string, { agentName: string; platformArea: string }> = {
  "concierge-reply":     { agentName: "AI Receptionist",  platformArea: "WhatsApp" },
  "customer-analysis":   { agentName: "CustomerMemoryAgent", platformArea: "Customer Memory" },
  "recommendation":      { agentName: "RecommendationAgent", platformArea: "Campaigns" },
  "booking-summary":     { agentName: "BookingAgent",     platformArea: "Agenda" },
  "email-draft":         { agentName: "CampaignStrategyAgent", platformArea: "Campaigns" },
};

function getAgentInfo(taskType: string): { agentName: string; platformArea: string } {
  return TASK_AGENT_MAP[taskType] ?? { agentName: "UnknownAgent", platformArea: "Otros" };
}

const WEEKDAY_NAMES = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

function getWeekdayName(iso: string): string {
  try { return WEEKDAY_NAMES[new Date(iso).getDay()]; } catch { return "—"; }
}

function seedDemoData(): void {
  if (_events.length > 0) return; // ya sembrado

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  for (const tenant of TENANTS) {
    // Límites por tenant
    const limits: AICostLimit = {
      tenantId: tenant.id,
      monthlyBudgetClp: tenant.id === "salon-demo" ? 50_000 : 80_000,
      monthlyRequestLimit: tenant.id === "salon-demo" ? 3_000 : 5_000,
      isAIEnabled: true,
      warningThresholdPercent: 80,
      hardLimitEnabled: false,
      updatedAt: new Date(Date.UTC(year, month, 1, 0, 0, 0)).toISOString(),
    };
    _limits.set(tenant.id, limits);

    // Eventos demo (~40 por tenant, variados)
    const eventCount = 37 + Math.floor(Math.random() * 20);
    for (let i = 0; i < eventCount; i++) {
      const day = 1 + Math.floor(Math.random() * 28);
      const hour = 8 + Math.floor(Math.random() * 14);
      const pm = PROVIDER_MODELS[Math.floor(Math.random() * PROVIDER_MODELS.length)];
      const taskType = TASK_TYPES[Math.floor(Math.random() * TASK_TYPES.length)];
      const agentInfo = getAgentInfo(taskType);
      const input = 50 + Math.floor(Math.random() * 2500);
      const output = 20 + Math.floor(Math.random() * 1200);
      const costUsd = calcCostUsd(pm.model, input, output) ?? 0.001;
      const costClp = usdToClp(costUsd);

      const ev: AICostEvent = {
        id: crypto.randomUUID(),
        tenantId: tenant.id,
        tenantName: tenant.name,
        provider: pm.provider,
        model: pm.model,
        taskType,
        agentName: agentInfo.agentName,
        platformArea: agentInfo.platformArea,
        customerPhone: Math.random() > 0.5 ? `+569${String(90000000 + Math.floor(Math.random() * 10000000)).slice(0, 8)}` : null,
        conversationId: Math.random() > 0.4 ? crypto.randomUUID().slice(0, 12) : null,
        inputTokens: input,
        outputTokens: output,
        totalTokens: input + output,
        estimatedCostUsd: Number(costUsd.toFixed(6)),
        estimatedCostClp: costClp,
        createdAt: new Date(Date.UTC(year, month, day, hour, Math.floor(Math.random() * 60))).toISOString(),
        metadata: null,
      };
      _events.push(ev);
    }
  }

  // Ordenar por fecha ascendente
  _events.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// ── Funciones públicas ──

export function getAICostEvents(params: {
  tenantId?: string;
  month?: string; // "2026-06"
}): AICostEvent[] {
  seedDemoData();

  let filtered = _events;

  if (params.tenantId) {
    filtered = filtered.filter((e) => e.tenantId === params.tenantId);
  }

  const month = params.month;
  if (month) {
    filtered = filtered.filter((e) => e.createdAt.startsWith(month));
  }

  return filtered;
}

export function getAICostLimits(tenantId: string): AICostLimit | null {
  seedDemoData();
  return _limits.get(tenantId) ?? null;
}

export function updateAICostLimits(
  tenantId: string,
  patch: Partial<Omit<AICostLimit, "tenantId" | "updatedAt">>,
): AICostLimit | null {
  seedDemoData();

  const current = _limits.get(tenantId);
  if (!current) return null;

  const updated: AICostLimit = {
    ...current,
    ...patch,
    tenantId,
    updatedAt: new Date().toISOString(),
  };
  _limits.set(tenantId, updated);
  return updated;
}

export function getAICostReport(params: {
  tenantId?: string;
  month?: string;
}): AICostReport | null {
  const tenantId = params.tenantId ?? "salon-demo";
  const month = params.month ?? new Date().toISOString().slice(0, 7); // "2026-06"

  const events = getAICostEvents({ tenantId, month });
  const limits = getAICostLimits(tenantId);
  if (!limits) return null;

  // Totals
  const totals: AICostTotals = events.reduce(
    (acc, e) => {
      acc.requests += 1;
      acc.inputTokens += e.inputTokens;
      acc.outputTokens += e.outputTokens;
      acc.totalTokens += e.totalTokens;
      acc.estimatedCostUsd += e.estimatedCostUsd;
      acc.estimatedCostClp += e.estimatedCostClp;
      return acc;
    },
    { requests: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0, estimatedCostUsd: 0, estimatedCostClp: 0 },
  );
  totals.estimatedCostUsd = Number(totals.estimatedCostUsd.toFixed(6));
  totals.estimatedCostClp = Math.round(totals.estimatedCostClp);

  // byProvider
  const providerMap = new Map<string, AICostAggregation>();
  for (const e of events) {
    const key = `${e.provider}/${e.model}`;
    const existing = providerMap.get(key) ?? { name: key, requests: 0, totalTokens: 0, estimatedCostClp: 0 };
    existing.requests += 1;
    existing.totalTokens += e.totalTokens;
    existing.estimatedCostClp += e.estimatedCostClp;
    providerMap.set(key, existing);
  }
  const byProvider = Array.from(providerMap.values()).sort((a, b) => b.estimatedCostClp - a.estimatedCostClp);

  // byTask
  const taskMap = new Map<string, AICostAggregation>();
  for (const e of events) {
    const existing = taskMap.get(e.taskType) ?? { name: e.taskType, requests: 0, totalTokens: 0, estimatedCostClp: 0 };
    existing.requests += 1;
    existing.totalTokens += e.totalTokens;
    existing.estimatedCostClp += e.estimatedCostClp;
    taskMap.set(e.taskType, existing);
  }
  const byTask = Array.from(taskMap.values()).sort((a, b) => b.estimatedCostClp - a.estimatedCostClp);

  // byDay
  const dayMap = new Map<string, { costClp: number; requests: number }>();
  for (const e of events) {
    const day = e.createdAt.slice(0, 10); // "2026-06-15"
    const existing = dayMap.get(day) ?? { costClp: 0, requests: 0 };
    existing.costClp += e.estimatedCostClp;
    existing.requests += 1;
    dayMap.set(day, existing);
  }
  const byDay = Array.from(dayMap.entries())
    .map(([date, d]) => ({ date, costClp: Math.round(d.costClp), requests: d.requests }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // ── Nuevas agregaciones ejecutivas ──

  // byAgent
  const agentMap = new Map<string, AICostAggregation>();
  for (const e of events) {
    const name = e.agentName ?? "Desconocido";
    const existing = agentMap.get(name) ?? { name, requests: 0, totalTokens: 0, estimatedCostClp: 0 };
    existing.requests += 1;
    existing.totalTokens += e.totalTokens;
    existing.estimatedCostClp += e.estimatedCostClp;
    agentMap.set(name, existing);
  }
  const byAgent = Array.from(agentMap.values()).sort((a, b) => b.estimatedCostClp - a.estimatedCostClp);

  // byPlatformArea
  const areaMap = new Map<string, { name: string; requests: number; totalTokens: number; estimatedCostClp: number }>();
  for (const e of events) {
    const name = e.platformArea ?? "Otros";
    const existing = areaMap.get(name) ?? { name, requests: 0, totalTokens: 0, estimatedCostClp: 0 };
    existing.requests += 1;
    existing.totalTokens += e.totalTokens;
    existing.estimatedCostClp += e.estimatedCostClp;
    areaMap.set(name, existing);
  }
  const totalCostClp = totals.estimatedCostClp || 1;
  const byPlatformArea = Array.from(areaMap.values())
    .map((a) => ({ ...a, percentOfTotalCost: Math.round((a.estimatedCostClp / totalCostClp) * 100) }))
    .sort((a, b) => b.estimatedCostClp - a.estimatedCostClp);

  // byHour
  const hourMap = new Map<string, { requests: number; estimatedCostClp: number }>();
  for (const e of events) {
    const hour = e.createdAt.slice(11, 16); // "HH:00" aproximado
    const roundedHour = `${hour.slice(0, 2)}:00`;
    const existing = hourMap.get(roundedHour) ?? { requests: 0, estimatedCostClp: 0 };
    existing.requests += 1;
    existing.estimatedCostClp += e.estimatedCostClp;
    hourMap.set(roundedHour, existing);
  }
  const byHour = Array.from(hourMap.entries())
    .map(([hour, h]) => ({ hour, requests: h.requests, estimatedCostClp: Math.round(h.estimatedCostClp) }))
    .sort((a, b) => a.hour.localeCompare(b.hour));

  // byWeekday
  const weekdayMap = new Map<string, { requests: number; estimatedCostClp: number }>();
  for (const e of events) {
    const wd = getWeekdayName(e.createdAt);
    const existing = weekdayMap.get(wd) ?? { requests: 0, estimatedCostClp: 0 };
    existing.requests += 1;
    existing.estimatedCostClp += e.estimatedCostClp;
    weekdayMap.set(wd, existing);
  }
  const byWeekday = Array.from(weekdayMap.entries())
    .map(([weekday, w]) => ({ weekday, requests: w.requests, estimatedCostClp: Math.round(w.estimatedCostClp) }))
    .sort((a, b) => b.estimatedCostClp - a.estimatedCostClp);

  // Commercial pricing
  const realCostClp = totals.estimatedCostClp;
  const targetMargin = 70;
  const internalMultiplier = 1.15; // +15% overhead interno
  const suggestedInternalMinimumClp = Math.round(realCostClp * internalMultiplier);
  const suggestedCommercialPriceClp = Math.round(suggestedInternalMinimumClp / (1 - targetMargin / 100));
  const usagePercent =
    limits.monthlyBudgetClp > 0
      ? Math.round((realCostClp / limits.monthlyBudgetClp) * 100)
      : 0;

  return {
    ok: true,
    adminOnly: true,
    tenantId,
    month,
    currency: "CLP",
    totals,
    limits: {
      monthlyBudgetClp: limits.monthlyBudgetClp,
      usagePercent,
      monthlyRequestLimit: limits.monthlyRequestLimit,
      isAIEnabled: limits.isAIEnabled,
      warningThresholdPercent: limits.warningThresholdPercent,
      hardLimitEnabled: limits.hardLimitEnabled,
    },
    commercialPricing: {
      realCostClp,
      suggestedInternalMinimumClp,
      suggestedCommercialPriceClp,
      targetMarginPercent: targetMargin,
    },
    byProvider,
    byTask,
    byDay: byDay.map((d) => ({ ...d, costClp: Math.round(d.costClp) })),
    byAgent,
    byPlatformArea,
    byHour,
    byWeekday,
    events: events.slice(-50), // últimos 50
  };
}

export function getAICostTenants(): { id: string; name: string }[] {
  seedDemoData();
  return TENANTS;
}
