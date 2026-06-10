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

export function KnowledgeServicesForm({
  services,
  updateService,
}: {
  services: KnowledgeBundle["services"];
  updateService: (index: number, patch: Partial<KnowledgeBundle["services"][number]>) => void;
}) {
  return (
    <section className={styles.contentCard}>
      <div className={styles.sectionHead}>
        <h3>Catálogo de servicios</h3>
        <span>25%</span>
      </div>
      <div className={styles.cardsGrid}>
        {services.map((service, index) => (
          <article key={service.id} className={styles.editCard}>
            <div className={styles.cardTitleRow}>
              <input
                value={service.name}
                onChange={(event) => updateService(index, { name: event.target.value })}
              />
              <span>{service.durationMinutes} min</span>
            </div>
            <textarea
              value={service.description}
              onChange={(event) => updateService(index, { description: event.target.value })}
            />
            <div className={styles.twoCol}>
              <label>
                Desde
                <input
                  type="number"
                  value={service.priceFrom}
                  onChange={(event) => updateService(index, { priceFrom: Number(event.target.value) })}
                />
              </label>
              <label>
                Hasta
                <input
                  type="number"
                  value={service.priceTo}
                  onChange={(event) => updateService(index, { priceTo: Number(event.target.value) })}
                />
              </label>
            </div>
            <label>
              Palabras clave
              <input
                value={listText(service.keywords)}
                onChange={(event) => updateService(index, { keywords: parseList(event.target.value) })}
              />
            </label>
            <label>
              Respuesta sugerida
              <textarea
                value={service.suggestedReply}
                onChange={(event) => updateService(index, { suggestedReply: event.target.value })}
              />
            </label>
          </article>
        ))}
      </div>
    </section>
  );
}
