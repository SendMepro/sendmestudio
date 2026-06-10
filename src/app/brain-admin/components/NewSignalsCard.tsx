"use client";

import { Zap } from "lucide-react";
import styles from "../brain-admin.module.css";

type SignalEntry = {
  id: string;
  category: string;
  title: string;
  impact: number;
  status: string;
  createdAt: string;
  source: string;
};

type NewSignalsCardProps = {
  newSignals: SignalEntry[];
};

export function NewSignalsCard({ newSignals }: NewSignalsCardProps) {
  if (newSignals.length === 0) return null;

  return (
    <article className={styles.newSignalsCard}>
      <div className={styles.cardHeader}>
        <div>
          <span>Alertas inteligentes</span>
          <h2>Nuevas señales detectadas</h2>
        </div>
        <Zap size={18} strokeWidth={1.7} />
      </div>
      <div className={styles.newSignalsList}>
        {newSignals.map((signal) => (
          <div key={signal.id} className={styles.newSignalItem}>
            <div className={styles.newSignalDot} />
            <div className={styles.newSignalBody}>
              <strong>{signal.title}</strong>
              <span>Impacto: {signal.impact}% · {signal.category}</span>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
