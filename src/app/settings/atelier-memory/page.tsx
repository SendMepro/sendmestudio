"use client";

import { useState } from "react";
import AppShell from "../../components/AppShell";
import { 
  User, 
  Sparkles, 
  Brain, 
  Globe, 
  Palette, 
  MessageSquare, 
  Lock,
  ChevronRight,
  Save,
  CheckCircle2,
  BookOpen,
  ShieldCheck
} from "lucide-react";

const SETTINGS_MENU = [
  { id: "profile", label: "Studio Profile", icon: User },
  { id: "voice", label: "Brand Voice", icon: Sparkles },
  { id: "editorial", label: "Editorial Terms", icon: BookOpen },
  { id: "memory", label: "Memory Engine", icon: Brain },
  { id: "integrations", label: "Integrations", icon: Globe },
  { id: "theme", label: "Aesthetics", icon: Palette },
  { id: "ai", label: "AI Behavior", icon: MessageSquare },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("editorial");
  const [saved, setSaved] = useState(false);

  return (
    <AppShell>
    <div className="settings-grid">
      {/* 2. SETTINGS MENU */}
      <div className="list-col glass-card" style={{ display: "flex", flexDirection: "column", padding: 0 }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border-glass)" }}>
          <h1 className="h1" style={{ fontSize: "20px" }}>Ajustes</h1>
          <div className="meta" style={{ color: "var(--text-muted)", marginTop: "6px" }}>Atelier Config</div>
        </div>

        <div className="internal-scroll" style={{ padding: "10px" }}>
          {SETTINGS_MENU.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="interactive"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "14px 16px",
                  borderRadius: "18px",
                  background: isActive ? "var(--bg-glass-strong)" : "transparent",
                  color: isActive ? "var(--primary)" : "var(--text-secondary)",
                  border: isActive ? "1px solid var(--border-glass)" : "1px solid transparent",
                  marginBottom: "4px"
                }}
              >
                <Icon size={16} strokeWidth={1.4} />
                <span className="body" style={{ fontWeight: isActive ? 700 : 500 }}>{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. SETTINGS CONTENT */}
      <div className="main-col glass-card" style={{ display: "flex", flexDirection: "column", padding: 0 }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: "1px solid var(--border-glass)" }}>
          <div className="h1" style={{ fontSize: "18px" }}>{SETTINGS_MENU.find(t => t.id === activeTab)?.label}</div>
          <button className="primary-button" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}>
            {saved ? <CheckCircle2 size={16} strokeWidth={1.4} /> : <Save size={16} strokeWidth={1.4} />}
            {saved ? "GUARDADO" : "GUARDAR"}
          </button>
        </header>

        <div className="internal-scroll" style={{ padding: "32px" }}>
          <div style={{ maxWidth: "680px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
              <section className="glass-strong">
                 <div className="meta" style={{ marginBottom: "16px" }}>Voice of the Salon</div>
                 <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                    <div>
                      <label className="meta" style={{ display: "block", marginBottom: "8px", fontSize: "8px" }}>Tono Primario</label>
                      <select className="glass-select">
                        <option>Elegante, Cálida, Editorial (Dior Style)</option>
                        <option>Vanguardista, Técnica, Minimalista (Aesop Style)</option>
                      </select>
                    </div>
                    <div>
                      <label className="meta" style={{ display: "block", marginBottom: "8px", fontSize: "8px" }}>Promesa del Ritual</label>
                      <textarea className="glass-input" style={{ height: "80px", padding: "12px", resize: "none" }} defaultValue="Transformación real con resultados visibles. Atención de concierge." />
                    </div>
                 </div>
              </section>

              <section className="glass-strong">
                 <div className="meta" style={{ marginBottom: "16px" }}>Muse Integration Rules</div>
                 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    <div>
                       <label className="meta" style={{ display: "block", marginBottom: "8px", fontSize: "8px" }}>Palabras Clave</label>
                       <textarea className="glass-input" style={{ height: "100px", padding: "12px", resize: "none" }} defaultValue="ritual, salon, atelier, muse, seleccion, dossier" />
                    </div>
                    <div>
                       <label className="meta" style={{ display: "block", marginBottom: "8px", fontSize: "8px" }}>Términos Evitados</label>
                       <textarea className="glass-input" style={{ height: "100px", padding: "12px", resize: "none" }} defaultValue="oferta, barato, descuento, promo, cupon" />
                    </div>
                 </div>
              </section>

              <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "20px", background: "var(--primary-glow)", borderRadius: "18px", border: "1px solid var(--border-glass)" }}>
                 <Brain size={16} strokeWidth={1.4} color="var(--primary)" />
                 <div style={{ flex: 1 }}>
                    <div className="body" style={{ fontWeight: 700 }}>Memory Engine Sync</div>
                    <p className="small" style={{ opacity: 0.7 }}>Aprendiendo 42 nuevos términos del Salon.</p>
                 </div>
                 <div className="meta" style={{ color: "var(--primary)" }}>88%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. SETTINGS CONTEXT */}
      <div className="context-col" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
         <div className="glass-card" style={{ height: "auto", padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <ShieldCheck size={16} color="var(--primary)" />
                <span className="meta" style={{ color: "var(--text-primary)" }}>Atelier Security</span>
            </div>
            <p className="small" style={{ color: "var(--text-secondary)", lineHeight: 1.5 }}>Todos los datos del Salon están protegidos bajo cifrado de grado editorial.</p>
         </div>
      </div>
    </div>
    </AppShell>
  );
}
