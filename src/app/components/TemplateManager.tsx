// ================================================================
// components/TemplateManager.tsx — Gestor visual de Templates
// Permite al dueño del negocio explorar, previsualizar y aplicar
// templates verticales sin ayuda técnica.
// ================================================================

"use client";

import { useState, useEffect } from "react";
import {
  Layers, Check, Loader2, AlertTriangle, RefreshCw,
  Palette, Bot, Clock, Shield, Scissors, Eye, Download,
  X, ArrowRight,
} from "lucide-react";

// ── Types ──

interface VerticalTemplate {
  id: string;
  slug: string;
  name: string;
  version: string;
  vertical: string;
  isActive: boolean;
  description: string;
  config: any;
  createdAt: string;
  updatedAt: string;
}

interface TemplateInfo {
  templateId: string | null;
  templateVersion: string | null;
  templateName: string | null;
  businessName: string;
  businessType: string;
}

interface DiffItem {
  category: "branding" | "services" | "stylists" | "faqs" | "ai" | "horarios" | "policies";
  field: string;
  current: any;
  proposed: any;
  action: "add" | "update" | "remove" | "keep";
}

interface TemplateData {
  current: TemplateInfo;
  templates: VerticalTemplate[];
  diff: {
    items: DiffItem[];
    template: { id: string; name: string; version: string; vertical: string; description: string } | null;
    summary: { total: number; byCategory: Record<string, number> };
  } | null;
}

// ── Constantes ──

const VERTICAL_LABELS: Record<string, string> = {
  salon: "💇 Salón Belleza",
  barber: "✂️ Barbería",
  spa: "🧖 SPA & Bienestar",
  estetica: "✨ Centro Estética",
  clinica: "🏥 Clínica Estética",
};

const VERTICAL_COLORS: Record<string, string> = {
  salon: "#7c5cff",
  barber: "#1a1a2e",
  spa: "#059669",
  estetica: "#be185d",
  clinica: "#2563eb",
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  branding: <Palette size={14} />,
  services: <Scissors size={14} />,
  stylists: <Bot size={14} />,
  faqs: <Layers size={14} />,
  ai: <Bot size={14} />,
  horarios: <Clock size={14} />,
  policies: <Shield size={14} />,
};

const CATEGORY_LABELS: Record<string, string> = {
  branding: "Branding",
  services: "Servicios",
  stylists: "Especialistas",
  faqs: "FAQs",
  ai: "Configuración IA",
  horarios: "Horarios",
  policies: "Políticas",
};

// ── Component ──

interface Props {
  primaryColor: string;
  onSave?: (data: any) => Promise<void>;
  saving?: boolean;
  saved?: boolean;
}

export default function TemplateManager({ primaryColor, onSave, saving: parentSaving, saved: parentSaved }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TemplateData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<VerticalTemplate | null>(null);
  const [diffData, setDiffData] = useState<{
    items: DiffItem[];
    template: { id: string; name: string; version: string; vertical: string; description: string } | null;
    summary: { total: number; byCategory: Record<string, number> };
  } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [createBackup, setCreateBackup] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applyResult, setApplyResult] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Cargar datos al montar
  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/business-settings/templates");
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error al cargar templates");
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Cargar preview cuando se selecciona un template
  async function loadPreview(templateId: string) {
    setDiffData(null);
    setSelectedTemplate(data?.templates.find((t) => t.id === templateId) || null);
    try {
      const res = await fetch(`/api/business-settings/templates?preview=${templateId}`);
      if (!res.ok) return;
      const json = await res.json();
      if (json.diff) setDiffData(json.diff);
    } catch {
      // Preview falla silenciosamente
    }
  }

  // Aplicar template
  async function handleApply() {
    if (!selectedTemplate) return;
    setApplying(true);
    setApplyResult(null);
    try {
      const res = await fetch("/api/business-settings/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          mode: "merge",
          categories: Object.keys(diffData?.summary.byCategory || {}),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error al aplicar template");
      }
      setApplyResult("success");
      setShowConfirm(false);
      // Recargar datos
      await loadTemplates();
      // Si hay callback de save, notificar
      if (onSave) {
        await onSave({ appliedTemplate: selectedTemplate.id });
      }
    } catch (err: any) {
      setApplyResult(err.message);
    } finally {
      setApplying(false);
    }
  }

  // ── Render: Loading ──
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
        <Loader2 size={20} className="spin" />
        <span style={{ marginLeft: 10, color: "var(--text-secondary)", fontSize: 14 }}>Cargando templates...</span>
      </div>
    );
  }

  // ── Render: Error ──
  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#e74c3c", padding: 16, borderRadius: 12, background: "rgba(231,76,60,0.08)" }}>
          <AlertTriangle size={16} />
          {error}
        </div>
        <button onClick={loadTemplates} style={styles.retryBtn}>
          <RefreshCw size={14} />
          Reintentar
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { current, templates } = data;
  const hasTemplate = !!current.templateId;

  // Agrupar templates por vertical
  const grouped = templates.reduce(
    (acc, t) => {
      const v = t.vertical;
      if (!acc[v]) acc[v] = [];
      acc[v].push(t);
      return acc;
    },
    {} as Record<string, VerticalTemplate[]>,
  );

  // Ordenar: vertical del negocio primero
  const verticalOrder = [current.businessType, ...Object.keys(grouped).filter((v) => v !== current.businessType)];

  return (
    <>
      {/* Header */}
      <div style={{ padding: "24px", borderBottom: "1px solid var(--border-glass)" }}>
        <h1 className="panel-title">Template del Negocio</h1>
        <div className="card-kicker" style={{ marginTop: "12px" }}>
          Aplica una configuración predefinida para tu tipo de negocio
        </div>
      </div>

      <div className="internal-scroll" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── Template Actual ── */}
        <div style={{
          padding: 16,
          borderRadius: 12,
          background: "var(--surface-glass-strong)",
          border: hasTemplate ? "1px solid rgba(124,92,255,0.15)" : "1px dashed var(--glass-border)",
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
            Template Actual
          </div>
          {hasTemplate ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `${primaryColor}15`, color: primaryColor,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Check size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>
                  {current.templateName || "Template aplicado"}
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 2 }}>
                  {current.templateVersion && (
                    <span style={{ padding: "1px 6px", borderRadius: 4, background: "rgba(124,92,255,0.08)", fontSize: 10, fontWeight: 600, color: "#7c5cff" }}>
                      {current.templateVersion}
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                    {current.businessName}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: "var(--text-tertiary)", fontSize: 13 }}>
              No has aplicado ningún template todavía. Elige uno abajo para comenzar.
            </div>
          )}
        </div>

        {/* ── Templates Disponibles ── */}
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>
            Templates Disponibles
          </div>

          {templates.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: "var(--text-tertiary)", fontSize: 13, borderRadius: 12, border: "1px dashed var(--glass-border)" }}>
              No hay templates disponibles. Contacta al administrador.
            </div>
          ) : (
            verticalOrder.map((vertical) => {
              const items = grouped[vertical];
              if (!items || items.length === 0) return null;
              const color = VERTICAL_COLORS[vertical] || "#7c5cff";
              return (
                <div key={vertical} style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{
                      padding: "2px 10px", borderRadius: 12,
                      background: `${color}12`, color,
                      fontSize: 12, fontWeight: 600,
                    }}>
                      {VERTICAL_LABELS[vertical] || vertical}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                      {items.length} template{items.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {items.map((tpl) => {
                      const config = tpl.config as any;
                      const serLen = config?.services?.length || 0;
                      const hrsLen = config?.businessHours?.weeklyHours?.length || 0;
                      const isSelected = selectedTemplate?.id === tpl.id;
                      const isCurrent = current.templateId === tpl.id;

                      return (
                        <div
                          key={tpl.id}
                          onClick={() => loadPreview(tpl.id)}
                          style={{
                            padding: 16,
                            borderRadius: 12,
                            border: isSelected
                              ? `2px solid ${color}`
                              : "1px solid var(--glass-border)",
                            background: isSelected ? `${color}04` : "var(--surface-glass)",
                            cursor: "pointer",
                            transition: "all 0.15s",
                            opacity: isCurrent ? 0.7 : 1,
                            position: "relative",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>
                                  {tpl.name}
                                </span>
                                {isCurrent && (
                                  <span style={{ padding: "1px 8px", borderRadius: 8, background: "rgba(39,174,96,0.1)", color: "#27ae60", fontSize: 10, fontWeight: 600 }}>
                                    Actual
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                                {tpl.description}
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0 }}>
                              <span style={{ padding: "2px 8px", borderRadius: 6, background: `${color}10`, color, fontSize: 10, fontWeight: 600 }}>
                                {tpl.version}
                              </span>
                            </div>
                          </div>

                          {/* Preview chips */}
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {config?.branding?.primaryColor && (
                              <span style={styles.chip}>
                                <span style={{ width: 8, height: 8, borderRadius: 4, background: config.branding.primaryColor, display: "inline-block" }} />
                                {config.branding.primaryColor}
                              </span>
                            )}
                            <span style={styles.chip}>
                              <Bot size={10} />
                              {config?.ai?.aiRules?.length || 0} reglas IA
                            </span>
                            {serLen > 0 && (
                              <span style={styles.chip}>
                                <Scissors size={10} />
                                {serLen} servicios
                              </span>
                            )}
                            {hrsLen > 0 && (
                              <span style={styles.chip}>
                                <Clock size={10} />
                                {hrsLen} días
                              </span>
                            )}
                            <span style={styles.chip}>
                              <Shield size={10} />
                              {config?.policies?.cancellationPolicy ? "Políticas ✓" : "Sin políticas"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Preview Diff ── */}
        {diffData && (
          <div style={{
            borderRadius: 12,
            border: "1px solid var(--glass-border)",
            background: "var(--surface-glass-strong)",
            overflow: "hidden",
          }}>
            <div style={{ padding: 16, borderBottom: "1px solid var(--glass-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)", marginBottom: 4 }}>
                  Vista previa: {diffData.template?.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  {diffData.summary.total} cambio{diffData.summary.total !== 1 ? "s" : ""} detectado{diffData.summary.total !== 1 ? "s" : ""}
                </div>
              </div>
              <button
                onClick={() => setShowConfirm(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 20px",
                  background: "linear-gradient(135deg, #7c5cff, #9b7dff)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Download size={14} />
                Aplicar Template
              </button>
            </div>

            {/* Categorías agrupadas: Antes / Después */}
            <div style={{ padding: 16 }}>
              {Object.entries(
                diffData.items.reduce(
                  (acc, item) => {
                    if (!acc[item.category]) acc[item.category] = [];
                    acc[item.category].push(item);
                    return acc;
                  },
                  {} as Record<string, DiffItem[]>,
                ),
              ).map(([category, items]) => (
                <div key={category} style={{ marginBottom: 16, padding: 12, borderRadius: 10, border: "1px solid var(--glass-border)", background: "var(--surface-glass)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                    {CATEGORY_ICONS[category]}
                    <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>
                      {CATEGORY_LABELS[category] || category}
                    </span>
                    <span style={{ padding: "1px 6px", borderRadius: 4, background: "rgba(124,92,255,0.08)", fontSize: 10, color: "#7c5cff" }}>
                      {items.length} cambio{items.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {items.map((item, idx) => (
                    <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 10, alignItems: "center", marginBottom: 8, fontSize: 12 }}>
                      {/* Antes */}
                      <div style={{
                        padding: "8px 10px",
                        borderRadius: 8,
                        background: "rgba(231,76,60,0.04)",
                        border: "1px solid rgba(231,76,60,0.10)",
                        color: "#c0392b",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap" as const,
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 2, color: "#e74c3c" }}>ANTES</div>
                        {renderDiffValue(item.current, item.field)}
                      </div>

                      {/* Flecha */}
                      <ArrowRight size={14} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />

                      {/* Después */}
                      <div style={{
                        padding: "8px 10px",
                        borderRadius: 8,
                        background: "rgba(39,174,96,0.04)",
                        border: "1px solid rgba(39,174,96,0.10)",
                        color: "#27ae60",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap" as const,
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 2, color: "#27ae60" }}>DESPUÉS</div>
                        {renderDiffValue(item.proposed, item.field)}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Resultado de aplicar ── */}
        {applyResult === "success" && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: 16, borderRadius: 12,
            background: "rgba(39,174,96,0.06)",
            border: "1px solid rgba(39,174,96,0.12)",
            color: "#27ae60",
          }}>
            <Check size={18} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Template aplicado correctamente</div>
              <div style={{ fontSize: 13, opacity: 0.8 }}>Los cambios ya están activos en tu plataforma.</div>
            </div>
          </div>
        )}
        {applyResult && applyResult !== "success" && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: 16, borderRadius: 12,
            background: "rgba(231,76,60,0.06)",
            border: "1px solid rgba(231,76,60,0.12)",
            color: "#e74c3c",
          }}>
            <AlertTriangle size={18} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Error al aplicar</div>
              <div style={{ fontSize: 13, opacity: 0.8 }}>{applyResult}</div>
            </div>
            <button onClick={() => setApplyResult(null)} style={{ marginLeft: "auto", background: "none", border: "none", color: "#e74c3c", cursor: "pointer" }}>
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {/* ── Modal de Confirmación ── */}
      {showConfirm && selectedTemplate && (
        <div
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.40)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            style={{
              background: "var(--surface-card)",
              borderRadius: 20,
              width: "100%",
              maxWidth: 480,
              padding: "28px 32px",
              border: "1px solid var(--glass-border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                Aplicar Template
              </h2>
              <button onClick={() => setShowConfirm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)", marginBottom: 4 }}>
                {selectedTemplate.name} {selectedTemplate.version}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                {diffData?.summary.total
                  ? `Se aplicarán ${diffData.summary.total} cambio${diffData.summary.total !== 1 ? "s" : ""} en tu configuración.`
                  : "Se aplicará la configuración completa del template."}
              </div>
            </div>

            {/* Categorías afectadas */}
            {diffData?.summary.byCategory && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
                {Object.entries(diffData.summary.byCategory).map(([cat, count]) => (
                  <span key={cat} style={{
                    padding: "4px 10px",
                    borderRadius: 8,
                    background: "rgba(124,92,255,0.08)",
                    color: "#7c5cff",
                    fontSize: 12,
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}>
                    {CATEGORY_ICONS[cat]}
                    {CATEGORY_LABELS[cat] || cat}: {count}
                  </span>
                ))}
              </div>
            )}

            {/* Backup checkbox */}
            <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, cursor: "pointer", fontSize: 13, color: "var(--text-primary)" }}>
              <input
                type="checkbox"
                checked={createBackup}
                onChange={(e) => setCreateBackup(e.target.checked)}
                style={{ width: 16, height: 16 }}
              />
              <div>
                <div style={{ fontWeight: 500 }}>Crear backup antes de aplicar</div>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                  Se guardará una copia de tu configuración actual para poder restaurarla después
                </div>
              </div>
            </label>

            {/* Acciones */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: "1px solid var(--glass-border)",
                  background: "transparent",
                  color: "var(--text-secondary)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleApply}
                disabled={applying}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 24px",
                  background: "linear-gradient(135deg, #7c5cff, #9b7dff)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  opacity: applying ? 0.7 : 1,
                }}
              >
                {applying ? <Loader2 size={16} className="spin" /> : <Download size={16} />}
                {applying ? "Aplicando..." : "Aplicar Template"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Helpers ──

function renderDiffValue(value: any, field: string): React.ReactNode {
  if (value === null || value === undefined || value === "") return <span style={{ color: "var(--text-tertiary)", fontStyle: "italic" }}>Vacío</span>;
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (typeof value === "number") return value.toString();
  if (field === "primaryColor" || field === "secondaryColor") {
    return (
      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ width: 10, height: 10, borderRadius: 4, background: value, display: "inline-block" }} />
        {value}
      </span>
    );
  }
  if (typeof value === "object") {
    if (Array.isArray(value)) return `${value.length} elemento${value.length !== 1 ? "s" : ""}`;
    return JSON.stringify(value).substring(0, 60);
  }
  return String(value).substring(0, 80);
}

// ── Styles ──

const styles: Record<string, React.CSSProperties> = {
  retryBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    padding: "8px 16px",
    borderRadius: 8,
    border: "1px solid var(--glass-border)",
    background: "var(--surface-glass)",
    color: "var(--text-secondary)",
    fontSize: 13,
    cursor: "pointer",
  },
  chip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "2px 8px",
    borderRadius: 6,
    background: "rgba(124,92,255,0.06)",
    color: "var(--text-secondary)",
    fontSize: 10,
    fontWeight: 500,
  },
};
