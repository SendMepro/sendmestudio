// ================================================================
// /customers/[id]/memory/page.tsx — Customer Memory Dashboard
// Muestra perfil emocional, preferencias, historial, timeline,
// inteligencia del cliente. Todo tenant-aware.
// ================================================================

"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/app/components/AppShell";
import {
  ArrowLeft,
  Brain,
  Calendar,
  Heart,
  MessageSquare,
  Phone,
  Send,
  Star,
  Clock,
  DollarSign,
  User,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Activity,
  Download,
} from "lucide-react";

type CustomerMemoryData = {
  customer: any;
  memory: {
    id: string;
    phone: string;
    profile: any;
    signals: any[];
    metadata: any;
  } | null;
  timeline: TimelineEvent[];
  intelligence: CustomerIntelligence;
  stats: {
    totalAppointments: number;
    totalMessages: number;
    totalCampaignActions: number;
    lastAppointment: any;
    lastMessage: any;
  };
};

type TimelineEvent = {
  id: string;
  type: "appointment" | "message" | "campaign" | "purchase" | "note";
  title: string;
  description: string;
  date: string;
  status?: string;
  value?: number;
  direction?: string;
  campaignName?: string;
};

type CustomerIntelligence = {
  loyaltyLevel: string;
  priceSensitive: boolean;
  returnProbability: string;
  emotionalTraits: string[];
  emotionalSummary: string | null;
  historicalValue: number;
  daysSinceLastVisit: number;
  totalAppointments: number;
  preferredStylist: string | null;
  favoriteServices: string[];
  lifecycleStage: string;
  aiSummary: string;
};

const LOYALTY_COLORS: Record<string, string> = {
  platinum: "#8e44ad",
  gold: "#f39c12",
  silver: "#7f8c8d",
  bronze: "#d35400",
  new: "#3498db",
};

const LOYALTY_LABELS: Record<string, string> = {
  platinum: "Platino",
  gold: "Oro",
  silver: "Plata",
  bronze: "Bronce",
  new: "Nuevo",
};

export default function CustomerMemoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<CustomerMemoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    fetch(`/api/customers/${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) {
          setError(json.error);
        } else {
          setData(json);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
          <Brain size={24} className="spin" style={{ opacity: 0.5 }} />
          <span style={{ marginLeft: 12, color: "var(--text-secondary)" }}>Cargando memoria del cliente...</span>
        </div>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell>
        <div style={{ padding: 40 }}>
          <button onClick={() => router.back()} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", marginBottom: 24 }}>
            <ArrowLeft size={16} /> Volver
          </button>
          <div style={{ color: "#e74c3c" }}>{error || "Cliente no encontrado"}</div>
        </div>
      </AppShell>
    );
  }

  const { customer, memory, timeline, intelligence, stats } = data;
  const displayName = customer.displayName || customer.firstName || customer.phone;
  const signals = memory?.signals ?? [];
  const profile = memory?.profile ?? {};

  return (
    <AppShell>
      <div style={{ padding: "24px 32px", maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => router.back()}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", fontSize: 14 }}
          >
            <ArrowLeft size={16} /> Volver
          </button>
        </div>

        {/* Customer Header Card */}
        <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, var(--tenant-primary), var(--tenant-secondary))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 24, fontWeight: 700 }}>
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{displayName}</h1>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4, color: "var(--text-secondary)", fontSize: 14 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Phone size={12} /> {customer.phone}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Star size={12} />
                  <span style={{ color: LOYALTY_COLORS[intelligence.loyaltyLevel] || "#3498db", fontWeight: 600 }}>
                    {LOYALTY_LABELS[intelligence.loyaltyLevel] || "Nuevo"}
                  </span>
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Activity size={12} />
                  {intelligence.lifecycleStage}
                </span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Valor histórico</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>
                ${intelligence.historicalValue.toLocaleString("es-CL")}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
          {/* Intelligence Panel */}
          <div className="glass-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
              <Brain size={16} /> Inteligencia del Cliente
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <MetricCard icon={Activity} label="Probabilidad retorno" value={intelligence.returnProbability} />
              <MetricCard icon={DollarSign} label="Sensibilidad precio" value={intelligence.priceSensitive ? "Sensible" : "Normal"} color={intelligence.priceSensitive ? "#e74c3c" : "#27ae60"} />
              <MetricCard icon={Calendar} label="Días sin visita" value={`${intelligence.daysSinceLastVisit}`} />
              <MetricCard icon={Star} label="Fidelidad" value={LOYALTY_LABELS[intelligence.loyaltyLevel] || "Nuevo"} color={LOYALTY_COLORS[intelligence.loyaltyLevel]} />
              <MetricCard icon={User} label="Estilista preferida" value={intelligence.preferredStylist || "Sin preferencia"} />
              <MetricCard icon={Sparkles} label="Servicios favoritos" value={intelligence.favoriteServices.slice(0, 3).join(", ") || "Ninguno"} />
            </div>

            {/* Emotional Profile */}
            {intelligence.emotionalTraits.length > 0 && (
              <div style={{ marginTop: 16, padding: 12, borderRadius: 10, background: "var(--tenant-primary-lighter)" }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <Heart size={14} /> Perfil Emocional
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {intelligence.emotionalTraits.map((trait: string, i: number) => (
                    <span key={i} style={{ padding: "4px 10px", borderRadius: 20, fontSize: 12, background: "var(--surface-glass-strong)", border: "1px solid var(--glass-border)" }}>
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* AI Summary */}
            {intelligence.aiSummary && (
              <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: "rgba(124,92,255,0.05)", border: "1px solid rgba(124,92,255,0.1)" }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                  <Sparkles size={14} /> Resumen IA
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{intelligence.aiSummary}</div>
              </div>
            )}
          </div>

          {/* Signals / Memory Panel */}
          <div className="glass-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
              <Brain size={16} /> Señales detectadas ({signals.length})
            </h3>

            {signals.length === 0 ? (
              <div style={{ color: "var(--text-tertiary)", fontSize: 14, textAlign: "center", padding: 24 }}>
                Aún no se han detectado señales de este cliente.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {signals.slice(0, 15).map((signal: any, i: number) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 12px", borderRadius: 10, background: "var(--surface-glass-strong)", border: "1px solid var(--glass-border)" }}>
                    <SignalIcon type={signal.type} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{signalLabel(signal.type)}</div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                        {String(signal.value)} · Confianza: {Math.round(signal.confidence * 100)}%
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
                        "{signal.messageText}"
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>
                      {timeAgo(signal.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="glass-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
            <Clock size={16} /> Timeline ({timeline.length} eventos)
          </h3>

          {timeline.length === 0 ? (
            <div style={{ color: "var(--text-tertiary)", fontSize: 14, textAlign: "center", padding: 24 }}>
              Sin actividad registrada.
            </div>
          ) : (
            <div style={{ position: "relative" }}>
              {/* Timeline line */}
              <div style={{ position: "absolute", left: 15, top: 8, bottom: 8, width: 2, background: "var(--glass-border)", borderRadius: 1 }} />

              {timeline.slice(0, 50).map((event: TimelineEvent) => (
                <div key={event.id} style={{ display: "flex", gap: 16, padding: "8px 0", position: "relative" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 1, background: getTimelineBg(event.type) }}>
                    <TimelineIcon type={event.type} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{event.title}</div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{event.description}</div>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-tertiary)", whiteSpace: "nowrap", marginLeft: 12 }}>
                        {formatDate(event.date)}
                      </div>
                    </div>
                    {event.value && (
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#27ae60", marginTop: 4 }}>
                        ${event.value.toLocaleString("es-CL")}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

// ── Sub-components ──

function MetricCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color?: string }) {
  return (
    <div style={{ padding: "10px 12px", borderRadius: 10, background: "var(--surface-glass-strong)", border: "1px solid var(--glass-border)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-tertiary)", marginBottom: 4 }}>
        <Icon size={12} /> {label}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: color || "var(--text-primary)" }}>{value}</div>
    </div>
  );
}

function SignalIcon({ type }: { type: string }) {
  const icons: Record<string, any> = {
    transport: Heart,
    schedule: Clock,
    stylist: User,
    allergy: AlertTriangle,
    price_sensitivity: DollarSign,
    service_interest: Sparkles,
    waiting_sensitivity: Clock,
    preference: Star,
    general: Brain,
  };
  const Icon = icons[type] || Brain;
  return <Icon size={14} style={{ marginTop: 2, flexShrink: 0, color: "var(--tenant-primary)" }} />;
}

function signalLabel(type: string): string {
  const labels: Record<string, string> = {
    transport: "Transporte",
    schedule: "Horario preferido",
    stylist: "Estilista",
    allergy: "Alergia",
    price_sensitivity: "Sensibilidad precio",
    service_interest: "Interés en servicio",
    waiting_sensitivity: "Tolerancia espera",
    preference: "Preferencia",
    general: "Señal general",
  };
  return labels[type] || type;
}

function TimelineIcon({ type }: { type: string }) {
  const icons: Record<string, any> = {
    appointment: Calendar,
    message: MessageSquare,
    campaign: Send,
    purchase: DollarSign,
    note: Brain,
  };
  const Icon = icons[type] || Clock;
  return <Icon size={14} style={{ color: "#fff" }} />;
}

function getTimelineBg(type: string): string {
  const colors: Record<string, string> = {
    appointment: "#7c5cff",
    message: "#3498db",
    campaign: "#e67e22",
    purchase: "#27ae60",
    note: "#8e44ad",
  };
  return colors[type] || "#95a5a6";
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
    if (diff < 604800000) return d.toLocaleDateString("es-CL", { weekday: "short" });
    return d.toLocaleDateString("es-CL", { day: "numeric", month: "short" });
  } catch {
    return dateStr;
  }
}

function timeAgo(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "ahora";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d`;
    return `${Math.floor(days / 30)}mes`;
  } catch {
    return "";
  }
}
