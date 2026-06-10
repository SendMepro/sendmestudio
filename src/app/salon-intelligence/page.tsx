"use client";

import AIBadge from "../components/AIBadge";
import AppShell from "../components/AppShell";
import styles from "./salon-intelligence.module.css";

const modules = [
  {
    title: "Luxury Playbook",
    description: "Marcos de acción para elevar ticket, rituales premium y retorno de clientas VIP.",
  },
  {
    title: "Client Journey",
    description: "Lectura estratégica del recorrido completo de cada Muse desde reserva hasta recompra.",
  },
  {
    title: "Concierge Ideas",
    description: "Sugerencias de concierge para mensajes, follow-up y experiencias de alto valor.",
  },
  {
    title: "Seasonal Campaigns",
    description: "Oportunidades narrativas por temporada para activar agenda, color y tratamientos clave.",
  },
  {
    title: "Retention Rituals",
    description: "Secuencias de fidelización para mantener frecuencia, recompra y vínculo editorial.",
  },
  {
    title: "AI Coach",
    description: "Aprendizajes accionables para recepción, estilistas y liderazgo operativo del salón.",
  },
  {
    title: "Salon Chronicle",
    description: "Resumen de patrones, decisiones y señales que explican la evolución del negocio.",
  },
  {
    title: "Emotional Analytics",
    description: "Lecturas de afinidad, sensibilidad y respuesta emocional en clientas de mayor valor.",
  },
  {
    title: "Sensory Profile",
    description: "Preferencias de ambiente, ritual, ritmo y detalle para experiencias más memorables.",
  },
];

const impactItems = [
  "143 clientes asistidos",
  "18 campañas generadas",
  "$1.240.000 CLP en oportunidades detectadas",
  "27 respuestas concierge",
];

export default function SalonIntelligencePage() {
  return (
    <AppShell>
    <div className={styles.page}>
      <div className={styles.content}>
        <main className={styles.mainPanel}>
          <div className={styles.mainScroll}>
            <header className={styles.header}>
              <div className={styles.kicker}>Salon Intelligence</div>
              <h1 className={styles.title}>Salon Intelligence</h1>
              <p className={styles.subtitle}>
                Estrategia, IA y crecimiento para salones premium.
              </p>
            </header>

            <section className={styles.creditsCard}>
              <div className={styles.cardLabel}>Salon Intelligence Credits</div>
              <div className={styles.creditsGrid}>
                <div className={styles.creditPrimary}>
                  <div className={styles.creditValue}>68%</div>
                  <div className={styles.creditMeta}>usado este mes</div>
                </div>
                <div className={styles.creditStat}>
                  <span className={styles.creditStatLabel}>Capacidad restante</span>
                  <strong className={styles.creditStatValue}>3.200 créditos restantes</strong>
                </div>
                <div className={styles.creditStat}>
                  <span className={styles.creditStatLabel}>Próxima renovación</span>
                  <strong className={styles.creditStatValue}>12 días</strong>
                </div>
              </div>
            </section>

            <section className={styles.modulesSection}>
              <div className={styles.sectionLabel}>Strategic Modules</div>
              <div className={styles.modulesGrid}>
                {modules.map((module) => (
                  <article key={module.title} className={styles.moduleCard}>
                    <div className={styles.moduleTitle}>{module.title}</div>
                    <p className={styles.moduleDescription}>{module.description}</p>
                    <div className={styles.moduleActions}>
                      <button className={styles.actionButton} type="button">
                        Apply to Campaign
                      </button>
                      <button className={styles.actionButton} type="button">
                        Generate Example
                      </button>
                      <button className={styles.actionButton} type="button">
                        Save to Playbook
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </main>

        <aside className={styles.rightRail}>
          <div className={styles.rightScroll}>
            <section className={styles.impactCard}>
              <div className={styles.cardHeading}>
                <div className={styles.cardLabel}>AI Impact</div>
                <AIBadge />
              </div>
              <h2 className={styles.impactTitle}>Valor estratégico impulsado por inteligencia.</h2>
              <div className={styles.impactList}>
                {impactItems.map((item) => (
                  <div key={item} className={styles.impactItem}>
                    {item}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </aside>
      </div>
    </div>
    </AppShell>
  );
}
