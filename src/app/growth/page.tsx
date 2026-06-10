"use client";

import {
  BrainCircuit,
  CalendarCheck,
  Users,
  MessageSquare,
  Gift,
  UserCheck,
  TrendingUp,
  Target,
  Search,
  ListChecks,
  Megaphone,
  Star,
  DollarSign,
  Zap,
  ShieldCheck,
} from "lucide-react";
import styles from "./page.module.css";
import AppShell from "../components/AppShell";

function getInitials(name: string): string {
  return name.split(/\s+/).filter(Boolean).map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

/* ── Data ── */

const META = {
  studio: "MAITE GUERRA STUDIO",
  period: "Mayo 2026",
  goal: 8_000_000,
  current: 4_900_000,
  gap: 3_100_000,
  percent: 61,
  status: "En ruta",
  daysLeft: 10,
};

const BRECHA_REQUISITOS = [
  { label: "Reservas nuevas", value: "27", unit: "adicionales" },
  { label: "Ticket promedio", value: "+8%", unit: "vs mes anterior" },
  { label: "Cancelaciones", value: "<5%", unit: "máximo permitido" },
];

const ACTION_PLAN = [
  {
    icon: MessageSquare, title: "Campaña WhatsApp Botox Capilar",
    impact: "+$620.000", probability: 91, channel: "WhatsApp", color: "#7c5cff",
    btnLabel: "Preparar campaña",
    gradient: "linear-gradient(135deg, #7c5cff 0%, #a78bfa 50%, #c4b5fd 100%)",
    heroIcon: Zap,
    heroLabel: "Tratamiento capilar",
  },
  {
    icon: Gift, title: "Cupón Coloración 15%",
    impact: "+$420.000", probability: 76, channel: "WhatsApp + Instagram", color: "#10b981",
    btnLabel: "Crear cupón",
    gradient: "linear-gradient(135deg, #10b981 0%, #34d399 50%, #6ee7b7 100%)",
    heroIcon: DollarSign,
    heroLabel: "Coloración",
  },
  {
    icon: Users, title: "Reactivar clientas inactivas",
    impact: "+$290.000", probability: 84, channel: "WhatsApp", color: "#f59e0b",
    btnLabel: "Ver audiencia",
    gradient: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #fde68a 100%)",
    heroIcon: UserCheck,
    heroLabel: "Clientas",
  },
  {
    icon: CalendarCheck, title: "Reforzar agenda de viernes",
    impact: "+8 reservas", probability: 79, channel: "Recordatorio", color: "#3b82f6",
    btnLabel: "Preparar acción",
    gradient: "linear-gradient(135deg, #3b82f6 0%, #60a5fa 50%, #93c5fd 100%)",
    heroIcon: CalendarCheck,
    heroLabel: "Reservas",
  },
];

const PIPELINE_STEPS = [
  { icon: Target, label: "Meta", desc: "$8.0M definido" },
  { icon: Search, label: "Diagnóstico", desc: "IA calcula brecha" },
  { icon: ListChecks, label: "Plan", desc: "Prioriza acciones" },
  { icon: Megaphone, label: "Campañas", desc: "WhatsApp + cupones" },
  { icon: CalendarCheck, label: "Reservas", desc: "Convierte en citas" },
  { icon: TrendingUp, label: "Resultado", desc: "Mide avance" },
];

const RESPONSABLES = [
  { name: "Director Comercial", role: "Estrategia de crecimiento", status: "pending" as const },
  { name: "Director IA", role: "Orquestador de crecimiento", status: "active" as const },
  { name: "Administradora", role: "Gestión operativa", status: "active" as const },
  { name: "Dueños", role: "Aprobación estratégica", status: "pending" as const },
];

const TEAM_RANKING = [
  { name: "Renata Ibarra", role: "Estilista Senior", rating: "4.9", bookings: 52, completed: 50, cancelled: 2, compliance: 96, revenue: "$3.400.000" },
  { name: "Tiare Peña", role: "Colorista", rating: "4.8", bookings: 41, completed: 38, cancelled: 3, compliance: 92, revenue: "$2.700.000" },
  { name: "Dannae Albrecht", role: "Manicurista & Podóloga", rating: "4.7", bookings: 36, completed: 34, cancelled: 2, compliance: 94, revenue: "$1.400.000" },
  { name: "Coca Carvajal", role: "Cosmetóloga", rating: "4.6", bookings: 28, completed: 25, cancelled: 3, compliance: 89, revenue: "$980.000" },
  { name: "Betzabé Valdebenito", role: "Cosmetóloga", rating: "4.5", bookings: 24, completed: 22, cancelled: 2, compliance: 91, revenue: "$820.000" },
];

/* ── Subcomponents ── */

function StatusBadge({ status }: { status: string }) {
  if (status === "active") {
    return <span className={styles.statusBadge} data-status="active">Activo</span>;
  }
  return <span className={styles.statusBadge} data-status="pending">Pendiente</span>;
}

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <div className={styles.avatar} style={{ width: size, height: size, fontSize: size >= 40 ? 14 : 10 }}>
      {getInitials(name)}
    </div>
  );
}

export default function GrowthPage() {
  return (
    <AppShell>
      <div className={styles.page}>

        {/* ── TOP BANNER ── */}
        <div className={styles.topBanner}>
          <span className={styles.topBannerStudio}>{META.studio}</span>
          <span className={styles.topBannerDot}>·</span>
          <span className={styles.topBannerPeriod}>{META.period}</span>
        </div>

        {/* ═══════ SECCIÓN 1: CENTRO DE COMANDO ═══════ */}
        <section className={styles.comando}>
          <div className={styles.comandoHeader}>
            <BrainCircuit size={18} strokeWidth={1.5} className={styles.comandoIcon} />
            <h1 className={styles.comandoTitle}>Centro de Comando Comercial</h1>
          </div>

          <div className={styles.comandoBody}>
            <div className={styles.comandoMeta}>
              <div className={styles.comandoMetaLabel}>Meta del mes</div>
              <div className={styles.comandoMetaValue}>${(META.goal / 1_000_000).toFixed(1)}M</div>
            </div>

            <div className={styles.comandoAvance}>
              <div className={styles.comandoAvanceBar}>
                <div className={styles.comandoAvanceFill} style={{ width: `${META.percent}%` }} />
              </div>
              <div className={styles.comandoAvanceInfo}>
                <span className={styles.comandoAvancePct}>{META.percent}% completado</span>
                <span className={styles.comandoAvanceStatus}>
                  <span className={styles.comandoAvanceDot} /> {META.status}
                </span>
                <span className={styles.comandoAvanceDays}>{META.daysLeft} días restantes</span>
              </div>
            </div>

            <div className={styles.comandoCifras}>
              <div className={styles.comandoCifra}>
                <span className={styles.comandoCifraLabel}>Actual</span>
                <span className={styles.comandoCifraValue}>${(META.current / 1_000_000).toFixed(1)}M</span>
              </div>
              <div className={styles.comandoCifraDivider} />
              <div className={styles.comandoCifra}>
                <span className={styles.comandoCifraLabel}>Faltan</span>
                <span className={styles.comandoCifraValue} data-accent>${(META.gap / 1_000_000).toFixed(1)}M</span>
              </div>
              <div className={styles.comandoCifraDivider} />
              <div className={styles.comandoCifra}>
                <span className={styles.comandoCifraLabel}>Responsable</span>
                <span className={styles.comandoCifraValue}>Director Comercial</span>
              </div>
              <div className={styles.comandoCifraDivider} />
              <div className={styles.comandoCifra}>
                <span className={styles.comandoCifraLabel}>Rol</span>
                <span className={styles.comandoCifraValue}>Estrategia de crecimiento</span>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════ SECCIÓN 2: BRECHA COMERCIAL ═══════ */}
        <section className={styles.brecha}>
          <div className={styles.brechaHeader}>
            <h2 className={styles.brechaTitle}>Brecha Comercial</h2>
            <p className={styles.brechaLead}>
              Faltan <strong>${(META.gap / 1_000_000).toFixed(1)}M</strong> para alcanzar la meta mensual
            </p>
          </div>

          <div className={styles.brechaRequisitos}>
            {BRECHA_REQUISITOS.map((r) => (
              <div key={r.label} className={styles.brechaReq}>
                <div className={styles.brechaReqValue}>{r.value}</div>
                <div className={styles.brechaReqMeta}>
                  <span className={styles.brechaReqLabel}>{r.label}</span>
                  <span className={styles.brechaReqUnit}>{r.unit}</span>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.brechaIa}>
            <BrainCircuit size={14} strokeWidth={1.5} />
            <span>Estimación IA basada en rendimiento actual del salón</span>
          </div>
        </section>

        {/* ═══════ SECCIÓN 3: PLAN DE ATAQUE ═══════ */}
        <section className={styles.section}>
          <div className={styles.ataqueHeader}>
            <h2 className={styles.sectionTitle}>Plan de Ataque</h2>
            <span className={styles.ataqueImpactTotal}>Impacto total: <strong>+$1.33M</strong></span>
          </div>

          <div className={styles.ataqueGrid}>
            {ACTION_PLAN.map((a) => (
              <div key={a.title} className={styles.ataqueCard}>
                <div className={styles.ataqueHero} style={{ background: a.gradient }}>
                  <div className={styles.ataqueHeroGlow} />
                  <div className={styles.ataqueHeroContent}>
                    <div className={styles.ataqueHeroIcon}>
                      <a.heroIcon size={22} strokeWidth={1.5} />
                    </div>
                    <span className={styles.ataqueHeroLabel}>{a.heroLabel}</span>
                  </div>
                </div>

                <div className={styles.ataqueBody}>
                  <h3 className={styles.ataqueTitle}>{a.title}</h3>

                  <div className={styles.ataqueImpact}>
                    <span className={styles.ataqueImpactLabel}>Impacto</span>
                    <span className={styles.ataqueImpactValue}>{a.impact}</span>
                  </div>

                  <div className={styles.ataqueProb}>
                    <div className={styles.ataqueProbBar}>
                      <div className={styles.ataqueProbFill} style={{ width: `${a.probability}%`, background: a.color }} />
                    </div>
                    <span className={styles.ataqueProbLabel}>{a.probability}%</span>
                  </div>

                  <div className={styles.ataqueCoach}>
                    <Avatar name="Director Comercial" size={24} />
                    <span className={styles.ataqueCoachName}>Director Comercial</span>
                    <span className={styles.ataqueCoachRole}>Estrategia de crecimiento</span>
                  </div>
                </div>

                <button className={styles.ataqueBtn} style={{ color: a.color, borderColor: `${a.color}30` }}>
                  {a.btnLabel}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════ SECCIÓN 4: ORQUESTACIÓN ═══════ */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Orquestación</h2>
          <p className={styles.orqLead}>De la meta a los resultados</p>

          <div className={styles.orqFlow}>
            {PIPELINE_STEPS.map((step, i) => (
              <div key={step.label} className={styles.orqStep}>
                <div className={styles.orqStepIcon}>
                  <step.icon size={16} strokeWidth={1.5} />
                </div>
                <div className={styles.orqStepContent}>
                  <span className={styles.orqStepLabel}>{step.label}</span>
                  <span className={styles.orqStepDesc}>{step.desc}</span>
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <div className={styles.orqStepArrow}>
                    <TrendingUp size={12} strokeWidth={1.5} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ═══════ SECCIÓN 5: RESPONSABLES ═══════ */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Responsables</h2>

          <div className={styles.respGrid}>
            {RESPONSABLES.map((r) => (
              <div key={r.name} className={styles.respCard}>
                <Avatar name={r.name} size={36} />
                <div className={styles.respInfo}>
                  <span className={styles.respName}>{r.name}</span>
                  <span className={styles.respRole}>{r.role}</span>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        </section>

        {/* ═══════ SECCIÓN 6: RENDIMIENTO DEL EQUIPO ═══════ */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Rendimiento del Equipo</h2>

          <div className={styles.equipoGrid}>
            {TEAM_RANKING.map((m, i) => (
              <div key={m.name} className={styles.equipoCard}>
                <div className={styles.equipoTop}>
                  <span className={styles.equipoRank}>{i + 1}</span>
                  <Avatar name={m.name} size={36} />
                  <div className={styles.equipoInfo}>
                    <span className={styles.equipoName}>{m.name}</span>
                    <span className={styles.equipoRole}>{m.role}</span>
                  </div>
                  <div className={styles.equipoRating}>
                    <Star size={11} strokeWidth={1.5} fill="#f59e0b" color="#f59e0b" />
                    <span>{m.rating}</span>
                  </div>
                </div>
                <div className={styles.equipoStats}>
                  <div className={styles.equipoStat}>
                    <span className={styles.equipoStatValue}>{m.bookings}</span>
                    <span className={styles.equipoStatLabel}>Reservas</span>
                  </div>
                  <div className={styles.equipoStat}>
                    <span className={styles.equipoStatValue}>{m.completed}</span>
                    <span className={styles.equipoStatLabel}>Completadas</span>
                  </div>
                  <div className={styles.equipoStat}>
                    <span className={styles.equipoStatValue} data-negative>{m.cancelled}</span>
                    <span className={styles.equipoStatLabel}>Canceladas</span>
                  </div>
                  <div className={styles.equipoStat}>
                    <span className={styles.equipoStatValue} data-good={m.compliance >= 90}>{m.compliance}%</span>
                    <span className={styles.equipoStatLabel}>Cumplimiento</span>
                  </div>
                  <div className={styles.equipoStat}>
                    <span className={styles.equipoStatValue}>{m.revenue}</span>
                    <span className={styles.equipoStatLabel}>Generado</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════ SECCIÓN 7: TRAINING AI MODE ═══════ */}
        <section className={styles.section}>
          <div className={styles.trainingCard}>
            <div className={styles.trainingLeft}>
              <div className={styles.trainingIcon}>
                <ShieldCheck size={20} strokeWidth={1.5} />
              </div>
              <div className={styles.trainingInfo}>
                <span className={styles.trainingTitle}>Training AI Mode</span>
                <span className={styles.trainingDesc}>Activa análisis generativo para acelerar el cumplimiento de meta</span>
              </div>
            </div>
            <span className={styles.trainingBadge}>Premium</span>
          </div>
        </section>

      </div>
    </AppShell>
  );
}
