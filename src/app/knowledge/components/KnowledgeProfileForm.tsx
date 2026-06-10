"use client";

import type { KnowledgeBundle } from "../../api/knowledge/store";
import styles from "../knowledge.module.css";

export function KnowledgeProfileForm({
  salonProfile,
  updateProfile,
}: {
  salonProfile: KnowledgeBundle["salonProfile"];
  updateProfile: (field: keyof KnowledgeBundle["salonProfile"], value: string) => void;
}) {
  return (
    <section className={styles.contentCard}>
      <div className={styles.sectionHead}>
        <h3>Perfil del salón</h3>
        <span>15%</span>
      </div>
      <div className={styles.fieldGrid}>
        {([
          ["salonName", "Nombre del salón"],
          ["address", "Dirección"],
          ["city", "Ciudad"],
          ["phone", "Teléfono"],
          ["connectedWhatsApp", "WhatsApp conectado"],
          ["instagram", "Instagram"],
          ["website", "Sitio web"],
          ["salonType", "Tipo de salón"],
        ] as const).map(([field, label]) => (
          <label key={field} className={styles.field}>
            <span>{label}</span>
            <input
              value={salonProfile[field]}
              onChange={(event) => updateProfile(field, event.target.value)}
            />
          </label>
        ))}
        <label className={styles.fieldWide}>
          <span>Tono de marca</span>
          <textarea
            value={salonProfile.brandTone}
            onChange={(event) => updateProfile("brandTone", event.target.value)}
          />
        </label>
        <label className={styles.fieldWide}>
          <span>Descripción corta</span>
          <textarea
            value={salonProfile.shortDescription}
            onChange={(event) => updateProfile("shortDescription", event.target.value)}
          />
        </label>
        <label className={styles.fieldWide}>
          <span>Promesa principal</span>
          <textarea
            value={salonProfile.mainPromise}
            onChange={(event) => updateProfile("mainPromise", event.target.value)}
          />
        </label>
      </div>
    </section>
  );
}
