"use client";

import { useState } from "react";
import AppShell from "../components/AppShell";
import { 
  BookOpen, 
  Mic, 
  CheckCircle2, 
  Brain,
  ShieldCheck,
  Clipboard,
  Zap,
  TrendingUp,
  Award,
  Star,
  ChevronRight
} from "lucide-react";

const SECTIONS = [
  { id: "vocabulary", label: "Vocabulary", icon: BookOpen },
  { id: "brand-voice", label: "Brand Voice", icon: Mic },
  { id: "protocols", label: "Muse Protocols", icon: ShieldCheck },
  { id: "scripts", label: "Scripts", icon: Clipboard },
  { id: "language", label: "Luxury Language", icon: CheckCircle2 },
  { id: "standards", label: "Experience Stds", icon: Award },
  { id: "phrases", label: "Phrase Library", icon: Star },
  { id: "metrics", label: "Training Metrics", icon: TrendingUp },
  { id: "practice", label: "Daily Practice", icon: Zap },
  { id: "ai-coach", label: "AI Coach", icon: Brain },
];

const VOCAB_CARDS = [
  { term: "Muse", def: "Clienta de alto valor e inspiración.", context: "VIP & Emotional", img: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=800" },
  { term: "Atelier", def: "Espacio de creación y diseño.", context: "Workspace", img: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800" },
  { term: "Ritual", def: "Experiencia sensorial y bienestar.", context: "Services", img: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=800" },
  { term: "Signature", def: "Técnica exclusiva de la casa.", context: "Expertise", img: "https://images.unsplash.com/photo-1559599101-f09722fb4948?auto=format&fit=crop&q=80&w=800" },
  { term: "Curaduría", def: "Selección experta personalizada.", context: "Consulting", img: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=800" },
  { term: "Salon", def: "Identidad elevada del salón.", context: "Brand", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800" },
];

const BRAND_VOICE = [
  { 
    pillar: "Confiado y refinado", 
    correct: "Nuestro atelier crea transformaciones que respetan la integridad capilar.",
    incorrect: "Somos los mejores, nadie lo hace como nosotros.",
    ai: "La confianza surge del respeto técnico, no de la jactancia."
  },
  { 
    pillar: "Cálido y profesional", 
    correct: "Es un placer acompañarte en esta evolución.",
    incorrect: "Hola, siéntate, ¿qué te hacemos?",
    ai: "La calidez editorial invita, la informalidad resta autoridad."
  },
  { 
    pillar: "Preciso y evocador", 
    correct: "Este tono captura la luz con matices dorados.",
    incorrect: "Es un color naranja-rojizo nivel 7.",
    ai: "El tecnicismo informa, la evocación vende el sueño."
  },
];

const HERO_MEDIA: Record<string, { image: string; subtitle: string }> = {
  vocabulary: {
    image:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=1600",
    subtitle:
      "Curated language, salon vocabulary and elevated expressions for every luxury beauty interaction.",
  },
  "brand-voice": {
    image:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=1600",
    subtitle:
      "Editorial language, emotional precision and salon refinement for every muse interaction.",
  },
  protocols: {
    image:
      "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=1600",
    subtitle:
      "Structured rituals, premium cadence and signature care flows for every client moment.",
  },
  scripts: {
    image:
      "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=1600",
    subtitle:
      "Luxury-ready scripts designed to sound warm, polished and naturally persuasive.",
  },
  language: {
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=1600",
    subtitle:
      "A selective lexicon of soft power, texture and emotional beauty storytelling.",
  },
  standards: {
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1600",
    subtitle:
      "House standards that keep every experience poised, precise and unmistakably premium.",
  },
  phrases: {
    image:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=1600",
    subtitle:
      "Ready-to-use expressions with elegance, clarity and editorial warmth built in.",
  },
  metrics: {
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1600",
    subtitle:
      "Refinement signals and training markers to elevate every concierge interaction.",
  },
  practice: {
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=1600",
    subtitle:
      "Daily repetition prompts that sharpen luxury fluency and confident delivery.",
  },
  "ai-coach": {
    image:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&q=80&w=1600",
    subtitle:
      "An editorial co-pilot for polishing tone, salon phrasing and premium consistency.",
  },
};

const BRAND_VOICE_FACE =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400";

export default function EditorialPage() {
  const [activeTab, setActiveTab] = useState("vocabulary");
  const activeSection = SECTIONS.find((section) => section.id === activeTab);
  const heroMedia = HERO_MEDIA[activeTab] ?? HERO_MEDIA.vocabulary;

  return (
    <AppShell>
    <div className="editorial-page">
      {/* 2. EDITORIAL MENU â€” RESET: Sans-Only Clean Typography */}
      <div className="editorial-menu-panel editorial-menu" style={{ padding: "32px 16px" }}>
        <div style={{ padding: "0 0 24px", paddingLeft: "12px" }}>
          <div className="editorial-menu-subtitle">Studio Vision</div>
          <h1 className="editorial-menu-title">Editorial OS</h1>
        </div>

        <div className="editorial-menu-list">
          {SECTIONS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`editorial-menu-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. EDITORIAL CONTENT (Hero + Support) */}
      <div className="editorial-main-panel" style={{ background: "var(--bg-glass)" }}>
        {activeTab !== "vocabulary" && (
          <header className="editorial-hero-card">
              <div
                className="editorial-hero-media"
                style={{ backgroundImage: `url(${heroMedia.image})` }}
              />
              <div className="editorial-hero-overlay" />
              <div className="editorial-hero-content">
                  <div className="editorial-hero-meta">
                      <span className="editorial-hero-kicker">Salon Editorial</span>
                      <span className="editorial-hero-module">Module 02</span>
                  </div>
                  <div className="panel-title editorial-hero-title">{activeSection?.label}</div>
                  <div className="editorial-hero-subcopy">{heroMedia.subtitle}</div>
              </div>
              <div className="editorial-hero-badge">SendMe Studio</div>
          </header>
        )}

        <div className="editorial-main-scroll">
          {/* VOCABULARY SECTION â€” RESET: Approved Editorial Cards */}
          {activeTab === "vocabulary" && (
            <div className="vocabulary-card-grid">
              {VOCAB_CARDS.map((card, i) => (
                <div 
                  key={i} 
                  className="vocabulary-editorial-card interactive"
                >
                  <div
                    className="vocabulary-bg"
                    style={{ backgroundImage: `url(${card.img})` }}
                  />
                  <div className="vocabulary-overlay" />

                  <div className="vocabulary-content-zone">
                    <span className="vocabulary-pill">Atelier Term</span>
                    <h3 className="vocabulary-title">{card.term}</h3>
                    <p className="vocabulary-subtitle">{card.def}</p>
                  </div>
                  
                  <div className="vocabulary-footer-zone">
                    <div className="vocabulary-footer-score-block">
                      <strong className="vocabulary-footer-score">A+</strong>
                      <span className="vocabulary-footer-label">EXPERTISE</span>
                    </div>
                    <div className="vocabulary-footer-main-block">
                      <strong className="vocabulary-footer-main">Editorial Premium</strong>
                      <span className="vocabulary-footer-label">MUSE RANK</span>
                    </div>
                    <button className="vocabulary-footer-icon" type="button">
                      <ChevronRight size={18} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* BRAND VOICE SECTION */}
          {activeTab === "brand-voice" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
               {BRAND_VOICE.map((item, i) => (
                 <div key={i} className="level-support" style={{ padding: "32px", background: "var(--bg-glass-strong)", borderRadius: "24px", border: "1px solid var(--border-glass)", flexDirection: "column", alignItems: "flex-start", gap: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "baseline" }}>
                        <h3 className="card-title" style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-primary)" }}>{item.pillar}</h3>
                        <div className="card-kicker" style={{ fontSize: "9px", color: "var(--text-muted)" }}>PILAR 0{i+1}</div>
                    </div>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 76px 1fr", gap: "16px", width: "100%", alignItems: "center" }}>
                       <div style={{ padding: "18px", background: "var(--bg-base)", borderRadius: "16px", border: "1px solid var(--border-glass)" }}>
                          <div className="card-kicker" style={{ fontSize: "9px", color: "var(--primary)", marginBottom: "12px" }}>Salon Standard</div>
                          <p className="body" style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>{item.correct}</p>
                       </div>
                       <div
                         style={{
                           width: "76px",
                           height: "76px",
                           borderRadius: "999px",
                           backgroundImage: `linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04)), url('${BRAND_VOICE_FACE}')`,
                           backgroundSize: "cover",
                           backgroundPosition: "center",
                           border: "1px solid rgba(255,255,255,.42)",
                           boxShadow: "0 18px 40px rgba(40,30,80,.12)",
                           justifySelf: "center",
                         }}
                       />
                       <div style={{ padding: "18px", background: "rgba(0,0,0,0.02)", borderRadius: "16px", border: "1px dashed var(--border-glass)" }}>
                          <div className="card-kicker" style={{ fontSize: "9px", color: "var(--text-muted)", marginBottom: "12px" }}>Correction Needed</div>
                          <p className="body" style={{ fontSize: "14px", color: "var(--text-secondary)", fontStyle: "italic" }}>{item.incorrect}</p>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. MICRO INSIGHT RAIL (Level 3 Utility) */}
      <div className="editorial-right-panel micro-insight-rail" style={{ backgroundColor: "transparent", borderLeft: "1px solid var(--border-glass)" }}>
        <div className="editorial-right-scroll">
          <div className="level-utility" style={{ marginBottom: "36px", padding: "26px", background: "var(--bg-glass-strong)", borderRadius: "22px", border: "1px solid var(--border-glass)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <Zap size={14} color="var(--primary)" fill="var(--primary)" strokeWidth={0} />
                <span className="micro-label" style={{ marginBottom: 0, fontWeight: 700 }}>STUDIO EVOLUTION</span>
              </div>
              <div style={{ height: "8px", width: "100%", background: "var(--bg-base)", borderRadius: "999px", marginBottom: "16px", overflow: "hidden", border: "1px solid var(--border-glass)" }}>
                <div style={{ height: "100%", width: "78%", background: "var(--primary)" }} />
              </div>
              <div className="small" style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>78% System Mastery</div>
          </div>

          <div className="level-utility" style={{ padding: "26px", background: "var(--bg-glass-strong)", borderRadius: "22px", border: "1px solid var(--border-glass)" }}>
              <span className="micro-label" style={{ marginBottom: "22px", display: "block" }}>PHRASE LIBRARY</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {[
                      "He curado esta selección para ti.",
                      "Tu transformación técnica.",
                      "Enfoque signature.",
                  ].map((phrase, i) => (
                      <div key={i} className="level-utility interactive" style={{ padding: "18px 18px", background: "var(--bg-base)", border: "1px solid var(--border-glass)", borderRadius: "14px" }}>
                          <p className="body" style={{ fontSize: "14px", lineHeight: 1.55, fontWeight: 500, color: "var(--text-primary)" }}>&quot;{phrase}&quot;</p>
                      </div>
                  ))}
              </div>
          </div>
        </div>
      </div>
    </div>
    </AppShell>
  );
}
