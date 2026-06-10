"use client";

import AIBadge from "../components/AIBadge";
import AppShell from "../components/AppShell";
import styles from "./studio-pulse.module.css";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Camera,
  CheckCircle2,
  Clock3,
  MessageSquareQuote,
  Mic,
  Paperclip,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  TriangleAlert,
  UserRound,
  WandSparkles,
} from "lucide-react";

const pulseSignals = [
  {
    section: "INCIDENTS",
    title: "Atraso estilista premium",
    summary: "Coloración signature inició 18 min tarde en cabin 02.",
    tone: "amber",
    priority: "High",
    when: "10:12 hrs",
    owner: "Sofía",
    state: "Mitigated",
    ai: "Agregar buffer de 15 min entre coloraciones premium.",
  },
  {
    section: "CLIENT FEEDBACK",
    title: "Más privacidad en lavado",
    summary: "Clienta VIP mencionó que desea una experiencia más reservada en horas peak.",
    tone: "pearl",
    priority: "Pattern",
    when: "Hoy",
    owner: "Concierge",
    state: "Observed",
    ai: "Mover rituales premium a slots con menor tráfico y reforzar cortinas acústicas.",
  },
  {
    section: "STUDIO SUGGESTIONS",
    title: "Café premium en recepción",
    summary: "Equipo propone elevar la espera con café de especialidad y vajilla más cálida.",
    tone: "lavender",
    priority: "Culture",
    when: "Ayer",
    owner: "Front Desk",
    state: "Review",
    ai: "Piloto de 7 días con menú corto y medición de satisfacción post check-in.",
  },
];

const timelineItems = [
  {
    category: "INCIDENTS",
    title: "Producto agotado",
    text: "Olaplex No.3 quedó bajo mínimo antes del bloque de tarde.",
    time: "08:40",
    by: "Backbar",
    impact: "2 servicios en riesgo",
    status: "Resolved",
    icon: AlertTriangle,
  },
  {
    category: "CLIENT FEEDBACK",
    title: "Amó el masaje capilar",
    text: "Feedback espontáneo de clienta premium tras ritual de hidratación.",
    time: "11:18",
    by: "Atelier",
    impact: "Upsell opportunity",
    status: "Captured",
    icon: MessageSquareQuote,
  },
  {
    category: "STUDIO SUGGESTIONS",
    title: "Mejorar protocolo WhatsApp",
    text: "Equipo propone tono más cálido y tiempos de respuesta más claros.",
    time: "13:05",
    by: "Concierge",
    impact: "Experience uplift",
    status: "In review",
    icon: Mic,
  },
];

const aiObservations = [
  {
    title: "Balayage VIP responde mejor después de las 18:00 hrs.",
    detail: "La IA detecta mejor tasa de confirmación cuando la propuesta se envía al cierre de jornada.",
    stat: "+21%",
  },
  {
    title: "“Espera” aparece 28% más esta semana.",
    detail: "Se concentra en reservas premium de coloración y check-ins entre 17:00 y 19:00.",
    stat: "28%",
  },
  {
    title: "Alta afinidad hacia rituales de hidratación profunda.",
    detail: "Las clientas que mencionan brillo y suavidad aceptan mejor upgrades sensoriales.",
    stat: "Top insight",
  },
];

const feedbackCards = [
  {
    quote: "Muy feliz con el resultado y la calma del espacio.",
    emotion: "Delight",
    risk: "Low",
    opportunity: "Solicitar review + post ritual content",
  },
  {
    quote: "Esperó demasiado antes del diagnóstico inicial.",
    emotion: "Friction",
    risk: "Medium",
    opportunity: "Ajustar recepción y buffer premium",
  },
  {
    quote: "Quiere más privacidad durante el secado final.",
    emotion: "Sensitivity",
    risk: "Elevated",
    opportunity: "Rediseñar ubicación de finishing chair",
  },
];

export default function StudioPulsePage() {
  return (
    <AppShell>
    <div className={styles.page}>
      <aside className={styles.signalPanel}>
        <div className={styles.panelHeader}>
          <div className={styles.eyebrow}>Luxury Salon Intelligence OS</div>
          <h1 className={styles.panelTitle}>Studio Pulse</h1>
          <p className={styles.panelCopy}>
            Incidencias, feedback, mejoras y alertas IA en un solo flujo operativo.
          </p>
        </div>

        <div className={styles.signalScroll}>
          {pulseSignals.map((signal) => (
            <article key={signal.title} className={styles.signalCard} data-tone={signal.tone}>
              <div className={styles.signalTop}>
                <span className={styles.signalSection}>{signal.section}</span>
                <span className={styles.signalPriority}>{signal.priority}</span>
              </div>

              <h2 className={styles.signalTitle}>{signal.title}</h2>
              <p className={styles.signalSummary}>{signal.summary}</p>

              <div className={styles.signalMeta}>
                <span>{signal.when}</span>
                <span>{signal.owner}</span>
                <span>{signal.state}</span>
              </div>

              <div className={styles.signalAi}>
                <Sparkles size={13} strokeWidth={1.8} />
                <span>{signal.ai}</span>
              </div>
            </article>
          ))}
        </div>
      </aside>

      <main className={styles.mainPanel}>
        <section className={styles.heroCard}>
          <div className={styles.heroMetaRow}>
            <span className={styles.heroKicker}>AI OBSERVATIONS</span>
            <div className={styles.heroBadge}>
              <AIBadge />
              <Activity size={12} strokeWidth={1.8} />
              <span>Live intelligence</span>
            </div>
          </div>

          <h2 className={styles.heroTitle}>Studio Pulse convierte señales suaves en decisiones premium.</h2>
          <p className={styles.heroCopy}>
            La IA observa tiempos, conversaciones, reservas, cancelaciones y lenguaje frecuente para detectar riesgos, oportunidades y mejoras reales del salón.
          </p>

          <div className={styles.heroStats}>
            {aiObservations.map((item) => (
              <article key={item.title} className={styles.observationCard}>
                <div className={styles.observationStat}>{item.stat}</div>
                <h3 className={styles.observationTitle}>{item.title}</h3>
                <p className={styles.observationDetail}>{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.timelinePanel}>
          <div className={styles.sectionHeading}>
            <div>
              <div className={styles.sectionKicker}>Timeline</div>
              <h2 className={styles.sectionTitle}>Qué ocurrió, quién lo resolvió y qué impacto dejó.</h2>
            </div>
            <button className={styles.softButton} type="button">
              <Clock3 size={14} strokeWidth={1.8} />
              <span>Today</span>
            </button>
          </div>

          <div className={styles.timelineList}>
            {timelineItems.map((item) => {
              const Icon = item.icon;

              return (
                <article key={item.title} className={styles.timelineItem}>
                  <div className={styles.timelineMarker}>
                    <Icon size={15} strokeWidth={1.7} />
                  </div>

                  <div className={styles.timelineContent}>
                    <div className={styles.timelineTop}>
                      <span className={styles.timelineCategory}>{item.category}</span>
                      <span className={styles.timelineTime}>{item.time}</span>
                    </div>
                    <h3 className={styles.timelineTitle}>{item.title}</h3>
                    <p className={styles.timelineText}>{item.text}</p>
                    <div className={styles.timelineFooter}>
                      <span>{item.by}</span>
                      <span>{item.impact}</span>
                      <span>{item.status}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className={styles.feedbackPanel}>
          <div className={styles.sectionHeading}>
            <div>
              <div className={styles.sectionKicker}>Client Feedback</div>
              <h2 className={styles.sectionTitle}>La voz del cliente, leída con sensibilidad operacional.</h2>
            </div>
          </div>

          <div className={styles.feedbackGrid}>
            {feedbackCards.map((item) => (
              <article key={item.quote} className={styles.feedbackCard}>
                <div className={styles.feedbackQuoteMark}>“</div>
                <p className={styles.feedbackQuote}>{item.quote}</p>
                <div className={styles.feedbackMeta}>
                  <span>Emotion: {item.emotion}</span>
                  <span>Risk: {item.risk}</span>
                </div>
                <div className={styles.feedbackOpportunity}>
                  <ArrowUpRight size={12} strokeWidth={1.8} />
                  <span>{item.opportunity}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <aside className={styles.actionRail}>
        <section className={styles.composerCard}>
          <div className={styles.sectionKicker}>Create Note</div>
          <h2 className={styles.actionTitle}>Nueva incidencia u observación</h2>

          <div className={styles.fieldGrid}>
            <label className={styles.fieldBlock}>
              <span className={styles.fieldLabel}>Categoría</span>
              <select className={styles.glassInput} defaultValue="INCIDENTS">
                <option>INCIDENTS</option>
                <option>CLIENT FEEDBACK</option>
                <option>STUDIO SUGGESTIONS</option>
                <option>AI OBSERVATIONS</option>
              </select>
            </label>

            <label className={styles.fieldBlock}>
              <span className={styles.fieldLabel}>Prioridad</span>
              <select className={styles.glassInput} defaultValue="Soft high">
                <option>Soft high</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </label>
          </div>

          <label className={styles.fieldBlock}>
            <span className={styles.fieldLabel}>Nota interna</span>
            <textarea
              className={styles.glassTextarea}
              defaultValue="Clienta premium esperó demasiado antes del diagnóstico. IA sugiere agregar buffer de 15 min entre coloraciones premium."
            />
          </label>

          <div className={styles.toggleRow}>
            <button className={styles.softToggle} type="button">
              <ShieldAlert size={13} strokeWidth={1.8} />
              <span>Modo silencioso / anónimo</span>
            </button>
            <button className={styles.softToggle} type="button">
              <Paperclip size={13} strokeWidth={1.8} />
              <span>Adjuntar foto</span>
            </button>
          </div>

          <div className={styles.aiSummaryCard}>
            <div className={styles.aiSummaryTop}>
              <WandSparkles size={13} strokeWidth={1.8} />
              <span>IA resume + recomienda</span>
            </div>
            <p className={styles.aiSummaryText}>
              Riesgo de percepción lenta en servicios premium al cierre del día. Recomendación IA: mover diagnósticos largos a slots con buffer y anticipar bienvenida desde concierge.
            </p>
          </div>

          <div className={styles.actionButtons}>
            <button className={styles.primaryButton} type="button">
              <CheckCircle2 size={14} strokeWidth={1.8} />
              <span>Guardar pulse</span>
            </button>
            <button className={styles.secondaryButton} type="button">
              <Camera size={14} strokeWidth={1.8} />
              <span>Adjuntar evidencia</span>
            </button>
          </div>
        </section>

        <section className={styles.premiumCard}>
          <div className={styles.sectionKicker}>Premium Value</div>
          <h2 className={styles.actionTitle}>Esto ya no es mensajería. Es AI Salon Operating System.</h2>

          <div className={styles.valueList}>
            <div className={styles.valueItem}>
              <TriangleAlert size={14} strokeWidth={1.8} />
              <span>Incidencias reales antes de que escalen.</span>
            </div>
            <div className={styles.valueItem}>
              <UserRound size={14} strokeWidth={1.8} />
              <span>Feedback cliente convertido en decisiones premium.</span>
            </div>
            <div className={styles.valueItem}>
              <TrendingUp size={14} strokeWidth={1.8} />
              <span>Observaciones IA que justifican planes higher tier.</span>
            </div>
          </div>
        </section>
      </aside>
    </div>
    </AppShell>
  );
}
