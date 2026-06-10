"use client";

import type { KnowledgeBundle } from "../../api/knowledge/store";
import styles from "../knowledge.module.css";

function parseList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const aiRuleLabels: Record<string, { label: string; key: string }> = {
  allowedWords: { label: "Palabras permitidas", key: "allowedWords" },
  forbiddenWords: { label: "Palabras prohibidas", key: "forbiddenWords" },
  allowedEmojis: { label: "Emojis permitidos", key: "allowedEmojis" },
  whenToSell: { label: "Cuándo vender", key: "whenToSell" },
  whenNotToSell: { label: "Cuándo no vender", key: "whenNotToSell" },
};

export function KnowledgeAiRulesForm({
  aiRules,
  updateSection,
}: {
  aiRules: KnowledgeBundle["aiRules"];
  updateSection: <T extends keyof KnowledgeBundle>(section: T, value: KnowledgeBundle[T]) => void;
}) {
  return (
    <section className={styles.contentCard}>
      <div className={styles.sectionHead}>
        <h3>Reglas de concierge IA</h3>
        <span>15%</span>
      </div>
      <div className={styles.fieldGrid}>
        {Object.entries(aiRules).map(([key, value]) => {
          const displayLabel = aiRuleLabels[key] ?? { label: key, key };

          return (
            <label key={key} className={styles.fieldWide}>
              <span className={styles.localizedFieldLabel}>
                <strong>{displayLabel.label}</strong>
                <em>{displayLabel.key}</em>
              </span>
              <textarea
                value={Array.isArray(value) ? value.join(", ") : String(value)}
                onChange={(event) =>
                  updateSection("aiRules", {
                    ...aiRules,
                    [key]: Array.isArray(value) ? parseList(event.target.value) : event.target.value,
                  })
                }
              />
            </label>
          );
        })}
      </div>
    </section>
  );
}
