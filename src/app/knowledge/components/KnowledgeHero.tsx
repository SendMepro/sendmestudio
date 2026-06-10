"use client";

import { CheckCircle2, Save } from "lucide-react";
import styles from "../knowledge.module.css";

export function KnowledgeHero({ saveState }: { saveState: string }) {
  return (
    <header className={styles.heroHeader}>
      <div>
        <div className={styles.kicker}>Sistema concierge IA</div>
        <h2>Base de conocimiento Atelier</h2>
        <p>
          Completa los datos una vez. La IA los usa para responder, vender,
          agendar y sugerir con contexto real.
        </p>
      </div>
      <div className={styles.savePill}>
        {saveState === "Guardado" ? <CheckCircle2 size={14} /> : <Save size={14} />}
        <span>{saveState}</span>
      </div>
    </header>
  );
}
