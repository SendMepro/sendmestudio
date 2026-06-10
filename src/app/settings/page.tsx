"use client";

import { useState } from "react";
import Link from "next/link";
import AppShell from "../components/AppShell";
import styles from "../page.module.css";

const settingsSections = ["Studio", "Inteligencia", "Canales", "Credenciales"];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("Studio");
  const [salonName, setSalonName] = useState("Salon Belleza");
  const [autoReply, setAutoReply] = useState(true);
  const [aiModel, setAiModel] = useState("luxury-gpt");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText("sk_sendme_beauty_99201a0cb");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppShell>
    <div className="settings-grid">
      {/* 2. SETTINGS NAVIGATION */}
      <div className="list-col glass-card" style={{ display: "flex", flexDirection: "column", padding: 0 }}>
        <div style={{ padding: "24px", borderBottom: "1px solid var(--border-glass)" }}>
          <h1 className="panel-title">Ajustes</h1>
          <div className="card-kicker" style={{ marginTop: "12px" }}>Sistema & Atelier</div>
        </div>

        <div className="internal-scroll" style={{ padding: "12px" }}>
          {settingsSections.map((section) => (
            <div
              key={section}
              onClick={() => setActiveSection(section)}
              className="interactive"
              style={{
                padding: "14px 18px",
                borderRadius: "18px",
                background: activeSection === section ? "var(--bg-glass-strong)" : "transparent",
                color: activeSection === section ? "var(--primary)" : "var(--text-secondary)",
                border: activeSection === section ? "1px solid var(--border-glass)" : "1px solid transparent",
                marginBottom: "4px"
              }}
            >
              <span className="card-title" style={{ fontSize: "14px", color: activeSection === section ? "var(--primary)" : "var(--text-primary)" }}>{section}</span>
            </div>
          ))}

          <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border-glass)" }}>
            <Link href="/settings/atelier-memory" style={{ textDecoration: "none" }}>
              <div className="interactive" style={{
                padding: "16px 20px", borderRadius: "18px",
                background: "var(--primary-soft)",
                border: "1px solid var(--primary-glow)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div>
                  <div className="card-title" style={{ color: "var(--primary)", fontSize: "14px" }}>Atelier Memory</div>
                  <div className="card-kicker" style={{ fontSize: "8px", color: "var(--primary)", marginTop: "4px" }}>AI ASSISTANCE ◈</div>
                </div>
                <span className="card-title" style={{ color: "var(--primary)" }}>→</span>
              </div>
            </Link>
          </div>
        </div>

        <div style={{ padding: "20px", marginTop: "auto" }}>
           <div className="glass-strong" style={{ background: "var(--bg-glass-strong)", padding: "20px", borderRadius: "20px", border: "1px solid var(--border-glass)" }}>
              <div className="card-kicker" style={{ marginBottom: "6px" }}>Plan Activo</div>
              <div className="card-title" style={{ fontSize: "14px" }}>Studio Premium</div>
              <div className="card-meta" style={{ fontSize: "8px", opacity: 0.5, marginTop: "8px" }}>RENOVACIÓN: 01 JUN 2026</div>
           </div>
        </div>
      </div>

      {/* 3. SETTINGS CANVAS */}
      <div className="main-col glass-card" style={{ display: "flex", flexDirection: "column", padding: 0 }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--border-glass)" }}>
          <div className="panel-title" style={{ fontSize: "18px" }}>{activeSection}</div>
          <button className="primary-button">✦ GUARDAR CAMBIOS</button>
        </header>

        <div className="internal-scroll" style={{ padding: "40px" }}>
          <div style={{ maxWidth: "600px", display: "flex", flexDirection: "column", gap: "24px" }}>
            {activeSection === "Studio" && (
              <div className="glass-strong" style={{ padding: "32px", borderRadius: "24px" }}>
                <div className="card-kicker" style={{ marginBottom: "24px" }}>Identidad del Estudio</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                   <div>
                      <label className="card-kicker" style={{ display: "block", marginBottom: "12px", fontSize: "8px" }}>Nombre del Establecimiento</label>
                      <input className="glass-input" value={salonName} onChange={(e)=>setSalonName(e.target.value)} />
                   </div>
                   <div>
                      <label className="card-kicker" style={{ display: "block", marginBottom: "12px", fontSize: "8px" }}>Dirección del Estudio</label>
                      <input className="glass-input" placeholder="Av. Providencia 1234, Santiago" />
                   </div>
                </div>
              </div>
            )}

            {activeSection === "Inteligencia" && (
              <div className="glass-strong" style={{ padding: "32px", borderRadius: "24px" }}>
                <div className="card-kicker" style={{ marginBottom: "24px" }}>Inteligencia Emocional</div>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", padding: "20px 24px", background: "var(--bg-glass-strong)", borderRadius: "20px", border: "1px solid var(--border-glass)" }}>
                  <div>
                    <div className="card-title" style={{ fontSize: "14px" }}>Respuestas Automáticas</div>
                    <div className="card-description" style={{ fontSize: "12px", marginTop: "4px" }}>La IA sugiere turnos y responde consultas en segundos.</div>
                  </div>
                  <button
                    onClick={() => setAutoReply(!autoReply)}
                    style={{
                      width: "48px", height: "24px", borderRadius: "20px", border: "none",
                      background: autoReply ? "var(--primary)" : "var(--text-muted)",
                      position: "relative", cursor: "pointer", transition: "all 0.3s ease"
                    }}
                  >
                    <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "white", position: "absolute", top: "3px", left: autoReply ? "27px" : "3px", transition: "all 0.3s ease" }} />
                  </button>
                </div>

                <label className="card-kicker" style={{ display: "block", marginBottom: "12px", fontSize: "8px" }}>Motor IA</label>
                <select className="glass-select" value={aiModel} onChange={(e)=>setAiModel(e.target.value)}>
                   <option value="luxury-gpt">SendMe Luxury GPT v4</option>
                   <option value="friendly-llama">SendMe Friendly Edition v2</option>
                </select>
              </div>
            )}

            {(activeSection === "Canales" || activeSection === "Credenciales") && (
              <div className="glass-strong" style={{ padding: "32px", borderRadius: "24px" }}>
                <div className="card-kicker" style={{ marginBottom: "24px" }}>WhatsApp Business API</div>
                <p className="card-description" style={{ marginBottom: "24px", lineHeight: 1.6, fontSize: "13px" }}>Usa esta credencial para conectar tu webhook con el proveedor oficial.</p>
                <div style={{ display: "flex", gap: "12px" }}>
                   <input className="glass-input" readOnly value="sk_sendme_beauty_99201a0cb" style={{ fontFamily: "monospace", fontSize: "13px" }} />
                   <button onClick={handleCopy} className="primary-button" style={{ background: "var(--text-primary)", whiteSpace: "nowrap" }}>
                      {copied ? "✦ COPIADO" : "COPIAR"}
                   </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </AppShell>
  );
}
