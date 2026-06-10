// ================================================================
// AI Router — abstraction layer for LLM provider selection
// Phase: FASE 4 — Xiaomi MiMo integration
// Status: updated
//
// All runtime AI calls go through runAI().
// DeepSeek is always the default/fallback provider.
// Xiaomi MiMo is available as an alternative provider,
// selected per task type via AI_TASK_PROVIDER env config.
// ================================================================

// ── End header ──

/**
 * Supported AI task types.
 * Add new task types as Xiaomi MiMo capabilities expand.
 */
export type AITaskType =
  | "whatsapp_reply"
  | "intent_classification"
  | "customer_memory"
  | "campaign_strategy"
  | "growth_analysis";

/**
 * Supported AI providers.
 */
export type AIProvider = "deepseek" | "xiaomi_mimo";

/**
 * Standard context payload passed to the AI provider.
 * Extends per task type as needed.
 */
export type AIContext = Record<string, unknown>;

/**
 * Result from an AI call.
 */
export type AIResult = {
  content: string;
  provider: AIProvider;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
  };
};

// ── Provider configuration ──────────────────────────────────────

function deepSeekConfig() {
  return {
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseUrl:
      process.env.DEEPSEEK_BASE_URL?.replace(/\/$/, "") ||
      "https://api.deepseek.com",
    model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
  };
}

export function hasDeepSeekConfig(): boolean {
  return Boolean(deepSeekConfig().apiKey);
}

function xiaomiMiMoConfig() {
  return {
    apiKey: process.env.XIAOMI_MIMO_API_KEY,
    baseUrl:
      process.env.XIAOMI_MIMO_BASE_URL?.replace(/\/$/, "") ||
      "https://api.xiaomi.com/mimo/v1",
    model: process.env.XIAOMI_MIMO_MODEL || "mimo-pro",
  };
}

export function hasXiaomiMiMoConfig(): boolean {
  return Boolean(xiaomiMiMoConfig().apiKey);
}

/**
 * Read the task-provider mapping from env AI_TASK_PROVIDER.
 * Format: comma-separated taskType=provider pairs, e.g.
 * "customer_memory=xiaomi_mimo,whatsapp_reply=deepseek"
 * Default provider is "deepseek".
 */
function taskProviderMap(): Record<string, AIProvider> {
  const raw = process.env.AI_TASK_PROVIDER || "";
  const map: Record<string, AIProvider> = {};
  for (const pair of raw.split(",")) {
    const [task, provider] = pair.split("=").map((s) => s.trim());
    if (task && (provider === "deepseek" || provider === "xiaomi_mimo")) {
      map[task] = provider;
    }
  }
  return map;
}

/**
 * Resolve which provider to use for a given task type.
 * Priority:
 *   1. Explicit `provider` in context (e.g. { provider: "xiaomi_mimo" })
 *   2. AI_TASK_PROVIDER env mapping
 *   3. DeepSeek (default fallback)
 */
function resolveProvider(
  taskType: AITaskType,
  context: AIContext,
): AIProvider {
  // 1. Explicit request via context
  const explicit = context.provider;
  if (explicit === "deepseek" || explicit === "xiaomi_mimo") {
    return explicit;
  }

  // 2. Env mapping
  const map = taskProviderMap();
  if (map[taskType]) {
    return map[taskType];
  }

  // 3. Default fallback
  return "deepseek";
}

// ── DeepSeek provider ────────────────────────────────────────────

async function callDeepSeek(
  systemPrompt: string,
  userPrompt: string,
): Promise<{ content: string; model: string }> {
  const config = deepSeekConfig();

  if (!config.apiKey) {
    throw new Error("DeepSeek key missing");
  }

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.55,
      max_tokens: 180,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw Object.assign(new Error("DeepSeek error"), {
      statusCode: response.status,
      deepSeekResponse: data,
    });
  }

  const reply =
    data &&
    typeof data === "object" &&
    "choices" in data &&
    Array.isArray(data.choices) &&
    data.choices[0]?.message?.content
      ? String(data.choices[0].message.content).trim()
      : "";

  if (!reply) {
    throw new Error("DeepSeek returned empty reply");
  }

  return { content: reply, model: config.model };
}

// ── Xiaomi MiMo provider ──────────────────────────────────────────

async function callXiaomiMiMo(
  systemPrompt: string,
  userPrompt: string,
): Promise<{ content: string; model: string }> {
  const config = xiaomiMiMoConfig();

  if (!config.apiKey) {
    throw new Error("Xiaomi MiMo key missing");
  }

  // Xiaomi MiMo uses an OpenAI-compatible chat completions API.
  // Reference: https://docs.xiaomi.com/mimo (placeholder for future docs)
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.55,
      max_tokens: 180,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw Object.assign(new Error("Xiaomi MiMo error"), {
      statusCode: response.status,
      mimoResponse: data,
    });
  }

  const reply =
    data &&
    typeof data === "object" &&
    "choices" in data &&
    Array.isArray(data.choices) &&
    data.choices[0]?.message?.content
      ? String(data.choices[0].message.content).trim()
      : "";

  if (!reply) {
    throw new Error("Xiaomi MiMo returned empty reply");
  }

  return { content: reply, model: config.model };
}

// ── Provider routing ────────────────────────────────────────────

/**
 * Route a task to the appropriate AI provider.
 *
 * Provider selection priority:
 *   1. Explicit `provider` field in context: { provider: "xiaomi_mimo" }
 *   2. AI_TASK_PROVIDER env variable: "customer_memory=xiaomi_mimo"
 *   3. DeepSeek (default fallback)
 *
 * If the selected provider is not configured, falls back to DeepSeek.
 *
 * @param taskType - The type of AI task to perform
 * @param prompt - The user-facing prompt / message content
 * @param context - Structured context for the AI provider
 * @returns The AI-generated content with provider metadata
 */
export async function runAI(
  taskType: AITaskType,
  prompt: string,
  context: AIContext = {},
): Promise<AIResult> {
  const config = deepSeekConfig();

  // ── System prompt generation ──
  let systemPrompt: string;

  switch (taskType) {
    case "whatsapp_reply": {
      const intent = String(context.intent ?? "unknown");
      const confidence = Number(context.confidence ?? 0);
      systemPrompt =
        "Eres el concierge premium de SendMe Studio, un salon de belleza. " +
        "Responde en espanol, breve, elegante y humano. " +
        "No uses el nombre del cliente. No suenes como chatbot. " +
        "Si el cliente pide agenda, orienta suavemente a coordinar horario. " +
        "Maximo 2 frases.";
      prompt = `Intent: ${intent}\nConfidence: ${confidence}\nCliente: ${prompt}`;
      break;
    }

    case "customer_memory": {
      const customerPhone = String(context.customerPhone ?? "");
      const customerName = String(context.customerName ?? "");
      systemPrompt =
        "Eres un extractor de memoria de clientes de SendMe Studio. " +
        "Analiza el mensaje del cliente y extrae informacion relevante: " +
        "preferencias de horario, estilista favorito, alergias, " +
        "interes en estacionamiento, sensibilidad a espera, " +
        "sensibilidad a precio, servicios favoritos. " +
        "Responde SOLO con un objeto JSON con los campos detectados. " +
        "Si no hay informacion relevante, responde con un objeto vacio {}.";
      if (customerPhone) {
        prompt = `Cliente: ${customerName || "Unknown"} (${customerPhone})\nMensaje: ${prompt}`;
      } else {
        prompt = `Mensaje: ${prompt}`;
      }
      break;
    }

    default:
      systemPrompt =
        "Eres un asistente de IA de SendMe Studio. Responde en espanol.";
      break;
  }

  // ── Provider resolution and call ──
  const selectedProvider = resolveProvider(taskType, context);
  const providerHasConfig =
    selectedProvider === "xiaomi_mimo"
      ? hasXiaomiMiMoConfig()
      : hasDeepSeekConfig();

  if (selectedProvider === "xiaomi_mimo" && providerHasConfig) {
    try {
      const result = await callXiaomiMiMo(systemPrompt, prompt);
      return {
        content: result.content,
        provider: "xiaomi_mimo",
        model: result.model,
      };
    } catch (error) {
      console.warn("Xiaomi MiMo failed, falling back to DeepSeek", {
        error: error instanceof Error ? error.message : "unknown",
      });
      // Fall through to DeepSeek fallback
    }
  }

  // ── DeepSeek (default/fallback) ──
  const result = await callDeepSeek(systemPrompt, prompt);

  return {
    content: result.content,
    provider: "deepseek",
    model: result.model,
  };
}
