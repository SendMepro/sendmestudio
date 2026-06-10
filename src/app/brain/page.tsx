"use client";

import { useMemo, type ElementType } from "react";
import {
  Activity,
  Brain,
  CircuitBoard,
  Cpu,
  Database,
  FileCode,
  FileText,
  GitBranch,
  HeartPulse,
  Layers,
  MessageCircle,
  Mic,
  Network,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import AppShell from "../components/AppShell";
import { useBrainAgents, type AgentInfo } from "./hooks/useBrainAgents";
import styles from "./brain.module.css";

// ── Agent icon map ──

const AGENT_ICONS: Record<string, ElementType> = {
  SystemSupervisorAgent: Cpu,
  HomeMetricsAgent: Activity,
  HomeAIInsightAgent: Brain,
  HomeLearningAgent: Layers,
  RecoveryAgent: HeartPulse,
  CuratorAgent: FileCode,
  AgentInspector: FileText,
  AgentRegistry: Database,
  BusinessEventBus: MessageCircle,
  HealthCheckAgent: Activity,
  AgentLifecycleAgent: GitBranch,
  HomeOrchestratorAgent: CircuitBoard,
  HomeHealthCheckAgent: Activity,
  HomeDataSourceAgent: Database,
  HomeInspectorAgent: FileText,
  EmotionalSalonOrchestrator: Sparkles,
  IntelligenceLayer: Network,
  KnowledgeBundleAgent: Database,
  KnowledgeCompletionAgent: FileText,
  BrainDataAgent: Database,
  BrainVoiceAgent: Mic,
  BrainNotesAgent: FileText,
  BrainQRTokenAgent: Zap,
  BrainAuthAgent: Users,
};

const DEFAULT_AGENT_ICON = Cpu;

const FOCUS_AGENTS = new Set([
  "SystemSupervisorAgent",
  "HomeMetricsAgent",
  "HomeAIInsightAgent",
  "HomeLearningAgent",
  "RecoveryAgent",
  "CuratorAgent",
  "AgentInspector",
  "BusinessEventBus",
]);

// ── Helpers ──

function statusColor(status: string): string {
  switch (status) {
    case "healthy":  return "#10B981";
    case "degraded": return "#f59e0b";
    case "failed":
    case "unreachable": return "#e74c3c";
    default: return "#94a3b8";
  }
}

function formatUptime(seconds: number): string {
  if (seconds <= 0) return "—";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(" ");
}

function formatTimestamp(ts: string): string {
  if (!ts) return "—";
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString("es-CL", {
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      timeZone: "America/Santiago",
    });
  } catch { return "—"; }
}

function statusLabel(status: string): string {
  switch (status) {
    case "healthy": return "Saludable";
    case "degraded": return "Degradado";
    case "failed": return "Falló";
    case "unreachable": return "Inaccesible";
    default: return "Desconocido";
  }
}

function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    system: "Gobernanza", leaf: "Análisis", skill: "Orquestador",
    section: "Sección", bridge: "Puente", infrastructure: "Infraestructura",
    consumer: "Consumidor", repository: "Repositorio", planned: "Planificado",
  };
  return map[cat] ?? cat;
}

// ── Agent Card ──

function AgentCard({ agent }: { agent: AgentInfo }) {
  const Icon = AGENT_ICONS[agent.name] ?? DEFAULT_AGENT_ICON;
  const color = statusColor(agent.status);

  return (
    <div className={styles.agentCard}>
      <div className={styles.agentCardHeader}>
        <div className={styles.agentName}>
          <Icon size={15} strokeWidth={1.5} className={styles.agentIcon} />
          <span>{agent.name}</span>
        </div>
        <span className={styles.badge} style={{ color, background: `${color}14` }}>
          {statusLabel(agent.status)}
        </span>
      </div>
      <div className={styles.agentCategory}>
        {categoryLabel(agent.category)} · {agent.phase}
      </div>
      <p className={styles.agentDescription}>
        {agent.description || "Sin descripción"}
      </p>
      <div className={styles.agentMeta}>
        <div>
          <div className={styles.metaLabel}>Último ping</div>
          <div className={styles.metaValue}>{formatTimestamp(agent.lastPing)}</div>
        </div>
        <div>
          <div className={styles.metaLabel}>Fallos</div>
          <div className={styles.metaValue}>{agent.consecutiveFailures}</div>
        </div>
        <div>
          <div className={styles.metaLabel}>Registrado</div>
          <div className={styles.metaValue}>{agent.registered ? "Sí" : "No"}</div>
        </div>
        {agent.lastError && (
          <div className={styles.metaFullWidth}>
            <div className={styles.metaLabel}>Último error</div>
            <div className={styles.metaValueError}>{agent.lastError.slice(0, 120)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Orchestration Map ──

function OrchestrationMap() {
  return (
    <div className={styles.orchestrationGrid}>
      <div className={styles.sectionCard}>
        <div className={styles.sectionTitle}>
          <Cpu size={15} strokeWidth={1.5} />
          SystemSupervisorAgent
        </div>
        <div className={styles.treeRoot}>Gobernanza central</div>
        <div className={styles.treeChildren}>
          {[
            "AgentInspector — Inspección de código y registro",
            "HealthCheckAgent — Verificación tsc/build/test",
            "CuratorAgent — Checkpoints y validación de cambios",
            "RecoveryAgent — Restauración vía git restore",
            "AgentLifecycleAgent — Ciclo de vida de 9 estados",
            "BusinessEventBus — Eventos de negocio en memoria",
          ].map((c, i) => (
            <div key={i} className={styles.treeChild}>{c}</div>
          ))}
        </div>
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.sectionTitle}>
          <Network size={15} strokeWidth={1.5} />
          HomeBridge
        </div>
        <div className={styles.treeRoot}>Puente UI → Agentes</div>
        <div className={styles.treeChildren}>
          {[
            "HomeMetricsAgent — Métricas reales (appointments)",
            "HomeAIInsightAgent — Insights de cliente (dossier)",
            "HomeLearningAgent — Eventos de aprendizaje",
            "HomeHealthCheckAgent — Readiness (placeholder)",
            "HomeDataSourceAgent — Mapa de fuentes (metadata)",
            "HomeInspectorAgent — Issues hardcodeados",
            "HomeOrchestratorAgent — Placeholder",
          ].map((c, i) => (
            <div key={i} className={styles.treeChild}>{c}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Status Item ──

function StatusDot({ color }: { color: string }) {
  return <span className={styles.dot} style={{ background: color }} />;
}

// ── Page ──

export default function BrainPage() {
  const { supervisor, agents, businessMetrics, loading, error, lastRefresh } = useBrainAgents();

  const focusAgentsList = useMemo(
    () => agents.filter((a) => FOCUS_AGENTS.has(a.name)), [agents],
  );
  const otherAgentsList = useMemo(
    () => agents.filter((a) => !FOCUS_AGENTS.has(a.name)), [agents],
  );

  return (
    <AppShell>
      <div className={styles.wrapper}>
        <div className={styles.page}>

          {/* ── Loading / Error ── */}
          {loading && (
            <div className={styles.loadingBlock}>Cargando arquitectura de agentes…</div>
          )}
          {error && (
            <div className={styles.errorBlock}>{error}</div>
          )}

          {!loading && !error && (
            <>
              {/* ── Header ── */}
              <header className={styles.header}>
                <div className={styles.headerRow}>
                  <div className={styles.headerLeft}>
                    <div className={styles.headerIcon}>
                      <Brain size={24} strokeWidth={1.5} color="#fff" />
                    </div>
                    <div className={styles.headerTitles}>
                      <span className={styles.headerKicker}>SendMe Studio</span>
                      <h1 className={styles.headerTitle}>Arquitectura de Agentes</h1>
                      <p className={styles.headerDesc}>
                        Mapa operativo de agentes, puentes y supervisores del sistema.
                      </p>
                    </div>
                  </div>
                </div>
              </header>

              {/* ── Status Bar ── */}
              {supervisor && (
                <div className={styles.statusBar}>
                  <span className={styles.statusItem}>
                    <StatusDot color={statusColor(supervisor.overall)} />
                    <span className={styles.statusLabel}>Estado</span>
                    {supervisor.overall === "healthy" ? "Saludable" : supervisor.overall === "degraded" ? "Degradado" : "Crítico"}
                  </span>
                  <span className={styles.statusSep} />
                  <span className={styles.statusItem}>
                    <span className={styles.statusLabel}>Uptime</span>
                    {formatUptime(supervisor.uptime)}
                  </span>
                  <span className={styles.statusSep} />
                  <span className={styles.statusItem}>
                    <span className={styles.statusLabel}>Supervisados</span>
                    {supervisor.managedCount} agentes
                  </span>
                  <span className={styles.statusSep} />
                  <span className={styles.statusItem}>
                    <StatusDot color="#10B981" />
                    <span className={styles.statusLabel}>Saludables</span>
                    {supervisor.totalHealthy}
                  </span>
                  {supervisor.totalDegraded > 0 && (
                    <>
                      <span className={styles.statusSep} />
                      <span className={styles.statusItem}>
                        <StatusDot color="#f59e0b" />
                        <span className={styles.statusLabel}>Degradados</span>
                        {supervisor.totalDegraded}
                      </span>
                    </>
                  )}
                  {supervisor.totalUnreachable > 0 && (
                    <>
                      <span className={styles.statusSep} />
                      <span className={styles.statusItem}>
                        <StatusDot color="#e74c3c" />
                        <span className={styles.statusLabel}>Inaccesibles</span>
                        {supervisor.totalUnreachable}
                      </span>
                    </>
                  )}
                  <span className={styles.statusSep} />
                  <span className={styles.statusItem}>
                    <span className={styles.statusLabel}>Polling</span>
                    {supervisor.isPolling ? "Activo" : "Inactivo"}
                  </span>
                  {lastRefresh && (
                    <>
                      <span className={styles.statusSep} />
                      <span className={styles.statusItem}>
                        <span className={styles.statusLabel}>Actualizado</span>
                        {formatTimestamp(lastRefresh)}
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* ── Business Metrics ── */}
              {businessMetrics && (
                <div className={styles.metricsGrid}>
                  <div className={styles.metricCard}>
                    <div className={styles.metricValue}>{businessMetrics.eventsToday}</div>
                    <div className={styles.metricLabel}>Eventos de negocio hoy</div>
                  </div>
                  <div className={styles.metricCard}>
                    <div className={styles.metricValue}>{businessMetrics.messagesReceived}</div>
                    <div className={styles.metricLabel}>Mensajes recibidos</div>
                  </div>
                  <div className={styles.metricCard}>
                    <div className={styles.metricValue}>{businessMetrics.bookingsCreated}</div>
                    <div className={styles.metricLabel}>Reservas creadas</div>
                  </div>
                  <div className={styles.metricCard}>
                    <div className={styles.metricValue}>{Object.keys(businessMetrics.byType).length}</div>
                    <div className={styles.metricLabel}>Tipos de evento distintos</div>
                  </div>
                </div>
              )}

              {/* ── Orchestration Map ── */}
              <OrchestrationMap />

              {/* ── Focus Agents ── */}
              {focusAgentsList.length > 0 && (
                <section className={styles.section}>
                  <div className={styles.sectionCard + " " + styles.sectionHeaderCard}>
                    <div className={styles.sectionTitle}>
                      <Sparkles size={15} strokeWidth={1.5} />
                      Agentes Reales
                    </div>
                    <div className={styles.sectionSub}>Ecosistema activo · {focusAgentsList.length} agentes</div>
                  </div>
                  <div className={styles.agentGrid}>
                    {focusAgentsList.map((a) => <AgentCard key={a.name} agent={a} />)}
                  </div>
                </section>
              )}

              {/* ── Recent Events ── */}
              {businessMetrics && businessMetrics.recentEvents.length > 0 && (
                <div className={styles.sectionCard + " " + styles.eventsCard}>
                  <div className={styles.sectionTitle}>
                    <Activity size={15} strokeWidth={1.5} />
                    Eventos Recientes
                  </div>
                  <div className={styles.sectionSub}>BusinessEventBus</div>
                  <div className={styles.eventList}>
                    {businessMetrics.recentEvents.map((evt, i) => (
                      <div key={i} className={styles.eventItem}>
                        <span className={styles.eventTime}>{formatTimestamp(evt.timestamp)}</span>
                        <span className={styles.eventType}>{evt.type}</span>
                        <span className={styles.eventConv}>
                          {evt.conversationId ? `#${evt.conversationId.slice(0, 8)}` : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── All registered agents ── */}
              {otherAgentsList.length > 0 && (
                <section className={styles.section}>
                  <div className={styles.sectionCard + " " + styles.sectionHeaderCard}>
                    <div className={styles.sectionTitle}>
                      <Database size={15} strokeWidth={1.5} />
                      Todos los agentes
                    </div>
                    <div className={styles.sectionSub}>AgentRegistry · {otherAgentsList.length} registrados</div>
                  </div>
                  <div className={styles.agentGrid + " " + styles.agentGridDimmed}>
                    {otherAgentsList.map((a) => <AgentCard key={a.name} agent={a} />)}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
