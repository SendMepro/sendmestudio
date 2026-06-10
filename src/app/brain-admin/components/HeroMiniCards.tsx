"use client";

import { Brain, Heart, Star, Target, Users } from "lucide-react";
import styles from "../brain-admin.module.css";

interface LearningMetrics {
  brainConfidence: number;
  estiloAprendido: number;
  talentoEquipo: number;
  satisfaccionSocial: number;
  oportunidades: number;
}

interface HeroMiniCardsProps {
  learningMetrics: LearningMetrics;
}

export function HeroMiniCards({ learningMetrics: lm }: HeroMiniCardsProps) {
  return (
    <section className={styles.hero}>
      <div className={styles.heroTitle}>
        <span>Sistema de aprendizaje del negocio</span>
        <h1>Brain Learning Center</h1>
        <p>Todo lo que el Brain ha aprendido de tu negocio.</p>
      </div>
      <div className={styles.heroCards}>
        <div className={styles.heroMiniCard} data-color="purple">
          <Brain size={22} strokeWidth={1.6} className={styles.brainGlowIcon} />
          <strong>{lm.brainConfidence}%</strong>
          <span>Confianza del Brain</span>
        </div>
        <div className={styles.heroMiniCard} data-color="blue">
          <Star size={22} strokeWidth={1.6} />
          <strong>{lm.estiloAprendido}%</strong>
          <span>Estilo aprendido</span>
        </div>
        <div className={styles.heroMiniCard} data-color="green">
          <Users size={22} strokeWidth={1.6} />
          <strong>{lm.talentoEquipo}%</strong>
          <span>Talento del equipo</span>
        </div>
        <div className={styles.heroMiniCard} data-color="pink">
          <Heart size={22} strokeWidth={1.6} />
          <strong>{lm.satisfaccionSocial}%</strong>
          <span>Satisfacción social</span>
        </div>
        <div className={styles.heroMiniCard} data-color="amber">
          <Target size={22} strokeWidth={1.6} />
          <strong>{lm.oportunidades}</strong>
          <span>Oportunidades detectadas</span>
        </div>
      </div>
    </section>
  );
}
