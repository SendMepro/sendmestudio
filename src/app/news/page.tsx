"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Cpu,
  Heart,
  Lightbulb,
  Megaphone,
  MessageSquare,
  MessageSquareQuote,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
  UserRound,
  Zap,
} from "lucide-react";
import AppShell from "../components/AppShell";
import styles from "./news.module.css";

/* ── Tipos ── */
type Priority = "insight" | "opportunity" | "recommendation" | "problem";

type Agent = {
  icon: React.ComponentType<{size?: number; strokeWidth?: number}>;
  name: string;
  role: string;
  color: string;
};

type IntelligenceItem = {
  id: string;
  agent: Agent;
  priority: Priority;
  timestamp: string;
  date: string;
  title: string;
  finding: string;
  evidence: { label: string; value: string }[];
  suggestion: string;
  impact: "Alto" | "Medio" | "Bajo";
  confidence: number; // 0-100
  affectedArea: string;
  actionable: boolean;
};

/* ── Agentes ── */
const AGENTS: Record<string, Agent> = {
  growth: { icon: TrendingUp, name: "Motor de Crecimiento", role: "Marketing Estratégico", color: "#7c5cff" },
  sales: { icon: Target, name: "Conversión", role: "Optimización de Ventas", color: "#33a26d" },
  retention: { icon: Heart, name: "Customer Success", role: "Retención y Fidelización", color: "#d9b66f" },
  automation: { icon: Zap, name: "Automatización", role: "Eficiencia Operativa", color: "#5d7ee7" },
  whatsapp: { icon: MessageSquare, name: "WhatsApp AI", role: "Canal de Conversación", color: "#25D366" },
  campaigns: { icon: Megaphone, name: "Campañas", role: "Marketing Directo", color: "#e8734a" },
  revenue: { icon: BarChart3, name: "Revenue", role: "Análisis de Ingresos", color: "#b98a32" },
};

/* ── Datos de ejemplo ── */
const INTELLIGENCE: IntelligenceItem[] = [
  {
    id: "n01",
    agent: AGENTS.growth,
    priority: "insight",
    timestamp: "11:32",
    date: "Hoy",
    title: "Aumento de interés en Balayage",
    finding: "Durante los últimos 7 días se registraron 47 consultas relacionadas con Balayage. Representan el 38% de todas las consultas recibidas. 18 conversaciones terminaron sin reserva. Solo existe 1 campaña activa relacionada.",
    evidence: [
      { label: "Consultas WhatsApp", value: "47" },
      { label: "Sin reserva", value: "18" },
      { label: "% del total", value: "38%" },
      { label: "Campañas activas", value: "1" },
    ],
    suggestion: "Crear campaña específica para Balayage orientada a recuperar prospectos no convertidos. Activar seguimiento automático a 24h.",
    impact: "Alto",
    confidence: 89,
    affectedArea: "Campañas / WhatsApp",
    actionable: true,
  },
  {
    id: "n02",
    agent: AGENTS.revenue,
    priority: "opportunity",
    timestamp: "10:15",
    date: "Hoy",
    title: "Ticket promedio puede aumentar $18.000",
    finding: "El 62% de las clientas que reservaron corte + coloración no compraron productos de cuidado post-servicio. Clientes premium compran 3.2x más productos cuando se les recomienda al finalizar el servicio.",
    evidence: [
      { label: "Clientes sin post-venta", value: "62%" },
      { label: "Diferencial ticket", value: "+$18.000" },
      { label: "Clientes premium/mes", value: "84" },
      { label: "Ingreso potencial", value: "$1.5M" },
    ],
    suggestion: "Activar recomendación automática de productos post-servicio vía WhatsApp 2h después de cada cita. Segmentar por servicio recibido.",
    impact: "Alto",
    confidence: 92,
    affectedArea: "Ventas / WhatsApp",
    actionable: true,
  },
  {
    id: "n03",
    agent: AGENTS.sales,
    priority: "recommendation",
    timestamp: "Ayer",
    date: "31 May",
    title: "17 prospectos no respondieron en seguimiento",
    finding: "17 contactos que solicitaron presupuesto de alisado orgánico no respondieron al seguimiento manual. El tiempo promedio de respuesta fue de 6.4h. Estudios internos muestran que respuestas en <30min convierten 3.4x más.",
    evidence: [
      { label: "Prospectos perdidos", value: "17" },
      { label: "Tiempo respuesta", value: "6.4h" },
      { label: "Meta ideal", value: "<30 min" },
      { label: "Cierre potencial", value: "12" },
    ],
    suggestion: "Activar respuesta automática inmediata con horarios, precios y link de reserva. Escalar a humana si hay objeción específica.",
    impact: "Medio",
    confidence: 85,
    affectedArea: "Ventas / Automatización",
    actionable: true,
  },
  {
    id: "n04",
    agent: AGENTS.retention,
    priority: "insight",
    timestamp: "Ayer",
    date: "31 May",
    title: "Clientas frecuentes redujeron visitas",
    finding: "12 clientas categorizadas como 'alta frecuencia' (≥4 visitas/mes) redujeron a 2 visitas en las últimas 3 semanas. 8 de ellas no tienen reserva próxima. Patrón histórico indica riesgo de fuga del 73% si no se interviene en 10 días.",
    evidence: [
      { label: "Clientas en riesgo", value: "12" },
      { label: "Frecuencia anterior", value: "4/mes" },
      { label: "Frecuencia actual", value: "2/mes" },
      { label: "Riesgo de fuga", value: "73%" },
    ],
    suggestion: "Enviar campaña de reconexión con experiencia exclusiva: 'Te extrañamos — tu próximo corte es cortesía'. Segmentar por historial de servicios.",
    impact: "Alto",
    confidence: 78,
    affectedArea: "Retención / Campañas",
    actionable: true,
  },
  {
    id: "n05",
    agent: AGENTS.campaigns,
    priority: "problem",
    timestamp: "Ayer",
    date: "31 May",
    title: "Campañas sin métricas de rendimiento",
    finding: "El módulo de Campañas no registra lecturas, CTR, conversiones, reservas atribuidas ni ROI. Sin estos datos no es posible optimizar inversión ni calcular efectividad real. Cada campaña sin tracking es un gasto ciego.",
    evidence: [
      { label: "Campañas sin tracking", value: "4" },
      { label: "Métricas faltantes", value: "6" },
      { label: "Gasto estimado", value: "$240.000" },
      { label: "ROI actual", value: "Desconocido" },
    ],
    suggestion: "Implementar píxel de conversión en landing pages, tracking UTM en cada enlace, y atribución de reservas por campaña.",
    impact: "Alto",
    confidence: 96,
    affectedArea: "Campañas / Analítica",
    actionable: true,
  },
  {
    id: "n06",
    agent: AGENTS.automation,
    priority: "recommendation",
    timestamp: "30 May",
    date: "30 May",
    title: "Horarios pico tienen reclamos por demora",
    finding: "El 28% de los reclamos de los últimos 7 días están relacionados con tiempo de espera en cabin. El slot más crítico es sábado 11:00-14:00. 3 estilistas tienen overbooking sistemático los sábados.",
    evidence: [
      { label: "Reclamos por demora", value: "28%" },
      { label: "Slot crítico", value: "Sáb 11-14" },
      { label: "Estilistas overbooking", value: "3" },
      { label: "Clientes afectados", value: "22" },
    ],
    suggestion: "Ajustar capacidad: bloquear 15 min entre citas premium en sábados. Agregar buffer automático en agenda para coloraciones.",
    impact: "Medio",
    confidence: 82,
    affectedArea: "Agenda / Operaciones",
    actionable: true,
  },
  {
    id: "n07",
    agent: AGENTS.whatsapp,
    priority: "opportunity",
    timestamp: "29 May",
    date: "29 May",
    title: "Horario muerto de 14-16h tiene capacidad disponible",
    finding: "La ventana 14:00-16:00 tiene solo 22% de ocupación en días laborales. Misma ventana tiene alta tasa de consultas por WhatsApp (34 mensajes/día en promedio). Esto sugiere que hay demanda no capturada en ese horario.",
    evidence: [
      { label: "Ocupación 14-16h", value: "22%" },
      { label: "Consultas WhatsApp", value: "34/día" },
      { label: "Cupos disponibles", value: "12" },
      { label: "Potencial semanal", value: "60" },
    ],
    suggestion: "Lanzar 'Happy Hour' 14-16h con 15% descuento en servicios seleccionados. Promocionar vía WhatsApp automatizado a clientes que consultan cerca del mediodía.",
    impact: "Alto",
    confidence: 88,
    affectedArea: "Ventas / WhatsApp",
    actionable: true,
  },
  {
    id: "n08",
    agent: AGENTS.growth,
    priority: "insight",
    timestamp: "28 May",
    date: "28 May",
    title: "Clientas nuevas crecen 23% pero retención inicial es baja",
    finding: "Las nuevas clientas aumentaron 23% vs mes anterior. Sin embargo, el 58% no regresa después de la primera visita. El promedio de recompra en salones top es 72%. Esto representa una fuga de $2.1M estimados en ingresos recurrentes.",
    evidence: [
      { label: "Crecimiento nuevas", value: "+23%" },
      { label: "Retención 1ra visita", value: "42%" },
      { label: "Benchmark industria", value: "72%" },
      { label: "Fuga estimada", value: "$2.1M" },
    ],
    suggestion: "Implementar programa de bienvenida: descuento en 2da visita dentro de 21 días, más seguimiento automático a las 48h post-servicio.",
    impact: "Alto",
    confidence: 91,
    affectedArea: "Retención / Ventas",
    actionable: true,
  },
];

/* ── Helpers ── */
const PRIORITY_CONFIG = {
  insight: { label: "Insight", color: "var(--priority-insight, #33a26d)" },
  opportunity: { label: "Oportunidad", color: "var(--priority-opportunity, #5d7ee7)" },
  recommendation: { label: "Recomendación", color: "var(--priority-recommendation, #b98a32)" },
  problem: { label: "Problema Detectado", color: "var(--priority-problem, #d85c7b)" },
} as const;

const PRIORITY_ICON = {
  insight: CheckCircle2,
  opportunity: TrendingUp,
  recommendation: Lightbulb,
  problem: AlertTriangle,
};

function getInitials(name: string): string {
  return name.split(/\s+/).filter(Boolean).map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

/* ── Componente ── */
export default function NewsPage() {
  const [filter, setFilter] = useState<Priority | "all">("all");
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set(["n05"]));

  const toggleExpanded = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = filter === "all"
    ? INTELLIGENCE
    : INTELLIGENCE.filter((item) => item.priority === filter);

  const counts = {
    all: INTELLIGENCE.length,
    insight: INTELLIGENCE.filter((i) => i.priority === "insight").length,
    opportunity: INTELLIGENCE.filter((i) => i.priority === "opportunity").length,
    recommendation: INTELLIGENCE.filter((i) => i.priority === "recommendation").length,
    problem: INTELLIGENCE.filter((i) => i.priority === "problem").length,
  };

  return (
    <AppShell>
      <div className={styles.newsPage}>
        {/* ── Header ── */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Centro de Inteligencia IA</h1>
            <p className={styles.subtitle}>
              Equipo de agentes trabajando permanentemente para tu salón
            </p>
          </div>
          <div className={styles.headerMeta}>
            <span className={styles.agentCount}>
              <Cpu size={12} strokeWidth={2} />
              {Object.keys(AGENTS).length} agentes activos
            </span>
            <span className={styles.liveDot}>
              <span className={styles.liveDotPulse} />
              En vivo
            </span>
          </div>
        </header>

        {/* ── Filtros ── */}
        <div className={styles.filterRow}>
          {(["all", "insight", "opportunity", "recommendation", "problem"] as const).map((key) => {
            const config = key === "all" ? null : PRIORITY_CONFIG[key];
            const Icon = key === "all" ? Sparkles : PRIORITY_ICON[key];
            return (
              <button
                key={key}
                className={styles.filterChip}
                data-active={filter === key ? "true" : "false"}
                onClick={() => setFilter(key)}
              >
                <Icon size={11} strokeWidth={2.5} />
                {config?.label ?? "Todas"}
                <span className={styles.filterCount}>{counts[key]}</span>
              </button>
            );
          })}
        </div>

        {/* ── Feed ── */}
        <div className={styles.feed}>
          {filtered.length === 0 && (
            <div className={styles.empty}>
              <Sparkles size={28} strokeWidth={1.2} />
              <p>No hay publicaciones con este filtro</p>
            </div>
          )}
          {filtered.map((item) => {
            const priorityConfig = PRIORITY_CONFIG[item.priority];
            const PriorityIcon = PRIORITY_ICON[item.priority];
            const AgentIcon = item.agent.icon;
            const isExpanded = expandedCards.has(item.id);

            return (
              <article
                key={item.id}
                className={styles.card}
                data-priority={item.priority}
                data-expanded={isExpanded ? "true" : "false"}
              >
                {/* ── Barra de prioridad ── */}
                <div
                  className={styles.priorityBar}
                  style={{ background: priorityConfig.color }}
                />

                {/* ── Header ── */}
                <div className={styles.cardHeader}>
                  <div className={styles.cardAgentRow}>
                    <div
                      className={styles.agentAvatar}
                      style={{
                        background: `${item.agent.color}18`,
                        color: item.agent.color,
                        borderColor: `${item.agent.color}30`,
                      }}
                    >
                      <AgentIcon size={13} strokeWidth={2} />
                    </div>
                    <div className={styles.cardAgentInfo}>
                      <div className={styles.cardAgentName} style={{ color: item.agent.color }}>
                        {item.agent.name}
                      </div>
                      <div className={styles.cardAgentRole}>{item.agent.role}</div>
                    </div>
                    <div className={styles.cardTimestamp}>
                      <span>{item.date}</span>
                      <span>{item.timestamp}</span>
                    </div>
                  </div>

                  {/* Prioridad badge */}
                  <div className={styles.cardPriorityRow}>
                    <span
                      className={styles.priorityBadge}
                      style={{
                        color: priorityConfig.color,
                        background: `${priorityConfig.color}14`,
                      }}
                    >
                      <PriorityIcon size={10} strokeWidth={2.5} />
                      {priorityConfig.label}
                    </span>
                    <span className={styles.cardAffected}>{item.affectedArea}</span>
                  </div>
                </div>

                {/* ── Título ── */}
                <h2 className={styles.cardTitle}>{item.title}</h2>

                {/* ── Hallazgo ── */}
                <div className={styles.cardFinding}>
                  <div className={styles.sectionLabel}>Hallazgo</div>
                  <p>{item.finding}</p>
                </div>

                {/* ── Evidencia ── */}
                <details
                  className={styles.evidenceBox}
                  open={isExpanded}
                  onToggle={() => toggleExpanded(item.id)}
                >
                  <summary className={styles.evidenceSummary}>
                    <span>Ver evidencia</span>
                    <div className={styles.evidencePills}>
                      {item.evidence.slice(0, 2).map((ev) => (
                        <span key={ev.label} className={styles.evidenceMini}>
                          {ev.label}: {ev.value}
                        </span>
                      ))}
                      {item.evidence.length > 2 && (
                        <span className={styles.evidenceMore}>+{item.evidence.length - 2}</span>
                      )}
                    </div>
                  </summary>
                  <div className={styles.evidenceGrid}>
                    {item.evidence.map((ev) => (
                      <div key={ev.label} className={styles.evidenceItem}>
                        <span className={styles.evidenceLabel}>{ev.label}</span>
                        <strong className={styles.evidenceValue}>{ev.value}</strong>
                      </div>
                    ))}
                  </div>
                </details>

                {/* ── Cuerpo expandido ── */}
                {isExpanded && (
                  <div className={styles.cardBody}>
                    {/* Sugerencia */}
                    <div className={styles.suggestionBox}>
                      <div className={styles.sectionLabel}>Sugerencia</div>
                      <p>{item.suggestion}</p>
                    </div>

                    {/* Footer info */}
                    <div className={styles.cardFooter}>
                      <div className={styles.footerMetric}>
                        <span>Impacto</span>
                        <strong data-impact={item.impact}>{item.impact}</strong>
                      </div>
                      <div className={styles.footerMetric}>
                        <span>Confianza IA</span>
                        <div className={styles.confidenceBar}>
                          <div
                            className={styles.confidenceFill}
                            style={{ width: `${item.confidence}%` }}
                          />
                        </div>
                        <strong>{item.confidence}%</strong>
                      </div>
                      {item.actionable && (
                        <button className={styles.actionButton}>
                          <Zap size={11} strokeWidth={2.5} />
                          Activar
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
