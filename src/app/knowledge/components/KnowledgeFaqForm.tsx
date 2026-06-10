"use client";

import type { KnowledgeBundle } from "../../api/knowledge/store";
import styles from "../knowledge.module.css";

function listText(value: string[]) {
  return value.join(", ");
}

function parseList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function KnowledgeFaqForm({
  faqs,
  updateFaq,
}: {
  faqs: KnowledgeBundle["faqs"];
  updateFaq: (index: number, patch: Partial<KnowledgeBundle["faqs"][number]>) => void;
}) {
  return (
    <section className={styles.contentCard}>
      <div className={styles.sectionHead}>
        <h3>FAQ / Respuestas del salón</h3>
        <span>15%</span>
      </div>
      <div className={styles.cardsGrid}>
        {faqs.map((faq, index) => (
          <article key={faq.question} className={styles.editCard}>
            <input
              value={faq.question}
              onChange={(event) => updateFaq(index, { question: event.target.value })}
            />
            <textarea
              value={faq.answer}
              onChange={(event) => updateFaq(index, { answer: event.target.value })}
            />
            <label>
              Palabras clave
              <input
                value={listText(faq.keywords)}
                onChange={(event) => updateFaq(index, { keywords: parseList(event.target.value) })}
              />
            </label>
            <label className={styles.checkField}>
              <input
                checked={faq.autoReplyAllowed}
                onChange={(event) => updateFaq(index, { autoReplyAllowed: event.target.checked })}
                type="checkbox"
              />
              Respuesta automática permitida
            </label>
          </article>
        ))}
      </div>
    </section>
  );
}
