"use client";

import type { KnowledgeBundle } from "../../api/knowledge/store";
import styles from "../knowledge.module.css";

export function KnowledgeHoursForm({
  businessHours,
  updateSection,
}: {
  businessHours: KnowledgeBundle["businessHours"];
  updateSection: <T extends keyof KnowledgeBundle>(section: T, value: KnowledgeBundle[T]) => void;
}) {
  return (
    <section className={styles.contentCard}>
      <div className={styles.sectionHead}>
        <h3>Horarios</h3>
        <span>15%</span>
      </div>
      <div className={styles.hoursGrid}>
        {businessHours.weeklyHours.map((item, index) => (
          <div key={item.day} className={styles.hourRow}>
            <strong>{item.day}</strong>
            <input
              value={item.open}
              onChange={(event) => {
                const weeklyHours = [...businessHours.weeklyHours];
                weeklyHours[index] = { ...item, open: event.target.value };
                updateSection("businessHours", { ...businessHours, weeklyHours });
              }}
            />
            <input
              value={item.close}
              onChange={(event) => {
                const weeklyHours = [...businessHours.weeklyHours];
                weeklyHours[index] = { ...item, close: event.target.value };
                updateSection("businessHours", { ...businessHours, weeklyHours });
              }}
            />
            <label className={styles.checkField}>
              <input
                checked={item.closed}
                onChange={(event) => {
                  const weeklyHours = [...businessHours.weeklyHours];
                  weeklyHours[index] = { ...item, closed: event.target.checked };
                  updateSection("businessHours", { ...businessHours, weeklyHours });
                }}
                type="checkbox"
              />
              Cerrado
            </label>
          </div>
        ))}
      </div>
      <div className={styles.fieldGrid}>
        <label className={styles.field}>
          <span>Pausa almuerzo</span>
          <input
            value={businessHours.lunchBreak}
            onChange={(event) =>
              updateSection("businessHours", { ...businessHours, lunchBreak: event.target.value })
            }
          />
        </label>
        <label className={styles.field}>
          <span>Última hora aceptada</span>
          <input
            value={businessHours.lastAcceptedTime}
            onChange={(event) =>
              updateSection("businessHours", { ...businessHours, lastAcceptedTime: event.target.value })
            }
          />
        </label>
        <label className={styles.fieldWide}>
          <span>Política de atraso</span>
          <textarea
            value={businessHours.latePolicy}
            onChange={(event) =>
              updateSection("businessHours", { ...businessHours, latePolicy: event.target.value })
            }
          />
        </label>
      </div>
    </section>
  );
}
