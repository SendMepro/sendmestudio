"use client";

import type { KnowledgeBundle } from "../../api/knowledge/store";
import styles from "../knowledge.module.css";

export function KnowledgeJsonEditor({
  activeModule,
  availabilityRules,
  bookingRules,
  supportFeedRules,
  mediaLibrary,
  updateSection,
  setSaveState,
}: {
  activeModule: string;
  availabilityRules: KnowledgeBundle["availabilityRules"];
  bookingRules: KnowledgeBundle["bookingRules"];
  supportFeedRules: KnowledgeBundle["supportFeedRules"];
  mediaLibrary: KnowledgeBundle["mediaLibrary"];
  updateSection: <T extends keyof KnowledgeBundle>(section: T, value: KnowledgeBundle[T]) => void;
  setSaveState: (state: string) => void;
}) {
  return (
    <section className={styles.contentCard}>
      <div className={styles.sectionHead}>
        <h3>
          {activeModule === "booking"
            ? "Disponibilidad y reglas de reserva"
            : activeModule === "support"
              ? "Matching del panel de soporte"
              : "Media / Assets de campaña"}
        </h3>
        <span>JSON estructurado</span>
      </div>
      <textarea
        className={styles.jsonEditor}
        value={JSON.stringify(
          activeModule === "booking"
            ? { availabilityRules, bookingRules }
            : activeModule === "support"
              ? supportFeedRules
              : mediaLibrary,
          null,
          2
        )}
        onChange={(event) => {
          try {
            const parsed = JSON.parse(event.target.value);
            if (activeModule === "booking") {
              updateSection("availabilityRules", parsed.availabilityRules ?? availabilityRules);
              updateSection("bookingRules", parsed.bookingRules ?? bookingRules);
            } else if (activeModule === "support") {
              updateSection("supportFeedRules", parsed);
            } else {
              updateSection("mediaLibrary", parsed);
            }
          } catch {
            setSaveState("Invalid JSON");
          }
        }}
      />
    </section>
  );
}
