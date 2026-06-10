// ---------------------------------------------------------------
// ai-pricing.ts — Precios configurables por provider/model
// Solo lectura, valores en USD por token
// ---------------------------------------------------------------

export interface ModelPricing {
  readonly provider: string;
  readonly model: string;
  readonly inputPer1k: number;   // USD por 1K input tokens
  readonly outputPer1k: number;  // USD por 1K output tokens
  readonly displayName: string;
  readonly currency: "USD";
}

const PRICING_TABLE: ModelPricing[] = [
  {
    provider: "deepseek",
    model: "deepseek-chat",
    inputPer1k: 0.00014,
    outputPer1k: 0.00028,
    displayName: "DeepSeek Chat",
    currency: "USD",
  },
  {
    provider: "deepseek",
    model: "deepseek-reasoner",
    inputPer1k: 0.00028,
    outputPer1k: 0.00110,
    displayName: "DeepSeek Reasoner",
    currency: "USD",
  },
  {
    provider: "xiaomi",
    model: "xiaomi-mimo-flash",
    inputPer1k: 0.00009,
    outputPer1k: 0.00018,
    displayName: "Xiaomi MiMo Flash",
    currency: "USD",
  },
  {
    provider: "xiaomi",
    model: "xiaomi-mimo-pro",
    inputPer1k: 0.00020,
    outputPer1k: 0.00040,
    displayName: "Xiaomi MiMo Pro",
    currency: "USD",
  },
];

// ---- Internal state (mutable for PATCH) ----

interface PricingOverrides {
  [model: string]: { inputPer1k?: number; outputPer1k?: number } | undefined;
}

let _overrides: PricingOverrides = {};

// ---- Public API ----

export function getPricing(model: string): ModelPricing | undefined {
  const base = PRICING_TABLE.find((p) => p.model === model);
  if (!base) return undefined;

  const override = _overrides[model];
  if (!override) return base;

  return {
    ...base,
    inputPer1k: override.inputPer1k ?? base.inputPer1k,
    outputPer1k: override.outputPer1k ?? base.outputPer1k,
  };
}

export function getAllPricing(): ModelPricing[] {
  return PRICING_TABLE.map((base) => {
    const override = _overrides[base.model];
    if (!override) return base;
    return {
      ...base,
      inputPer1k: override.inputPer1k ?? base.inputPer1k,
      outputPer1k: override.outputPer1k ?? base.outputPer1k,
    };
  });
}

export function updatePricing(
  model: string,
  delta: { inputPer1k?: number; outputPer1k?: number },
): ModelPricing | undefined {
  const base = PRICING_TABLE.find((p) => p.model === model);
  if (!base) return undefined;

  _overrides[model] = { ..._overrides[model], ...delta };
  return getPricing(model);
}

export function resetPricingOverrides(): void {
  _overrides = {};
}

// ---- Cost calculation helpers ----

export function calcCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number | null {
  const p = getPricing(model);
  if (!p) return null;
  const inCost = (inputTokens / 1000) * p.inputPer1k;
  const outCost = (outputTokens / 1000) * p.outputPer1k;
  return inCost + outCost;
}

/** USD → CLP usando tipo de cambio configurable (default ~970) */
export function usdToClp(usd: number, rate = 970): number {
  return Math.round(usd * rate);
}

// ── Currency conversion rates (CLP base) ──

export const CURRENCY_RATES = {
  CLP: 1,
  USD: 950,     // 1 USD = 950 CLP
  EUR: 1030,    // 1 EUR = 1030 CLP
} as const;

export type CurrencyCode = keyof typeof CURRENCY_RATES;
