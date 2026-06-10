"use client";

import type { LucideIcon } from "lucide-react";
import styles from "../knowledge.module.css";

type Module = {
  id: string;
  label: string;
  icon: LucideIcon;
};

export function KnowledgeSidebar({
  modules,
  activeModule,
  score,
  onModuleChange,
}: {
  modules: readonly Module[];
  activeModule: string;
  score: number;
  onModuleChange: (id: string) => void;
}) {
  return (
    <aside className={styles.leftPanel}>
      <div className={styles.titleBlock}>
        <div className={styles.kicker}>Atelier OS</div>
        <h1>Base de conocimiento</h1>
        <p>Fuente maestra para IA, booking, campañas y soporte conversacional.</p>
      </div>

      <div className={styles.scoreCard}>
        <div>
          <span>Base de conocimiento</span>
          <strong>{score}% completo</strong>
        </div>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${score}%` }} />
        </div>
      </div>

      <nav className={styles.moduleNav}>
        {modules.map((module) => {
          const Icon = module.icon;

          return (
            <button
              key={module.id}
              className={styles.moduleButton}
              data-active={activeModule === module.id ? "true" : "false"}
              onClick={() => onModuleChange(module.id)}
              type="button"
            >
              <Icon size={15} strokeWidth={1.6} />
              <span>{module.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
