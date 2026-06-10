// ================================================================
// /business/settings/knowledge/page.tsx — Knowledge Base Settings
// Categorías: FAQs, Info Negocio, Reglas IA, Prompts IA
// Servicios/Horarios/Políticas viven en BusinessSettings (enlazados)
// ================================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/app/components/AppShell";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import {
  Check, Loader2, HelpCircle, Globe, Brain, MessageSquare,
  ExternalLink, Plus, Trash2,
} from "lucide-react";

type Tab = "faqs" | "salonProfile" | "aiRules" | "prompts";

const tabMeta: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "faqs", label: "FAQs", icon: <HelpCircle size={16} /> },
  { id: "salonProfile", label: "Info del Negocio", icon: <Globe size={16} /> },
  { id: "aiRules", label: "Reglas IA", icon: <Brain size={16} /> },
  { id: "prompts", label: "Prompts IA", icon: <MessageSquare size={16} /> },
];

// ── Helper to fetch knowledge section ──
async function fetchSection(section: string): Promise<any> {
  const res = await fetch(`/api/knowledge?section=${section}`);
  const json = await res.json();
  if (json.ok && json.items?.length > 0) return json.items[0].data;
  return null;
}

// ── Helper to save knowledge section ──
async function saveSection(section: string, data: any): Promise<boolean> {
  const res = await fetch("/api/knowledge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ section, data }),
  });
  const json = await res.json();
  return json.ok === true;
}

export default function KnowledgeSettingsPage() {
  const { branding, loading: tenantLoading } = useTenantBranding();

  const [activeTab, setActiveTab] = useState<Tab>("faqs");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#7c5cff");

  useEffect(() => {
    if (branding?.primaryColor) setPrimaryColor(branding.primaryColor);
  }, [branding]);

  // ── FAQs state ──
  const [faqs, setFaqs] = useState<any[]>([]);
  const [faqsLoaded, setFaqsLoaded] = useState(false);

  // ── Salon Profile state ──
  const [salonName, setSalonName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [website, setWebsite] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [mainPromise, setMainPromise] = useState("");
  const [brandTone, setBrandTone] = useState("");
  const [salonLoaded, setSalonLoaded] = useState(false);

  // ── AI Rules state ──
  const [aiRulesText, setAiRulesText] = useState("");
  const [aiRulesLoaded, setAiRulesLoaded] = useState(false);

  // ── Prompts state ──
  const [prompts, setPrompts] = useState<any[]>([]);
  const [promptsLoaded, setPromptsLoaded] = useState(false);

  // ── Load data per tab ──
  useEffect(() => {
    setLoading(true);
    setError(null);

    if (activeTab === "faqs" && !faqsLoaded) {
      fetchSection("faqs").then((data) => {
        if (Array.isArray(data)) setFaqs(data);
        setFaqsLoaded(true);
        setLoading(false);
      }).catch(() => { setLoading(false); setFaqsLoaded(true); });
    } else if (activeTab === "salonProfile" && !salonLoaded) {
      fetchSection("salonProfile").then((data) => {
        if (data) {
          setSalonName(data.salonName || "");
          setAddress(data.address || "");
          setCity(data.city || "");
          setPhone(data.phone || "");
          setInstagram(data.instagram || "");
          setWebsite(data.website || "");
          setShortDescription(data.shortDescription || "");
          setMainPromise(data.mainPromise || "");
          setBrandTone(data.brandTone || "");
        }
        setSalonLoaded(true);
        setLoading(false);
      }).catch(() => { setLoading(false); setSalonLoaded(true); });
    } else if (activeTab === "aiRules" && !aiRulesLoaded) {
      fetchSection("aiRules").then((data) => {
        if (data) setAiRulesText(JSON.stringify(data, null, 2));
        setAiRulesLoaded(true);
        setLoading(false);
      }).catch(() => { setLoading(false); setAiRulesLoaded(true); });
    } else if (activeTab === "prompts" && !promptsLoaded) {
      fetchSection("prompts").then((data) => {
        if (Array.isArray(data)) setPrompts(data);
        setPromptsLoaded(true);
        setLoading(false);
      }).catch(() => { setLoading(false); setPromptsLoaded(true); });
    } else {
      setLoading(false);
    }
  }, [activeTab, faqsLoaded, salonLoaded, aiRulesLoaded, promptsLoaded]);

  // ── Save handler ──
  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      let ok = false;

      if (activeTab === "faqs") {
        ok = await saveSection("faqs", faqs);
      } else if (activeTab === "salonProfile") {
        ok = await saveSection("salonProfile", {
          salonName, address, city, phone, instagram, website,
          shortDescription, mainPromise, brandTone,
        });
      } else if (activeTab === "aiRules") {
        const parsed = safeParseJson(aiRulesText);
        if (parsed === undefined) throw new Error("JSON inválido en Reglas IA");
        ok = await saveSection("aiRules", parsed);
      } else if (activeTab === "prompts") {
        ok = await saveSection("prompts", prompts);
      }

      if (!ok) throw new Error("Error al guardar");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [activeTab, faqs, salonName, address, city, phone, instagram, website,
      shortDescription, mainPromise, brandTone, aiRulesText, prompts]);

  if (tenantLoading) {
    return (
      <AppShell>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
          <Loader2 size={24} className="spin" />
          <span style={{ marginLeft: 12, color: "var(--text-secondary)" }}>Cargando...</span>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="settings-grid">
        {/* ── Sidebar ── */}
        <div className="panel-fixed">
          <div style={{ padding: 20, borderBottom: "1px solid var(--border-glass)" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>Knowledge Base</h2>
          </div>
          <div className="internal-scroll" style={{ padding: "8px" }}>
            {tabMeta.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: "10px 14px", borderRadius: 10, border: "none",
                  background: activeTab === tab.id ? "var(--surface-glass-strong)" : "transparent",
                  color: activeTab === tab.id ? "var(--accent)" : "var(--text-secondary)",
                  fontWeight: activeTab === tab.id ? 600 : 400, fontSize: 13,
                  cursor: "pointer", transition: "all 0.15s", textAlign: "left",
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
            <div style={{ height: 1, background: "var(--glass-border)", margin: "8px 0" }} />
            {/* Links a otras configuraciones */}
            <a href="/business/settings" style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              padding: "10px 14px", borderRadius: 10, border: "none",
              color: "var(--text-tertiary)", fontSize: 13, textDecoration: "none",
              cursor: "pointer",
            }}>
              <ExternalLink size={14} />
              Servicios / Horarios / Políticas
            </a>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="list-col glass-card" style={{ display: "flex", flexDirection: "column", padding: 0 }}>
          {activeTab === "faqs" && renderFaqsTab()}
          {activeTab === "salonProfile" && renderSalonProfileTab()}
          {activeTab === "aiRules" && renderAiRulesTab()}
          {activeTab === "prompts" && renderPromptsTab()}
        </div>
      </div>
    </AppShell>
  );

  // ════════════════════════════════════════════
  // FAQS TAB
  // ════════════════════════════════════════════
  function renderFaqsTab() {
    const addFaq = () => {
      setFaqs([...faqs, { question: "", answer: "", keywords: [], autoReplyAllowed: true, requiresHuman: false }]);
    };
    const updateFaq = (idx: number, field: string, value: any) => {
      const updated = [...faqs];
      updated[idx] = { ...updated[idx], [field]: value };
      setFaqs(updated);
    };
    const removeFaq = (idx: number) => setFaqs(faqs.filter((_, i) => i !== idx));

    return (
      <>
        <div style={{ padding: "24px", borderBottom: "1px solid var(--border-glass)" }}>
          <h1 className="panel-title">FAQs</h1>
          <div className="card-kicker" style={{ marginTop: "8px" }}>
            Preguntas frecuentes para auto-respuesta del AI Concierge
          </div>
        </div>
        <div className="internal-scroll" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--text-tertiary)" }}><Loader2 size={20} className="spin" /></div>
          ) : (
            <>
              {faqs.length === 0 && (
                <div style={{ padding: 20, textAlign: "center", color: "var(--text-tertiary)", fontSize: 14 }}>
                  No hay FAQs. Agrega la primera.
                </div>
              )}
              {faqs.map((faq, idx) => (
                <div key={idx} style={{ padding: 16, borderRadius: 12, border: "1px solid var(--glass-border)", background: "var(--surface-glass)" }}>
                  <div style={{ marginBottom: 8 }}>
                    <input type="text" className="field-input" value={faq.question}
                      onChange={(e) => updateFaq(idx, "question", e.target.value)}
                      placeholder="Pregunta" />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <textarea className="field-input" value={faq.answer}
                      onChange={(e) => updateFaq(idx, "answer", e.target.value)}
                      placeholder="Respuesta" style={{ minHeight: 60, resize: "vertical" }} />
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                    <input type="text" className="field-input" value={faq.keywords?.join(", ") || ""}
                      onChange={(e) => updateFaq(idx, "keywords", e.target.value.split(",").map((k: string) => k.trim()))}
                      placeholder="Palabras clave (separadas por coma)" style={{ flex: 1 }} />
                  </div>
                  <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 8 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                      <input type="checkbox" checked={faq.autoReplyAllowed !== false}
                        onChange={(e) => updateFaq(idx, "autoReplyAllowed", e.target.checked)} />
                      Auto-respuesta
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                      <input type="checkbox" checked={faq.requiresHuman === true}
                        onChange={(e) => updateFaq(idx, "requiresHuman", e.target.checked)} />
                      Requiere humano
                    </label>
                  </div>
                  <button onClick={() => removeFaq(idx)}
                    style={{ background: "rgba(231,76,60,0.15)", color: "#e74c3c", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontWeight: 500, fontSize: 12 }}>
                    <Trash2 size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />
                    Quitar FAQ
                  </button>
                </div>
              ))}
              <button onClick={addFaq}
                style={{ padding: "10px", borderRadius: 10, border: "2px dashed var(--glass-border)", background: "transparent", color: "var(--text-tertiary)", cursor: "pointer", fontSize: 14, fontWeight: 500 }}>
                <Plus size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
                Agregar FAQ
              </button>
              {renderErrorAndSave()}
            </>
          )}
        </div>
      </>
    );
  }

  // ════════════════════════════════════════════
  // SALON PROFILE TAB
  // ════════════════════════════════════════════
  function renderSalonProfileTab() {
    return (
      <>
        <div style={{ padding: "24px", borderBottom: "1px solid var(--border-glass)" }}>
          <h1 className="panel-title">Información del Negocio</h1>
          <div className="card-kicker" style={{ marginTop: "8px" }}>
            Datos generales que el AI Concierge usará para responder a clientes
          </div>
        </div>
        <div className="internal-scroll" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 20 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--text-tertiary)" }}><Loader2 size={20} className="spin" /></div>
          ) : (
            <>
              <div>
                <label className="field-label">Nombre del Salón</label>
                <input type="text" className="field-input" value={salonName}
                  onChange={(e) => setSalonName(e.target.value)} placeholder="Ej: Nombre de tu salón" />
              </div>
              <div>
                <label className="field-label">Dirección</label>
                <input type="text" className="field-input" value={address}
                  onChange={(e) => setAddress(e.target.value)} placeholder="Ej: Av. Principal 123" />
              </div>
              <div>
                <label className="field-label">Ciudad</label>
                <input type="text" className="field-input" value={city}
                  onChange={(e) => setCity(e.target.value)} placeholder="Ej: Santiago" />
              </div>
              <div>
                <label className="field-label">Teléfono</label>
                <input type="text" className="field-input" value={phone}
                  onChange={(e) => setPhone(e.target.value)} placeholder="Ej: +56 9 1234 5678" />
              </div>
              <div>
                <label className="field-label">Instagram</label>
                <input type="text" className="field-input" value={instagram}
                  onChange={(e) => setInstagram(e.target.value)} placeholder="Ej: @maiteguerra.studio" />
              </div>
              <div>
                <label className="field-label">Sitio Web</label>
                <input type="text" className="field-input" value={website}
                  onChange={(e) => setWebsite(e.target.value)} placeholder="Ej: https://maiteguerra.cl" />
              </div>
              <div>
                <label className="field-label">Descripción corta</label>
                <textarea className="field-input" value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Ej: Atelier de belleza con atención personalizada."
                  style={{ minHeight: 60, resize: "vertical" }} />
              </div>
              <div>
                <label className="field-label">Promesa principal</label>
                <textarea className="field-input" value={mainPromise}
                  onChange={(e) => setMainPromise(e.target.value)}
                  placeholder="Ej: Crear experiencias de belleza cuidadas, luminosas y memorables."
                  style={{ minHeight: 60, resize: "vertical" }} />
              </div>
              <div>
                <label className="field-label">Tono de marca</label>
                <textarea className="field-input" value={brandTone}
                  onChange={(e) => setBrandTone(e.target.value)}
                  placeholder="Ej: Luxury concierge, cálido, editorial y seguro."
                  style={{ minHeight: 60, resize: "vertical" }} />
                <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>
                  Define cómo el AI Concierge debe comunicarse con los clientes
                </div>
              </div>
              {renderErrorAndSave()}
            </>
          )}
        </div>
      </>
    );
  }

  // ════════════════════════════════════════════
  // AI RULES TAB
  // ════════════════════════════════════════════
  function renderAiRulesTab() {
    return (
      <>
        <div style={{ padding: "24px", borderBottom: "1px solid var(--border-glass)" }}>
          <h1 className="panel-title">Reglas IA</h1>
          <div className="card-kicker" style={{ marginTop: "8px" }}>
            Reglas de comportamiento para el AI Concierge (JSON)
          </div>
        </div>
        <div className="internal-scroll" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--text-tertiary)" }}><Loader2 size={20} className="spin" /></div>
          ) : (
            <>
              <div>
                <label className="field-label">Reglas de IA (JSON)</label>
                <textarea className="field-input" value={aiRulesText}
                  onChange={(e) => setAiRulesText(e.target.value)}
                  style={{ minHeight: 300, fontFamily: "monospace", fontSize: 12, resize: "vertical" }}
                  placeholder={`{\n  "responseTone": "...",\n  "allowedWords": [...],\n  "forbiddenWords": [...]\n}`} />
                <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>
                  Incluye: responseTone, allowedWords, forbiddenWords, allowedEmojis, whenToSell, whenNotToSell, etc.
                </div>
              </div>
              {renderErrorAndSave()}
            </>
          )}
        </div>
      </>
    );
  }

  // ════════════════════════════════════════════
  // PROMPTS TAB
  // ════════════════════════════════════════════
  function renderPromptsTab() {
    const addPrompt = () => {
      setPrompts([...prompts, { name: "", role: "", prompt: "", active: true }]);
    };
    const updatePrompt = (idx: number, field: string, value: any) => {
      const updated = [...prompts];
      updated[idx] = { ...updated[idx], [field]: value };
      setPrompts(updated);
    };
    const removePrompt = (idx: number) => setPrompts(prompts.filter((_, i) => i !== idx));

    return (
      <>
        <div style={{ padding: "24px", borderBottom: "1px solid var(--border-glass)" }}>
          <h1 className="panel-title">Prompts IA</h1>
          <div className="card-kicker" style={{ marginTop: "8px" }}>
            Prompts personalizados para diferentes contextos del AI Concierge
          </div>
        </div>
        <div className="internal-scroll" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--text-tertiary)" }}><Loader2 size={20} className="spin" /></div>
          ) : (
            <>
              {prompts.length === 0 && (
                <div style={{ padding: 20, textAlign: "center", color: "var(--text-tertiary)", fontSize: 14 }}>
                  No hay prompts personalizados. Agrega el primero.
                </div>
              )}
              {prompts.map((p, idx) => (
                <div key={idx} style={{ padding: 16, borderRadius: 12, border: "1px solid var(--glass-border)", background: "var(--surface-glass)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                    <input type="text" className="field-input" value={p.name}
                      onChange={(e) => updatePrompt(idx, "name", e.target.value)}
                      placeholder="Nombre del prompt" />
                    <input type="text" className="field-input" value={p.role}
                      onChange={(e) => updatePrompt(idx, "role", e.target.value)}
                      placeholder="Rol (ej: whatsapp_reply)" />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <textarea className="field-input" value={p.prompt}
                      onChange={(e) => updatePrompt(idx, "prompt", e.target.value)}
                      placeholder="Contenido del prompt..."
                      style={{ minHeight: 80, resize: "vertical" }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                      <input type="checkbox" checked={p.active !== false}
                        onChange={(e) => updatePrompt(idx, "active", e.target.checked)} />
                      Activo
                    </label>
                    <button onClick={() => removePrompt(idx)}
                      style={{ background: "rgba(231,76,60,0.15)", color: "#e74c3c", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontWeight: 500, fontSize: 12, marginLeft: "auto" }}>
                      <Trash2 size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={addPrompt}
                style={{ padding: "10px", borderRadius: 10, border: "2px dashed var(--glass-border)", background: "transparent", color: "var(--text-tertiary)", cursor: "pointer", fontSize: 14, fontWeight: 500 }}>
                <Plus size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
                Agregar prompt
              </button>
              {renderErrorAndSave()}
            </>
          )}
        </div>
      </>
    );
  }

  // ════════════════════════════════════════════
  // SHARED: Error + Save
  // ════════════════════════════════════════════
  function renderErrorAndSave() {
    return (
      <>
        {error && (
          <div style={{ padding: 12, borderRadius: 8, background: "rgba(231,76,60,0.1)", color: "#e74c3c", fontSize: 14 }}>
            {error}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 8, borderTop: "1px solid var(--glass-border)" }}>
          <button
            className="primary-btn"
            onClick={handleSave}
            disabled={saving}
            style={{
              background: primaryColor,
              border: "none", color: "#fff",
              padding: "10px 24px", borderRadius: 10,
              fontWeight: 600, fontSize: 14,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
          {saved && (
            <span style={{ color: "#27ae60", fontSize: 14, fontWeight: 500 }}>
              Cambios guardados ✓
            </span>
          )}
        </div>
      </>
    );
  }

  // ── Helper ──
  function safeParseJson(str: string): any {
    if (!str.trim()) return {};
    try { return JSON.parse(str); }
    catch { return undefined; }
  }
}
