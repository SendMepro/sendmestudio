"use client";

import type { ElementType } from "react";
import { ShieldCheck } from "lucide-react";
import styles from "../../app/page.module.css";

export interface KpiMetricItem {
  label: string;
  value: string;
  detail: string;
  icon: ElementType;
}

export interface PlatformHealthData {
  score: number;
  status: string;
  detail: string;
}

export interface HomeKpiCardsProps {
  platformHealth: PlatformHealthData;
  kpiMetrics: KpiMetricItem[];
}

/**
 * HomeKpiCards — Platform health card + KPI metrics cards.
 *
 * Phase E-3 extraction from page.tsx lines 1452–1485.
 * Props-only component — all calculations remain in page.tsx.
 */
export default function HomeKpiCards({
  platformHealth,
  kpiMetrics,
}: HomeKpiCardsProps) {
  return (
    <section className={styles.kpiRow}>
      <article className={[styles.kpiMiniCard, styles.platformHealthCard].join(" ")}>
        <div className={styles.kpiIcon}>
          <ShieldCheck size={14} strokeWidth={1.65} />
        </div>
        <div className={styles.kpiMainContent}>
          <div className={styles.kpiLabel}>Salud plataforma</div>
          <div className={styles.kpiValue}>{platformHealth.score}% {platformHealth.status}</div>
        </div>
        <div className={styles.kpiMeta}>
          Plantillas rechazadas · riesgo spam · lectura · respuestas · bloqueos · calidad de entrega
        </div>
        <div className={styles.healthBar}>
          <span style={{ width: `${platformHealth.score}%` }} />
        </div>
        <p className={styles.healthInsight}>{platformHealth.detail}</p>
      </article>
      {kpiMetrics.map((item) => {
        const Icon = item.icon;

        return (
          <article key={item.label} className={styles.kpiMiniCard}>
            <div className={styles.kpiIcon}>
              <Icon size={14} strokeWidth={1.65} />
            </div>
            <div className={styles.kpiMainContent}>
              <div className={styles.kpiLabel}>{item.label}</div>
              <div className={styles.kpiValue}>{item.value}</div>
            </div>
            <div className={styles.kpiMeta}>{item.detail}</div>
          </article>
        );
      })}
    </section>
  );
}
