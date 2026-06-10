"use client";

import styles from "../knowledge.module.css";

export function KnowledgeRightPanel({
  moduleWeights,
}: {
  moduleWeights: readonly { key: string; label: string; weight: number }[];
}) {
  return (
    <aside className={styles.rightPanel}>
      <section className={styles.nextStepCard}>
        <span>Recommended next step</span>
        <h3>Completa servicios y FAQs primero</h3>
        <p>
          Eso desbloquea respuestas IA, support cards, booking conversacional y
          campañas con menos improvisación.
        </p>
      </section>

      <section className={styles.weightCard}>
        {moduleWeights.map((module) => (
          <div key={module.key} className={styles.weightRow}>
            <span>{module.label}</span>
            <strong>{module.weight}%</strong>
          </div>
        ))}
      </section>
    </aside>
  );
}
