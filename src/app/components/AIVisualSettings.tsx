// ================================================================
// components/AIVisualSettings.tsx — Configuración visual de IA
// Reemplaza textareas JSON crudos por controles visuales.
//
// Almacena configuración en aiRules (JSON array) con formato:
// [{ "type": "visual_config", "name": "...", "personality": "...",
//    "salesLevel": 3, "useEmojis": true, "responseLength": "media",
//    "specialInstructions": "..." }]
// ================================================================

"use client";

import { useState, useEffect } from "react";
import {
  Bot, Sparkles, MessageSquare, Smile, Zap,
  ChevronDown, HelpCircle, Check, Loader2,
} from "lucide-react";

// ── Props ──
interface AIVisualSettingsProps {
  autoReplyEnabled: boolean;
  aiMode: string;           // manual | automatic | scheduled | inherit
  aiRulesRaw: string;       // JSON string del campo aiRules
  monthlyBudget: string;    // string del campo monthlyAiBudget
  primaryColor: string;
  onSave: (data: Record<string, any>) => Promise<void>;
  saving: boolean;
  saved: boolean;
  error: string | null;
}

// ── Visual config shape stored inside aiRules ──
interface VisualConfig {
  name: string;
  personality: string;
  salesLevel: number;
  useEmojis: boolean;
  responseLength: string;
  specialInstructions: string;
}

const DEFAULT_VISUAL: VisualConfig = {
  name: "Sofía",
  personality: "cercana",
  salesLevel: 3,
  useEmojis: true,
  responseLength: "media",
  specialInstructions: "",
};

const PERSONALITIES = [
  { id: "profesional", label: "Profesional", desc: "Formal y corporativo", icon: "💼" },
  { id: "cercana", label: "Cercana", desc: "Amable y familiar", icon: "🤗" },
  { id: "elegante", label: "Elegante", desc: "Sofisticado y exclusivo", icon: "✨" },
  { id: "masculina", label: "Masculina", desc: "Directo y varonil", icon: "👔" },
  { id: "comercial", label: "Comercial", desc: "Ventas y promociones", icon: "📢" },
];

const AI_NAMES = [
  { id: "Sofía", label: "Sofía", desc: "Femenino · Amigable" },
  { id: "Mateo", label: "Mateo", desc: "Masculino · Profesional" },
  { id: "Valentina", label: "Valentina", desc: "Femenino · Elegante" },
  { id: "Lucas", label: "Lucas", desc: "Masculino · Directo" },
  { id: "Dra. Ana", label: "Dra. Ana", desc: "Femenino · Serio" },
  { id: "Gabriel", label: "Gabriel", desc: "Masculino · Cálido" },
];

const RESPONSE_LENGTHS = [
  { id: "corta", label: "Corta", desc: "Respuestas rápidas y directas" },
  { id: "media", label: "Media", desc: "Balance entre detalle y brevedad" },
  { id: "detallada", label: "Detallada", desc: "Respuestas completas y explicativas" },
];

// ── Parse visual config from aiRules JSON ──
function parseVisualConfig(aiRulesRaw: string): VisualConfig {
  try {
    const rules = JSON.parse(aiRulesRaw);
    if (Array.isArray(rules)) {
      const vc = rules.find((r: any) => r.type === "visual_config");
      if (vc) {
        return {
          name: vc.name || DEFAULT_VISUAL.name,
          personality: vc.personality || DEFAULT_VISUAL.personality,
          salesLevel: typeof vc.salesLevel === "number" ? vc.salesLevel : DEFAULT_VISUAL.salesLevel,
          useEmojis: vc.useEmojis !== false,
          responseLength: vc.responseLength || DEFAULT_VISUAL.responseLength,
          specialInstructions: vc.specialInstructions || "",
        };
      }
    }
  } catch {}
  return { ...DEFAULT_VISUAL };
}

// ── Build aiRules JSON preserving other rules + visual config ──
function buildAiRules(aiRulesRaw: string, visual: VisualConfig): string {
  try {
    const existing = JSON.parse(aiRulesRaw);
    const rules = Array.isArray(existing) ? existing.filter((r: any) => r.type !== "visual_config") : [];
    rules.push({ type: "visual_config", ...visual });
    return JSON.stringify(rules);
  } catch {
    return JSON.stringify([{ type: "visual_config", ...visual }]);
  }
}

// ── Component ──
export default function AIVisualSettings({
  autoReplyEnabled: initialAutoReply,
  aiMode: initialAiMode,
  aiRulesRaw,
  monthlyBudget: initialBudget,
  primaryColor,
  onSave,
  saving,
  saved,
  error: externalError,
}: AIVisualSettingsProps) {
  const [autoReply, setAutoReply] = useState(initialAutoReply);
  const [mode, setMode] = useState(initialAiMode);
  const [budget, setBudget] = useState(initialBudget);
  const [visual, setVisual] = useState<VisualConfig>(() => parseVisualConfig(aiRulesRaw));
  const [localError, setLocalError] = useState<string | null>(null);

  const error = externalError || localError;
  const setError = (msg: string | null) => setLocalError(msg);

  // Sync when props change (e.g. after load)
  useEffect(() => {
    setAutoReply(initialAutoReply);
    setMode(initialAiMode);
    setBudget(initialBudget);
    setVisual(parseVisualConfig(aiRulesRaw));
  }, [initialAutoReply, initialAiMode, aiRulesRaw, initialBudget]);

  const updateVisual = (partial: Partial<VisualConfig>) => {
    setVisual((prev) => ({ ...prev, ...partial }));
  };

  const handleSaveClick = async () => {
    setError(null);
    const aiRulesJson = buildAiRules(aiRulesRaw, visual);
    await onSave({
      autoReplyEnabled: autoReply,
      aiMode: mode,
      aiRules: aiRulesJson,
      monthlyAiBudget: budget ? parseFloat(budget) : null,
    });
  };

  // ── Render ──
  return (
    <>
      <div style={{ padding: "24px", borderBottom: "1px solid var(--border-glass)" }}>
        <h1 className="panel-title">Asistente IA</h1>
        <div className="card-kicker" style={{ marginTop: "12px" }}>
          Personaliza cómo tu asistente virtual interactúa con los clientes
        </div>
      </div>

      <div className="internal-scroll" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 24 }}>
        {/* ── Section: Nombre del asistente ── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Bot size={16} color={primaryColor} />
            <label style={sectionLabelStyle}>Nombre del asistente</label>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {AI_NAMES.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => updateVisual({ name: n.id })}
                style={{
                  ...chipStyle,
                  border: visual.name === n.id ? `2px solid ${primaryColor}` : "1px solid var(--glass-border)",
                  background: visual.name === n.id ? `${primaryColor}10` : "var(--surface-glass-strong)",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{n.id}</div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{n.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Section: Personalidad ── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Sparkles size={16} color={primaryColor} />
            <label style={sectionLabelStyle}>Personalidad</label>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {PERSONALITIES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => updateVisual({ personality: p.id })}
                style={{
                  ...chipStyle,
                  border: visual.personality === p.id ? `2px solid ${primaryColor}` : "1px solid var(--glass-border)",
                  background: visual.personality === p.id ? `${primaryColor}10` : "var(--surface-glass-strong)",
                  minWidth: 140,
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 4 }}>{p.icon}</div>
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{p.label}</div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Section: Modo ── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Zap size={16} color={primaryColor} />
            <label style={sectionLabelStyle}>Modo de operación</label>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { id: "manual", label: "Manual", desc: "Solo responde cuando tú actives", icon: "🖐️" },
              { id: "automatic", label: "Automático", desc: "Responde a todos los clientes", icon: "🤖" },
              { id: "scheduled", label: "Híbrido", desc: "Automatiza fuera del horario laboral", icon: "⏰" },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                style={{
                  ...chipStyle,
                  flex: 1,
                  textAlign: "center",
                  border: mode === m.id ? `2px solid ${primaryColor}` : "1px solid var(--glass-border)",
                  background: mode === m.id ? `${primaryColor}10` : "var(--surface-glass-strong)",
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 4 }}>{m.icon}</div>
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{m.label}</div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", lineHeight: 1.3 }}>{m.desc}</div>
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, padding: "10px 14px", borderRadius: 10, background: "var(--surface-glass-strong)", border: "1px solid var(--glass-border)" }}>
            <input type="checkbox" id="ai-autoreply-visual" checked={autoReply}
              onChange={(e) => setAutoReply(e.target.checked)}
              style={{ width: 18, height: 18, cursor: "pointer" }} />
            <label htmlFor="ai-autoreply-visual" style={{ cursor: "pointer", fontSize: 14, fontWeight: 500 }}>
              Respuestas automáticas activadas
            </label>
            <HelpCircle size={14} style={{ color: "var(--text-tertiary)", flexShrink: 0, cursor: "help" }} data-tip="Cuando está activado, el asistente responde automáticamente a los mensajes de clientes según el modo seleccionado." />
          </div>
        </div>

        {/* ── Section: Estilo de respuestas ── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <MessageSquare size={16} color={primaryColor} />
            <label style={sectionLabelStyle}>Estilo de respuestas</label>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {RESPONSE_LENGTHS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => updateVisual({ responseLength: r.id })}
                style={{
                  ...chipStyle,
                  flex: 1,
                  textAlign: "center",
                  border: visual.responseLength === r.id ? `2px solid ${primaryColor}` : "1px solid var(--glass-border)",
                  background: visual.responseLength === r.id ? `${primaryColor}10` : "var(--surface-glass-strong)",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{r.label}</div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", lineHeight: 1.3 }}>{r.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Section: Ventas y emojis ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Nivel de ventas */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Zap size={16} color={primaryColor} />
              <label style={sectionLabelStyle}>Nivel de ventas</label>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => updateVisual({ salesLevel: level })}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    borderRadius: 8,
                    border: visual.salesLevel === level ? `2px solid ${primaryColor}` : "1px solid var(--glass-border)",
                    background: visual.salesLevel === level ? `${primaryColor}10` : "var(--surface-glass-strong)",
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                    color: visual.salesLevel >= level ? primaryColor : "var(--text-tertiary)",
                    textAlign: "center",
                  }}
                  title={level === 1 ? "Nada vendedor" : level === 5 ? "Muy vendedor" : `Nivel ${level}`}
                >
                  {level}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 6, display: "flex", justifyContent: "space-between" }}>
              <span>Nada vendedor</span>
              <span>Muy vendedor</span>
            </div>
          </div>

          {/* Emojis */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Smile size={16} color={primaryColor} />
              <label style={sectionLabelStyle}>Uso de emojis</label>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => updateVisual({ useEmojis: true })}
                style={{
                  flex: 1,
                  padding: "12px 0",
                  borderRadius: 10,
                  border: visual.useEmojis ? `2px solid ${primaryColor}` : "1px solid var(--glass-border)",
                  background: visual.useEmojis ? `${primaryColor}10` : "var(--surface-glass-strong)",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                  color: visual.useEmojis ? primaryColor : "var(--text-tertiary)",
                  textAlign: "center",
                }}
              >
                😊 Activos
              </button>
              <button
                type="button"
                onClick={() => updateVisual({ useEmojis: false })}
                style={{
                  flex: 1,
                  padding: "12px 0",
                  borderRadius: 10,
                  border: !visual.useEmojis ? `2px solid ${primaryColor}` : "1px solid var(--glass-border)",
                  background: !visual.useEmojis ? `${primaryColor}10` : "var(--surface-glass-strong)",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                  color: !visual.useEmojis ? primaryColor : "var(--text-tertiary)",
                  textAlign: "center",
                }}
              >
                🚫 Inactivos
              </button>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 6 }}>
              Los emojis hacen que las respuestas sean más cálidas y cercanas
            </div>
          </div>
        </div>

        {/* ── Section: Instrucciones especiales ── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <MessageSquare size={16} color={primaryColor} />
            <label style={sectionLabelStyle}>Instrucciones especiales</label>
            <HelpCircle size={14} style={{ color: "var(--text-tertiary)" }} data-tip="Indicaciones específicas para el asistente, como frases que debe usar o evitar" />
          </div>
          <textarea
            className="field-input"
            value={visual.specialInstructions}
            onChange={(e) => updateVisual({ specialInstructions: e.target.value })}
            placeholder="Ej: Siempre ofrecer un descuento de bienvenida del 10% en la primera visita. Mencionar que tenemos estacionamiento gratuito."
            style={{ minHeight: 80, resize: "vertical", fontSize: 14, lineHeight: 1.5 }}
          />
          <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>
            Dale instrucciones específicas a tu asistente sobre cómo interactuar con los clientes
          </div>
        </div>

        {/* ── Section: Presupuesto ── */}
        <div>
          <label style={sectionLabelStyle}>Presupuesto mensual de IA (USD)</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            <input
              type="number"
              className="field-input"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Ej: 50.00"
              step="0.01"
              min="0"
              style={{ maxWidth: 200 }}
            />
            <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
              Límite de gasto mensual en respuestas de IA
            </span>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div style={{ padding: 12, borderRadius: 8, background: "rgba(231,76,60,0.1)", color: "#e74c3c", fontSize: 14 }}>
            {error}
          </div>
        )}

        {/* ── Save button ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 8, borderTop: "1px solid var(--glass-border)" }}>
          <button
            className="primary-btn"
            onClick={handleSaveClick}
            disabled={saving}
            style={{
              background: primaryColor,
              border: "none",
              color: "#fff",
              padding: "10px 24px",
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
            {saving ? "Guardando..." : "Guardar configuración IA"}
          </button>
          {saved && (
            <span style={{ color: "#27ae60", fontSize: 14, fontWeight: 500 }}>
              Configuración guardada ✓
            </span>
          )}
        </div>
      </div>
    </>
  );
}

// ── Styles ──
const sectionLabelStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "var(--text-primary)",
};

const chipStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 2,
  padding: "10px 14px",
  borderRadius: 12,
  cursor: "pointer",
  transition: "all 0.15s",
};
