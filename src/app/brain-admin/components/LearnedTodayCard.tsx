"use client";

import { Lightbulb } from "lucide-react";
import styles from "../brain-admin.module.css";

interface LearnedToday {
  title: string;
  signals: string[];
  emotions: string[];
  insights: string[];
}

interface LearnedTodayCardProps {
  learnedToday: LearnedToday;
}

export function LearnedTodayCard({ learnedToday }: LearnedTodayCardProps) {
  return (
    <article className={styles.learnedToday}>
      <div className={styles.cardHeader}>
        <div>
          <span>Último aprendizaje</span>
          <h2>El Brain aprendió hoy</h2>
        </div>
        <Lightbulb size={18} strokeWidth={1.7} />
      </div>
      <div className={styles.learnedTodayBody}>
        <div className={styles.learnedTodayItem}>
          <strong>Archivo</strong>
          <span>{learnedToday.title}</span>
        </div>
        {learnedToday.signals.length > 0 ? (
          <div className={styles.learnedTodayItem}>
            <strong>Servicios detectados</strong>
            <div className={styles.signalPills}>
              {learnedToday.signals.map((s, i) => (
                <span key={i} className={styles.signalPill}>{s}</span>
              ))}
            </div>
          </div>
        ) : null}
        {learnedToday.emotions.length > 0 ? (
          <div className={styles.learnedTodayItem}>
            <strong>Emociones detectadas</strong>
            <div className={styles.signalPills}>
              {learnedToday.emotions.map((e, i) => (
                <span key={i} className={styles.signalPill} data-variant="emotion">{e}</span>
              ))}
            </div>
          </div>
        ) : null}
        {learnedToday.insights.length > 0 ? (
          <div className={styles.learnedTodayItem}>
            <strong>Insights generados</strong>
            <ul>
              {learnedToday.insights.map((insight, i) => (
                <li key={i}>{insight}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </article>
  );
}
