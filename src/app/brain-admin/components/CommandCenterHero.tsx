"use client";

import { Brain, Cpu, Activity, Clock, Zap, Shield, Wifi } from "lucide-react";
import styles from "../brain-admin.module.css";

interface LearningMetrics {
  brainConfidence: number;
  estiloAprendido: number;
  talentoEquipo: number;
  satisfaccionSocial: number;
  oportunidades: number;
}

interface SystemHealth {
  uptime: string;
  agentsActive: number;
  agentsTotal: number;
  memoryUsed: string;
  memoryTotal: string;
  lastSync: string;
}

interface CommandCenterHeroProps {
  learningMetrics: LearningMetrics;
  systemHealth?: SystemHealth;
}

const defaultHealth: SystemHealth = {
  uptime: "—",
  agentsActive: 0,
  agentsTotal: 8,
  memoryUsed: "0 MB",
  memoryTotal: "5120 MB",
  lastSync: "—",
};

export function CommandCenterHero({
  learningMetrics: lm,
  systemHealth = defaultHealth,
}: CommandCenterHeroProps) {
  return (
    <header className={styles.commandCenter}>
      {/* Background decorative elements */}
      <div className={styles.ccGrid} aria-hidden="true" />
      <div className={styles.ccGlow} aria-hidden="true" />

      <div className={styles.ccTop}>
        {/* Left: Identity + status */}
        <div className={styles.ccIdentity}>
          <div className={styles.ccBrainIcon}>
            <Brain size={32} strokeWidth={1.2} />
            <span className={styles.ccPulseDot} />
          </div>
          <div>
            <span className={styles.ccEyebrow}>SendMe Studio · Centro de Mando</span>
            <h1 className={styles.ccTitle}>Brain Command Center</h1>
            <p className={styles.ccSubtitle}>
              Supervisión estratégica del sistema de inteligencia artificial del salón
            </p>
          </div>
        </div>

        {/* Right: System health strip */}
        <div className={styles.ccSystemStrip}>
          <div className={styles.ccHealthItem}>
            <Cpu size={14} strokeWidth={1.5} />
            <div>
              <span className={styles.ccHealthLabel}>Up-time</span>
              <span className={styles.ccHealthValue}>{systemHealth.uptime}</span>
            </div>
          </div>
          <div className={styles.ccDivider} />
          <div className={styles.ccHealthItem}>
            <Activity size={14} strokeWidth={1.5} />
            <div>
              <span className={styles.ccHealthLabel}>Agentes activos</span>
              <span className={styles.ccHealthValue}>
                <strong className={styles.ccAgentsActive}>{systemHealth.agentsActive}</strong>
                <span className={styles.ccAgentsTotal}> / {systemHealth.agentsTotal}</span>
              </span>
            </div>
          </div>
          <div className={styles.ccDivider} />
          <div className={styles.ccHealthItem}>
            <Zap size={14} strokeWidth={1.5} />
            <div>
              <span className={styles.ccHealthLabel}>Memoria</span>
              <span className={styles.ccHealthValue}>{systemHealth.memoryUsed}</span>
            </div>
          </div>
          <div className={styles.ccDivider} />
          <div className={styles.ccHealthItem}>
            <Clock size={14} strokeWidth={1.5} />
            <div>
              <span className={styles.ccHealthLabel}>Última sincronización</span>
              <span className={styles.ccHealthValue}>{systemHealth.lastSync}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Strategic metrics dashboard */}
      <div className={styles.ccMetrics}>
        <div className={styles.ccMetricCard} data-accent="purple">
          <div className={styles.ccMetricIcon}>
            <Brain size={16} strokeWidth={1.6} />
          </div>
          <div className={styles.ccMetricBody}>
            <strong className={styles.ccMetricValue}>{lm.brainConfidence}%</strong>
            <span className={styles.ccMetricLabel}>Confianza del Brain</span>
            <div className={styles.ccMetricBar}>
              <div
                className={styles.ccMetricBarFill}
                style={{ width: `${lm.brainConfidence}%` }}
              />
            </div>
          </div>
        </div>
        <div className={styles.ccMetricCard} data-accent="blue">
          <div className={styles.ccMetricIcon}>
            <Shield size={16} strokeWidth={1.6} />
          </div>
          <div className={styles.ccMetricBody}>
            <strong className={styles.ccMetricValue}>{lm.estiloAprendido}%</strong>
            <span className={styles.ccMetricLabel}>Estilo aprendido</span>
            <div className={styles.ccMetricBar}>
              <div
                className={styles.ccMetricBarFill}
                style={{ width: `${lm.estiloAprendido}%` }}
              />
            </div>
          </div>
        </div>
        <div className={styles.ccMetricCard} data-accent="green">
          <div className={styles.ccMetricIcon}>
            <Wifi size={16} strokeWidth={1.6} />
          </div>
          <div className={styles.ccMetricBody}>
            <strong className={styles.ccMetricValue}>{lm.talentoEquipo}%</strong>
            <span className={styles.ccMetricLabel}>Talento del equipo</span>
            <div className={styles.ccMetricBar}>
              <div
                className={styles.ccMetricBarFill}
                style={{ width: `${lm.talentoEquipo}%` }}
              />
            </div>
          </div>
        </div>
        <div className={styles.ccMetricCard} data-accent="pink">
          <div className={styles.ccMetricIcon}>
            <Activity size={16} strokeWidth={1.6} />
          </div>
          <div className={styles.ccMetricBody}>
            <strong className={styles.ccMetricValue}>{lm.satisfaccionSocial}%</strong>
            <span className={styles.ccMetricLabel}>Satisfacción social</span>
            <div className={styles.ccMetricBar}>
              <div
                className={styles.ccMetricBarFill}
                style={{ width: `${lm.satisfaccionSocial}%` }}
              />
            </div>
          </div>
        </div>
        <div className={styles.ccMetricCard} data-accent="amber">
          <div className={styles.ccMetricIcon}>
            <Zap size={16} strokeWidth={1.6} />
          </div>
          <div className={styles.ccMetricBody}>
            <strong className={styles.ccMetricValue}>{lm.oportunidades}</strong>
            <span className={styles.ccMetricLabel}>Oportunidades detectadas</span>
            <div className={styles.ccMetricBar}>
              <div
                className={styles.ccMetricBarFill}
                style={{ width: `${Math.min(lm.oportunidades * 10, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
