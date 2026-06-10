"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MessageSquare,
  Sparkles,
  Wallet,
} from "lucide-react";
import AppShell from "./components/AppShell";
import HomeSalonHero from "../components/home/HomeSalonHero";
import HomeHeader from "../components/home/HomeHeader";
import HomeClientFocusCard from "../components/home/HomeClientFocusCard";
import HomeDossier from "../components/home/HomeDossier";
import HomeAppointmentFlow from "../components/home/HomeAppointmentFlow";
import HomeKpiCards from "../components/home/HomeKpiCards";
import HomeIntelligenceInsights from "../components/home/HomeIntelligenceInsights";
import styles from "./page.module.css";
import { HomeBridge } from "../bridges/HomeBridge";
import { useAuthContext } from "@/providers/AuthProvider";

const stylistPhotos = [
  "/img/booking/betzabe-valdebenito.webp",
  "/img/booking/Coca-Carvajal.webp",
  "/img/booking/Constanza-Carrasco.webp",
  "/img/booking/Dafne-Urrutia.webp",
  "/img/booking/danae-albrecht.webp",
  "/img/booking/liz-bascunan.webp",
  "/img/booking/tiare-pena.webp",
];

function stylistPhotoFor(name: string) {
  const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return stylistPhotos[hash % stylistPhotos.length];
}

function getStylistFullName(name: string) {
  const clean = name.trim().toLowerCase();
  if (clean === "sofia" || clean === "sofía" || clean === "sofia lara" || clean === "sofía lara") return "Sofía Lara";
  if (clean === "martina" || clean === "martina salas") return "Martina Salas";
  if (clean === "renata" || clean === "renata ibarra") return "Renata Ibarra";
  if (clean === "valentina" || clean === "valentina cruz") return "Valentina Cruz";
  if (clean === "betzabe" || clean === "betzabé" || clean === "betzabe valdebenito" || clean === "betzabé valdebenito") return "Betzabé Valdebenito";
  if (clean === "coca" || clean === "coca carvajal") return "Coca Carvajal";
  if (clean === "constanza" || clean === "constanza carrasco") return "Constanza Carrasco";
  if (clean === "dafne" || clean === "dafne urrutia") return "Dafne Urrutia";
  if (clean === "danae" || clean === "danae albrecht") return "Danae Albrecht";
  if (clean === "liz" || clean === "liz bascuñan" || clean === "liz bascunan" || clean === "liz bascuñán") return "Liz Bascuñán";
  if (clean === "tiare" || clean === "tiare peña" || clean === "tiare pena") return "Tiare Peña";
  return name;
}

function formatClientName(name: string) {
  if (!name) return "";
  
  const lowerName = name.toLowerCase();
  if (lowerName.includes("sendme") || lowerName.includes("whatsapp") || lowerName.includes("studio")) {
    return name;
  }
  
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return name;
  
  const isLatin = /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/.test(name);
  if (!isLatin) {
    return parts.slice(0, 2).join(" ");
  }

  if (parts.length === 2) {
    return parts[0] + " " + parts[1];
  }
  
  const middleNames = new Set([
    "maria", "maría", "jose", "josé", "ana", "luis", "juan", "carlos", "antonio", "andres", "andrés", 
    "alejandro", "alejandra", "beatriz", "camila", "carolina", "daniel", "daniela", "eduardo", "felipe", 
    "fernando", "fernanda", "gabriel", "gabriela", "ignacio", "javier", "javiera", "jorge", "manuel", 
    "miguel", "patricia", "pedro", "roberto", "sebastian", "sebastián", "sofia", "sofía", "valentina", 
    "victor", "víctor", "victoria", "pablo", "lucia", "lucía", "isabel", "elena", "carmen", "rosa", "francisco",
    "del", "de", "la", "las", "y"
  ]);
  
  const firstPart = parts[0];
  const secondPartLower = parts[1].toLowerCase();
  
  if (middleNames.has(secondPartLower) && parts.length > 2) {
    if ((secondPartLower === "de" || secondPartLower === "la" || secondPartLower === "del") && parts.length > 2) {
      return firstPart + " " + parts[1] + " " + parts[2];
    }
    return firstPart + " " + parts[2];
  }
  
  return firstPart + " " + parts[1];
}

/** Display name: abbreviates middle names to initials.
 *  "Maria Jose Valdes" → "Maria J. Valdes"
 *  "Ana Lopez" → "Ana Lopez"
 *  "Maria Jose Fernanda Valdes" → "Maria J. Valdes"
 */
function formatDisplayName(name: string): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 2) return name;
  // parts.length >= 3: keep first name, abbreviate second name to initial, keep last name
  const first = parts[0];
  const middleInitial = parts[1].charAt(0).toUpperCase() + ".";
  const last = parts[parts.length - 1];
  return `${first} ${middleInitial} ${last}`;
}

function getStageIcon(stage: string) {
  const lower = stage.toLowerCase();
  if (lower.includes("inbox") || lower.includes("reserva")) {
    return <MessageSquare size={16} strokeWidth={1.8} />;
  }
  if (lower.includes("upgrade")) {
    return <Sparkles size={16} strokeWidth={1.8} />;
  }
  if (lower.includes("diag") || lower.includes("esperando")) {
    return <Clock3 size={16} strokeWidth={1.8} />;
  }
  if (lower.includes("cierre") || lower.includes("completado")) {
    return <CheckCircle2 size={16} strokeWidth={1.8} />;
  }
  if (lower.includes("procesando") || lower.includes("color")) {
    return <Activity size={16} strokeWidth={1.8} />;
  }
  return <CalendarDays size={16} strokeWidth={1.8} />;
}



const defaultSelectedAppointmentId = "";

type StoredAppointment = {
  id: string;
  customerName?: string;
  clientName?: string;
  service: string;
  serviceName?: string;
  stylist?: string;
  specialist?: string;
  time: string;
  startTime?: string;
  status?: string;
  date?: string;
};

type CalendarAppointmentDisplay = {
  id: string;
  customerName: string;
  serviceName: string;
  stylistName: string;
  startTime: string;
  status: string;
  date: string;
  source: string;
};

type PlatformHealth = {
  score: number;
  status: "Excellent" | "Healthy" | "Warning" | "Critical";
  detail: string;
};

type ArrivalRecord = {
  arrivedAt: string;
  deltaMinutes: number;
};

function chileMinutesNow(date: Date) {
  const parts = new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Santiago",
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);

  return hour * 60 + minute;
}

function appointmentMinutes(time: string) {
  const [hour = "0", minute = "0"] = time.split(":");

  return Number(hour) * 60 + Number(minute);
}

function appointmentProgress(time: string, now: Date) {
  const currentMinutes = chileMinutesNow(now);
  const targetMinutes = appointmentMinutes(time);
  const progress = targetMinutes <= 0 ? 100 : Math.min(100, Math.max(0, (currentMinutes / targetMinutes) * 100));
  const remainingMinutes = targetMinutes - currentMinutes;

  if (remainingMinutes <= 0) {
    return { label: "Hora cumplida", progress: 100 };
  }

  const hours = Math.floor(remainingMinutes / 60);
  const minutes = remainingMinutes % 60;
  const label =
    hours > 0
      ? `Faltan ${hours}h ${minutes.toString().padStart(2, "0")}m`
      : `Faltan ${minutes}m`;

  return { label, progress };
}

/** Today's date string in Chile timezone (YYYY-MM-DD) */
function chileDateStr(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("es-CL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Santiago",
  }).formatToParts(now);
  const year = parts.find((p) => p.type === "year")?.value ?? "2026";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

function chileTimeLabel(date: Date) {
  return new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Santiago",
  }).format(date);
}

function arrivalBehaviorLabel(record?: ArrivalRecord) {
  if (!record) {
    return "Sin registro de llegada";
  }

  const minutes = Math.abs(record.deltaMinutes);

  if (record.deltaMinutes <= -5) {
    return `Llegó ${minutes} min antes`;
  }

  if (record.deltaMinutes >= 5) {
    return `Llegó ${minutes} min tarde`;
  }

  return "Llegó a tiempo";
}

function calculatePlatformHealth(): PlatformHealth {
  if (typeof window === "undefined") {
    return { score: 92, status: "Healthy", detail: "Delivery quality stable" };
  }

  try {
    const templates = JSON.parse(window.localStorage.getItem("campaigns:meta-templates") ?? "[]") as { metaStatus?: string }[];
    const history = JSON.parse(window.localStorage.getItem("campaigns:template-health-history") ?? "[]") as { riskLevel?: string }[];
    const rejected = templates.filter((template) => template.metaStatus === "rejected").length;
    const highRisk = history.filter((record) => record.riskLevel === "High Risk").length;
    const mediumRisk = history.filter((record) => record.riskLevel === "Medium Risk").length;
    const score = Math.max(38, Math.min(98, 96 - rejected * 9 - highRisk * 10 - mediumRisk * 4));
    const status = score >= 94 ? "Excellent" : score >= 82 ? "Healthy" : score >= 64 ? "Warning" : "Critical";

    return {
      score,
      status,
      detail:
        status === "Excellent"
          ? "Templates, read quality and engagement look strong"
          : status === "Healthy"
            ? "Delivery quality stable"
            : status === "Warning"
              ? "Review rejection and spam-risk signals"
              : "Pause and review campaign compliance",
    };
  } catch {
    return { score: 92, status: "Healthy", detail: "Delivery quality stable" };
  }
}

export default function Home() {
  const router = useRouter();
  const { isSuperAdmin, isLoading: authLoading } = useAuthContext();
  const [gateResolved, setGateResolved] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const imp = params.get("impersonating") === "true" && !!params.get("tenantId");
    setIsImpersonating(imp);
  }, []);

  useEffect(() => {
    if (authLoading || gateResolved) return;
    if (isSuperAdmin && !isImpersonating) {
      setGateResolved(true);
      router.replace("/admin");
    } else {
      setGateResolved(true);
    }
  }, [authLoading, isSuperAdmin, isImpersonating, router, gateResolved]);

  if (!gateResolved) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          color: "rgba(20, 18, 28, 0.5)",
          fontFamily: "system-ui, sans-serif",
          fontSize: 14,
        }}
      >
        Cargando...
      </div>
    );
  }

  return <HomeContent />;
}

function HomeContent() {
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(defaultSelectedAppointmentId);
  const [bookedAppointments, setBookedAppointments] = useState<StoredAppointment[]>([]);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [kpiMetrics, setKpiMetrics] = useState([
    { label: "Ventas hoy", value: "$0", detail: "Sin datos disponibles", icon: Wallet },
    { label: "Potencial", value: "$0", detail: "Sin datos disponibles", icon: BarChart3 },
    { label: "Ocupación", value: "0%", detail: "Sin datos disponibles", icon: CalendarDays },
  ]);
  const [platformHealth, setPlatformHealth] = useState<PlatformHealth>({
    score: 0,
    status: "Healthy",
    detail: "Esperando datos del negocio",
  });
  // ── Demo fallback state (kept for reference, no longer shown) ──
  const [useDemo, setUseDemo] = useState(true);
  const [demoResolved, setDemoResolved] = useState(false);
  // ── Empty data flag — true when no real data exists ──
  const [isEmpty, setIsEmpty] = useState(false);

  const activeAppointments = bookedAppointments;
  const activeKpiMetrics = kpiMetrics;
  const activePlatformHealth = platformHealth;
  // Phase B-3: W3 Weather — state initialized with fallback hardcoded weather
  const [weatherData, setWeatherData] = useState<{ city: string; temperature: string }>({
    city: 'Santiago',
    temperature: '18°C',
  });
  const [feedIndex, setFeedIndex] = useState(0);
  const [modoTecnico, setModoTecnico] = useState(false);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  // Phase D-1: W8 Emotional Profile — bridge-sourced data, null means use legacy
  const [emotionalProfileFromBridge, setEmotionalProfileFromBridge] = useState<{
    decisionStyle: string;
    responseStyle: string;
    idealTone: string;
    anxietyLevel: string;
    priceSensitivity: string;
    visualValidation: string;
  } | null>(null);
  // Phase D-2: W9 Material Intelligence — bridge-sourced data, null means use legacy
  const [materialIntelligenceFromBridge, setMaterialIntelligenceFromBridge] = useState<{
    avgCost: string;
    brands: string[];
    colorations: string;
    sessionTime: string;
    margin: string;
  } | null>(null);
  // Phase D-3: W10 Customer LTV — bridge-sourced data, null means use legacy
  const [lifetimeValueFromBridge, setLifetimeValueFromBridge] = useState<{
    ltv: string;
    avgTicket: string;
    annualVisits: string;
    repurchase: string;
  } | null>(null);
  // Phase D-4: W12 AI Alerts — bridge-sourced data, null means use legacy
  const [aiAlertsFromBridge, setAiAlertsFromBridge] = useState<string[] | null>(null);
  // Phase D-5: W13 AI Recommendation — bridge-sourced data, null means use legacy
  const [aiRecommendationsFromBridge, setAiRecommendationsFromBridge] = useState<string[] | null>(null);
  // Phase D-6: W14 Technical History — bridge-sourced data, null means use legacy
  const [technicalHistoryFromBridge, setTechnicalHistoryFromBridge] = useState<{
    tonesUsed: string;
    recentServices: string;
    observations: string;
    preferences: string;
  } | null>(null);
  // Phase F: Intelligence Insights — bridge-sourced business insights
  const [intelligenceInsightsFromBridge, setIntelligenceInsightsFromBridge] = useState<import("../agents/home/intelligence/types").Insight[] | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkState = () => {
      setModoTecnico(window.localStorage.getItem("modo-tecnico-ia") === "true");
    };
    checkState();
    window.addEventListener("modo-tecnico-ia-changed", checkState);
    return () => window.removeEventListener("modo-tecnico-ia-changed", checkState);
  }, []);

  // ── Derived constants ──
  const headerFeed = [
    { title: "Prioridad operacional", subtitle: "La IA detecta oportunidad, riesgo o atención inmediata." },
    { title: "Oportunidad de Venta", subtitle: "Revisa clientas con potencial de upselling hoy." },
    { title: "Optimización de Agenda", subtitle: "Gestiona bloques libres para maximizar ocupación." },
  ];

  const renderBilingual = (value: string, labelClassName?: string) => {
    if (!value) return null;
    const parts = value.split(" / ");
    const es = parts[0] || "";
    const en = parts[1] || "";
    if (!modoTecnico || !en) {
      return <span className={labelClassName}>{es}</span>;
    }
    return (
      <span className={styles.bilingualStack}>
        <span className={labelClassName}>{es}</span>
        <span className={styles.subLabelEn}>{en.toUpperCase()}</span>
      </span>
    );
  };

  useEffect(() => {
    const feedInterval = window.setInterval(() => {
      setFeedIndex((prev) => (prev + 1) % headerFeed.length);
    }, 30000);

    return () => window.clearInterval(feedInterval);
  }, []);

  const currentTimeString = currentTime.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Santiago",
  });

  const dayNameShort = currentTime.toLocaleDateString("es-CL", { weekday: "short", timeZone: "America/Santiago" });
  const dayFormatted = dayNameShort.charAt(0).toUpperCase() + dayNameShort.slice(1).replace(".", "");
  const dayNum = currentTime.toLocaleDateString("es-CL", { day: "numeric", timeZone: "America/Santiago" });
  const monthNameShort = currentTime.toLocaleDateString("es-CL", { month: "short", timeZone: "America/Santiago" });
  const monthFormatted = monthNameShort.charAt(0).toUpperCase() + monthNameShort.slice(1).replace(".", "");
  const currentFormattedDate = `${dayFormatted}, ${dayNum} ${monthFormatted}`;
  const [arrivalRecords, setArrivalRecords] = useState<Record<string, ArrivalRecord>>(() => {
    if (typeof window === "undefined") {
      return {};
    }

    try {
      const storedRecords = window.localStorage.getItem("dashboard:arrival-records");

      return storedRecords ? (JSON.parse(storedRecords) as Record<string, ArrivalRecord>) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const loadAppointments = async () => {
      setIsLoadingAppointments(true);
      try {
        const [apptsRes, calApptsRes] = await Promise.all([
          fetch("/api/appointments"),
          fetch("/api/calendar/appointments"),
        ]);
        const apptsData = apptsRes.ok ? (await apptsRes.json()) as StoredAppointment[] : [];
        const calApptsData = calApptsRes.ok ? (await calApptsRes.json()) as CalendarAppointmentDisplay[] : [];

        // Only show today's appointments
        const todayLocal = chileDateStr();

        // Merge: calendar appointments are the primary source, legacy appointments fill gaps
        const seenIds = new Set<string>();
        const merged: StoredAppointment[] = [];

        for (const cal of calApptsData) {
          if (cal.date !== todayLocal) continue;
          seenIds.add(cal.id);
          merged.push({
            id: cal.id,
            customerName: cal.customerName,
            service: cal.serviceName,
            time: cal.startTime,
            status: cal.status,
            stylist: cal.stylistName || "",
            date: cal.date,
          });
        }

        // Add legacy appointments (same date filter) not already in calendar-store
        for (const a of apptsData) {
          if (a.date && a.date !== todayLocal) continue;
          if (!seenIds.has(a.id)) {
            merged.push(a);
          }
        }

        if (!isCancelled) {
          setBookedAppointments(merged);
          // Determine if real data exists
          const hasRealAppointments = merged.length > 0;
          const hasRealKPIs = kpiMetrics.some(m => m.value !== "$0" && m.detail !== "Sin datos disponibles");
          if (hasRealAppointments || hasRealKPIs) {
            setUseDemo(false);
            setIsEmpty(false);
          } else {
            // Resolved with no data — show empty state instead of demo
            setIsEmpty(true);
          }
          setDemoResolved(true);
        }
      } catch {
        // Keep empty state when local JSON is unavailable.
      } finally {
        if (!isCancelled) {
          setIsLoadingAppointments(false);
        }
      }
    };

    void loadAppointments();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    const loadPlatformHealth = async () => {
      // Phase 2.7: Try bridge first; fallback to legacy if disabled or fails
      const bridge = new HomeBridge();
      try {
        const result = await bridge.getPlatformHealth();
        if (result.success && result.data) {
          setPlatformHealth(result.data);
          return;
        }
      } catch {
        // Bridge error — fall through to legacy
      }
      // Legacy: direct inline calculation
      setPlatformHealth(calculatePlatformHealth());
    };

    void loadPlatformHealth();
  }, []);

  // Phase C-1B: W7 KPI Metrics — try HomeMetricsAgent first, fallback to bridge repository, then legacy inline
  useEffect(() => {
    const loadKpiMetrics = async () => {
      const bridge = new HomeBridge();
      try {
        // First try: HomeMetricsAgent with real AppointmentRepository data
        const metricsResult = await bridge.getMetricsSnapshot();
        if (metricsResult.success && metricsResult.data) {
          const m = metricsResult.data;
          // Map MetricsSnapshot (7 metrics) to 3 KPI card shapes
          // Ventas hoy = completedAppointments × averageTicket
          const ventasHoy = m.completedAppointments * m.averageTicket.value;
          const formattedVentas = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(ventasHoy);
          // Potencial = upcoming × averageTicket
          const potential = (m.totalAppointments - m.completedAppointments) * m.averageTicket.value;
          const formattedPotential = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(potential);
          // Ocupación = completed / total
          const ocupacion = m.totalAppointments > 0 ? Math.round((m.completedAppointments / m.totalAppointments) * 100) : 0;
          setKpiMetrics([
            { label: "Ventas hoy", value: formattedVentas, detail: `${m.completedAppointments} servicios completados`, icon: Wallet },
            { label: "Potencial", value: formattedPotential, detail: `${m.totalAppointments - m.completedAppointments} servicios pendientes`, icon: BarChart3 },
            { label: "Ocupación", value: `${ocupacion}%`, detail: `${m.completedAppointments} de ${m.totalAppointments} servicios`, icon: CalendarDays },
          ]);
          return;
        }
      } catch {
        // MetricsAgent error — fall through to next try
      }

      // Second try: KpiMetricsRepository via bridge (legacy bridge path)
      try {
        const result = await bridge.getKpiMetrics();
        if (result.success && result.data) {
          // Map repository data (no icons) to UI data (with icons)
          const iconMap: Record<string, React.ElementType> = {
            'Ventas hoy': Wallet,
            'Potencial': BarChart3,
            'Ocupación': CalendarDays,
          };
          const mapped = result.data.all.map((m) => ({
            ...m,
            icon: iconMap[m.label] ?? Wallet,
          })) as any;
          setKpiMetrics(mapped);
          return;
        }
      } catch {
        // Bridge error — fall through to legacy
      }

      // Legacy: keep the inline metrics array (already the default state)
    };

    void loadKpiMetrics();
  }, []);

  // Phase D-1: W8 Emotional Profile — try HomeAIInsightAgent, fallback to inline clientIntelligence
  useEffect(() => {
    if (!selectedAppointmentId) return;
    const loadEmotionalProfile = async () => {
      const bridge = new HomeBridge();
      try {
        const result = await bridge.getEmotionalProfile(selectedAppointmentId);
        if (result.success && result.data) {
          setEmotionalProfileFromBridge(result.data);
          return;
        }
      } catch {
        // Bridge error — fall through to legacy
      }
      // Fallback: null keeps using inline intel.emotionalProfile (already default state)
      setEmotionalProfileFromBridge(null);
    };

    void loadEmotionalProfile();
  }, [selectedAppointmentId]);

  // Phase D-2: W9 Material Intelligence — try HomeAIInsightAgent, fallback to inline clientIntelligence
  useEffect(() => {
    if (!selectedAppointmentId) return;
    const loadMaterialIntelligence = async () => {
      const bridge = new HomeBridge();
      try {
        const result = await bridge.getMaterialIntelligence(selectedAppointmentId);
        if (result.success && result.data) {
          setMaterialIntelligenceFromBridge(result.data);
          return;
        }
      } catch {
        // Bridge error — fall through to legacy
      }
      // Fallback: null keeps using inline intel.materialIntelligence (already default state)
      setMaterialIntelligenceFromBridge(null);
    };

    void loadMaterialIntelligence();
  }, [selectedAppointmentId]);

  // Phase D-3: W10 Customer LTV — try HomeAIInsightAgent, fallback to inline clientIntelligence
  useEffect(() => {
    if (!selectedAppointmentId) return;
    const loadLifetimeValue = async () => {
      const bridge = new HomeBridge();
      try {
        const result = await bridge.getLifetimeValue(selectedAppointmentId);
        if (result.success && result.data) {
          setLifetimeValueFromBridge(result.data);
          return;
        }
      } catch {
        // Bridge error — fall through to legacy
      }
      // Fallback: null keeps using inline intel.lifetimeValue (already default state)
      setLifetimeValueFromBridge(null);
    };

    void loadLifetimeValue();
  }, [selectedAppointmentId]);

  // Phase D-4: W12 AI Alerts — try HomeAIInsightAgent, fallback to inline clientIntelligence
  useEffect(() => {
    if (!selectedAppointmentId) return;
    const loadAiAlerts = async () => {
      const bridge = new HomeBridge();
      try {
        const result = await bridge.getAIAlerts(selectedAppointmentId);
        if (result.success && result.data) {
          setAiAlertsFromBridge(result.data);
          return;
        }
      } catch {
        // Bridge error — fall through to legacy
      }
      // Fallback: null keeps using inline intel.aiAlerts (already default state)
      setAiAlertsFromBridge(null);
    };

    void loadAiAlerts();
  }, [selectedAppointmentId]);

  // Phase D-5: W13 AI Recommendation — try HomeAIInsightAgent, fallback to inline clientIntelligence
  useEffect(() => {
    if (!selectedAppointmentId) return;
    const loadAiRecommendations = async () => {
      const bridge = new HomeBridge();
      try {
        const result = await bridge.getAIRecommendations(selectedAppointmentId);
        if (result.success && result.data) {
          setAiRecommendationsFromBridge(result.data);
          return;
        }
      } catch {
        // Bridge error — fall through to legacy
      }
      // Fallback: null keeps using inline intel.aiRecommendations (already default state)
      setAiRecommendationsFromBridge(null);
    };

    void loadAiRecommendations();
  }, [selectedAppointmentId]);

  // Phase D-6: W14 Technical History — try HomeAIInsightAgent, fallback to inline clientIntelligence
  useEffect(() => {
    if (!selectedAppointmentId) return;
    const loadTechnicalHistory = async () => {
      const bridge = new HomeBridge();
      try {
        const result = await bridge.getTechnicalHistory(selectedAppointmentId);
        if (result.success && result.data) {
          setTechnicalHistoryFromBridge(result.data);
          return;
        }
      } catch {
        // Bridge error — fall through to legacy
      }
      // Fallback: null keeps using inline intel.technicalHistory (already default state)
      setTechnicalHistoryFromBridge(null);
    };

    void loadTechnicalHistory();
  }, [selectedAppointmentId]);

  // Phase F: Intelligence Insights — try bridge, fallback to empty
  useEffect(() => {
    const loadIntelligenceInsights = async () => {
      const bridge = new HomeBridge();
      try {
        const result = await bridge.getIntelligenceInsights();
        if (result.success && result.data) {
          setIntelligenceInsightsFromBridge(result.data);
          return;
        }
      } catch {
        // Bridge error — fall through to null
      }
      // Fallback: null — widget hides itself when no insights
      setIntelligenceInsightsFromBridge(null);
    };

    void loadIntelligenceInsights();
  }, []);

  // Phase B-3: W3 Weather — try bridge, fallback to legacy hardcoded weather
  useEffect(() => {
    const loadWeather = async () => {
      const bridge = new HomeBridge();
      try {
        const result = await bridge.getWeather();
        if (result.success && result.data) {
          const w = result.data;
          setWeatherData({ city: w.city, temperature: w.temperature });
          return;
        }
      } catch {
        // Bridge error — fall through to legacy
      }
      // Legacy: keep the hardcoded weather (already the default state)
    };
    void loadWeather();
  }, []);

  // Phase 2.6: Read-only agent observation refs — never render, never affect UI
  const dataSourceRef = useRef<{ sources?: unknown[]; error?: string }>({});
  const inspectorRef = useRef<{ summary?: unknown; error?: string }>({});
  const healthCheckRef = useRef<{ summary?: unknown; error?: string }>({});
  // Phase B-4: W4 Learning Signals — dedup ref to prevent duplicate events
  const lastSelectionRef = useRef<string | null>(null);

  // Phase B-4: W4 Learning Signals — emit appointment_selected event to HomeLearningAgent
  const emitAppointmentSelected = (item: typeof liveAppointments[number]) => {
    // Skip emission for demo data
    if (useDemo) return;
    // Dedup: skip if same appointment already emitted
    if (lastSelectionRef.current === item.id) return;
    lastSelectionRef.current = item.id;

    const bridge = new HomeBridge();
    // Derive service category and price tier from service name
    const serviceLower = item.service.toLowerCase();
    const serviceCategory =
      serviceLower.includes('balayage') || serviceLower.includes('color') || serviceLower.includes('tinte') || serviceLower.includes('mechas')
        ? 'coloracion'
        : serviceLower.includes('corte') || serviceLower.includes('peinado')
          ? 'corte'
          : serviceLower.includes('tratamiento') || serviceLower.includes('olaplex') || serviceLower.includes('ritual')
            ? 'tratamiento'
            : serviceLower.includes('keratina') || serviceLower.includes('alisado')
              ? 'alisado'
              : 'general';
    const priceTier =
      serviceLower.includes('balayage') || serviceLower.includes('olaplex') || serviceLower.includes('premium')
        ? 'premium'
        : serviceLower.includes('corte') || serviceLower.includes('peinado')
          ? 'basico'
          : 'estandar';

    // Use stylist field (real) or stylistName (mock) as available
    const stylist = item.stylist || (item as Record<string, unknown>).stylistName as string || '';

    bridge.enqueueAppointmentEvent({
      appointmentId: item.id,
      clientName: item.client,
      service: item.service,
      serviceCategory,
      stylist,
      priceTier,
      priorityLabel: item.priorityLabel || '',
      timeSlot: item.time || '',
      status: item.status || '',
      isMock: !!item.isMock,
    });
  };

  useEffect(() => {
    const bridge = new HomeBridge();
    let cancelled = false;

    const observe = async () => {
      // HomeDataSourceAgent — maps widget data sources
      const dsResult = await bridge.getDataSource();
      if (!cancelled) {
        dataSourceRef.current = dsResult.success
          ? { sources: dsResult.data ?? [] }
          : { error: dsResult.error ?? 'Unknown error' };
        console.log('[Observation] HomeDataSourceAgent:', dataSourceRef.current);
      }

      // HomeInspectorAgent — inspects widget problems
      const insResult = await bridge.runInspection();
      if (!cancelled) {
        inspectorRef.current = insResult.success
          ? { summary: insResult.data ?? {} }
          : { error: insResult.error ?? 'Unknown error' };
        console.log('[Observation] HomeInspectorAgent:', inspectorRef.current);
      }

      // HomeHealthCheckAgent — verifies Home readiness
      const hcResult = await bridge.runHealthCheck();
      if (!cancelled) {
        healthCheckRef.current = hcResult.success
          ? { summary: hcResult.data ?? {} }
          : { error: hcResult.error ?? 'Unknown error' };
        console.log('[Observation] HomeHealthCheckAgent:', healthCheckRef.current);
      }
    };

    observe();

    return () => { cancelled = true; };
  }, []);

  const liveAppointments = [
    ...activeAppointments.map((item) => {
      const rawClientName = item.customerName ?? item.clientName ?? "Cliente WhatsApp";
      const clientName = formatDisplayName(rawClientName);
      const stylistName = getStylistFullName(item.stylist ?? item.specialist ?? "SendMe Studio");

      return {
        id: item.id,
        time: item.time,
        client: clientName,
        service: item.service,
        status: item.status === "confirmed" ? "Confirmada" : item.status === "pending" ? "Pendiente" : item.status ?? "Pendiente",
        tone: "next",
        stylist: stylistName,
        stylistImage: stylistPhotoFor(stylistName),
        stage: "Reserva desde Inbox",
        priorityLabel: "Reserva conversacional",
        ltv: "Nuevo",
        repurchase: "0%",
        recommendation: "Confirmar asistencia y preparar ficha de diagnostico.",
        impact: "Booking",
        isMock: false, // Phase 2.8: Real API data
        dossierSections: [
          { label: "Origen", value: "Inbox WhatsApp" },
          { label: "IA recomienda", value: "Enviar recordatorio suave antes de la visita." },
        ],
      };
    }),
  ];

  // Phase B-4: Emit initial appointment_selected when liveAppointments settles
  useEffect(() => {
    if (liveAppointments.length > 0) {
      const initial = liveAppointments.find((item) => item.id === selectedAppointmentId) ?? liveAppointments[0];
      if (initial) {
        emitAppointmentSelected(initial);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveAppointments.length]);

  const selectedAppointment =
    liveAppointments.find((item) => item.id === selectedAppointmentId) ??
    liveAppointments[0];

  // Safe fallback when no appointments exist (e.g. static build prerender)
  const noAppts = !selectedAppointment && !useDemo;
  const safeAppt = selectedAppointment ?? liveAppointments[0] ?? {
    id: "empty",
    time: "00:00",
    client: "Sin reservas hoy",
    service: "—",
    status: "—",
    tone: "neutral",
    stylist: "—",
    stylistImage: "",
    stage: "Esperando actividad",
    priorityLabel: "",
    ltv: "",
    repurchase: "",
    recommendation: "Las reservas aparecerán aquí cuando clientes agenden desde WhatsApp.",
    impact: "",
    isMock: false,
    dossierSections: [],
  };
  const defaultIntel = {
    emotionalProfile: {
      decisionStyle: "Pendiente de evaluación",
      responseStyle: "Pendiente de evaluación",
      idealTone: "Cálido y profesional",
      anxietyLevel: "Bajo",
      priceSensitivity: "Media",
      visualValidation: "Alta"
    },
    materialIntelligence: {
      avgCost: "$0",
      brands: [] as string[],
      colorations: "Por determinar",
      sessionTime: "2h",
      margin: "0%"
    },
    lifetimeValue: {
      ltv: "Nuevo",
      avgTicket: "Por determinar",
      annualVisits: "0",
      repurchase: "0%"
    },
    aiAlerts: ["Seguimiento pendiente"],
    aiRecommendations: ["Completar ficha de cliente para obtener recomendaciones"],
    technicalHistory: {
      tonesUsed: "Por determinar",
      recentServices: "Primera visita",
      observations: "Sin datos",
      preferences: "Sin datos"
    }
  };
  const intel = defaultIntel;
  // Phase D-1: W8 uses bridge-sourced emotional profile when available, falls back to inline clientIntelligence
  const ep = emotionalProfileFromBridge ?? intel.emotionalProfile;
  // Phase D-2: W9 uses bridge-sourced material intelligence when available, falls back to inline clientIntelligence
  const mi = materialIntelligenceFromBridge ?? intel.materialIntelligence;
  // Phase D-3: W10 uses bridge-sourced lifetime value when available, falls back to inline clientIntelligence
  const clv = lifetimeValueFromBridge ?? intel.lifetimeValue;
  // Phase D-4: W12 uses bridge-sourced AI alerts when available, falls back to inline clientIntelligence
  const alerts = aiAlertsFromBridge ?? intel.aiAlerts;
  // Phase D-5: W13 uses bridge-sourced AI recommendations when available, falls back to inline clientIntelligence
  const recs = aiRecommendationsFromBridge ?? intel.aiRecommendations;
  // Phase D-6: W14 uses bridge-sourced technical history when available, falls back to inline clientIntelligence
  const th = technicalHistoryFromBridge ?? intel.technicalHistory;
  const dossierByLabel = Object.fromEntries(
    safeAppt.dossierSections.map((item) => [item.label, item.value])
  );
  const emotionalProfile = dossierByLabel["Perfil emocional"] ?? "Perfil en observación. Mantener tono claro, cálido y seguro.";
  const favoriteServices = dossierByLabel["Servicios favoritos"] ?? safeAppt.service;
  const riskSignal = dossierByLabel["Riesgo"] ?? "Riesgo bajo si se mantiene seguimiento oportuno.";
  const aiDossierRecommendation = dossierByLabel["IA recomienda"] ?? safeAppt.recommendation;
  const lastInteraction = dossierByLabel["Última visita"] ?? dossierByLabel["Origen"] ?? "Interacción reciente por revisar.";
  const suggestedNextAction = safeAppt.recommendation;
  const reservationProgress = appointmentProgress(safeAppt.time, currentTime);
  const isRealClient = !safeAppt.isMock; // Phase B-2: W5 safe placeholder for real clients without dossier
  const selectedArrivalRecord = arrivalRecords[safeAppt.id];
  const selectedArrivalLabel = arrivalBehaviorLabel(selectedArrivalRecord);
  const registerArrival = () => {
    if (useDemo) return;
    const now = new Date();
    const arrivalRecord = {
      arrivedAt: now.toISOString(),
      deltaMinutes: chileMinutesNow(now) - appointmentMinutes(safeAppt.time),
    };
    const nextRecords = {
      ...arrivalRecords,
      [safeAppt.id]: arrivalRecord,
    };

    setArrivalRecords(nextRecords);
    window.localStorage.setItem("dashboard:arrival-records", JSON.stringify(nextRecords));
    setCurrentTime(now);

    // Phase 2.5: Forward arrival to HomeLearningAgent (additive, never throws)
    const bridge = new HomeBridge();
    const offset = arrivalRecord.deltaMinutes;
    const status = offset < -5 ? 'early' : offset > 10 ? 'late' : 'on-time';
    bridge.enqueueArrivalEvent({
      appointmentId: safeAppt.id,
      clientName: safeAppt.client,
      minutesOffset: offset,
      timestamp: arrivalRecord.arrivedAt,
      status,
    });
  };

  return (
    <AppShell>
    <div className={styles.page}>
      <div className={styles.intelligenceShell}>
        <div className={styles.intelligenceContent}>
          <HomeAppointmentFlow
            appointments={liveAppointments}
            selectedAppointmentId={safeAppt.id}
            isLoadingAppointments={isLoadingAppointments}
            onSelectAppointment={(id, item) => {
              setSelectedAppointmentId(id);
              emitAppointmentSelected(item as typeof liveAppointments[number]);
            }}
            getStageIcon={getStageIcon}
          />

          <main className={styles.centerColumn}>
            <div className={styles.mainScroll}>
              <HomeSalonHero />

              <HomeHeader
                feedIndex={feedIndex}
                headerFeed={headerFeed}
                weatherData={weatherData}
                currentFormattedDate={currentFormattedDate}
                currentTimeString={currentTimeString}
              />
              {isEmpty && demoResolved && (
                <div className={styles.emptyStateBanner}>
                  <div className={styles.emptyStateBannerInner}>
                    <CalendarDays size={20} strokeWidth={1.5} className={styles.emptyStateIcon} />
                    <div className={styles.emptyStateTitle}>Sin reservas programadas</div>
                    <div className={styles.emptyStateDesc}>
                      Las próximas reservas aparecerán aquí cuando clientes agenden desde WhatsApp o se registren manualmente en la agenda.
                    </div>
                  </div>
                </div>
              )}

              {!isEmpty && (
                <HomeClientFocusCard
                  selectedAppointment={safeAppt}
                  isRealClient={isRealClient}
                  reservationProgress={reservationProgress}
                />
              )}

              <HomeKpiCards
                platformHealth={activePlatformHealth}
                kpiMetrics={activeKpiMetrics}
              />

              {intelligenceInsightsFromBridge && (
                <HomeIntelligenceInsights
                  insights={intelligenceInsightsFromBridge}
                />
              )}
            </div>
          </main>

          <aside className={styles.dossierColumn}>
            <div className={styles.clientScroll}>
              <HomeDossier
                selectedAppointment={safeAppt}
                ep={ep}
                mi={mi}
                clv={clv}
                alerts={alerts}
                recs={recs}
                th={th}
                selectedArrivalLabel={selectedArrivalLabel}
                selectedArrivalRecord={selectedArrivalRecord}
                modoTecnico={modoTecnico}
                registerArrival={registerArrival}
                renderBilingual={renderBilingual}
                chileTimeLabel={chileTimeLabel}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
    </AppShell>
  );
}
