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

export function KnowledgeTeamForm({
  stylists,
  updateStylist,
}: {
  stylists: KnowledgeBundle["stylists"];
  updateStylist: (index: number, patch: Partial<KnowledgeBundle["stylists"][number]>) => void;
}) {
  return (
    <section className={styles.contentCard}>
      <div className={styles.sectionHead}>
        <h3>Estilistas / Equipo</h3>
        <span>15%</span>
      </div>
      <div className={styles.cardsGrid}>
        {stylists.map((stylist, index) => (
          <article key={stylist.id} className={styles.editCard}>
            <div className={styles.cardTitleRow}>
              <input
                value={stylist.name}
                onChange={(event) => updateStylist(index, { name: event.target.value })}
              />
              <span>{stylist.status}</span>
            </div>
            <input
              value={stylist.role}
              onChange={(event) => updateStylist(index, { role: event.target.value })}
            />
            <label>
              Especialidades
              <input
                value={listText(stylist.specialties)}
                onChange={(event) => updateStylist(index, { specialties: parseList(event.target.value) })}
              />
            </label>
            <label>
              Horario
              <input
                value={stylist.workingHours}
                onChange={(event) => updateStylist(index, { workingHours: event.target.value })}
              />
            </label>
            <textarea
              value={stylist.bioShort}
              onChange={(event) => updateStylist(index, { bioShort: event.target.value })}
            />
          </article>
        ))}
      </div>
    </section>
  );
}
