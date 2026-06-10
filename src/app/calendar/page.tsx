"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  X,
  AlertCircle,
  ExternalLink,
  CalendarCheck,
  Pencil,
  User,
  TrendingUp,
  DollarSign,
  CheckCircle,
  XCircle,
  BarChart3,
  ChevronDown,
  UserRound,
  Star,
} from "lucide-react";
import styles from "./calendar.module.css";

/* ── Types ────────────────────────────────────────────── */

type Appointment = {
  id: string;
  customerName: string;
  phone: string;
  serviceName: string;
  stylistId: string;
  stylistName: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  estimatedValue: number;
  status: "pending" | "confirmed" | "cancelled";
  source: "manual" | "ai" | "campaign";
  conversationId?: string;
  createdAt: string;
  updatedAt: string;
};

type StaffMemberInfo = {
  id: string;
  name: string;
  color: string;
  active: boolean;
  role?: string;
};

type ViewMode = "month" | "week" | "day";

/* ── Helpers ──────────────────────────────────────────── */

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
};

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatCurrency(n: number): string {
  return `$${n.toLocaleString("es-CL")}`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return `${d.getDate()} de ${MONTHS[d.getMonth()]}, ${d.getFullYear()}`;
}

/* ── Component ────────────────────────────────────────── */

export default function CalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [staff, setStaff] = useState<StaffMemberInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View state
  const [view, setView] = useState<ViewMode>("week");
  const [today] = useState(todayStr);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return d.getMonth();
  });
  const [currentYear, setCurrentYear] = useState(() => {
    return new Date().getFullYear();
  });

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editAppointment, setEditAppointment] = useState<Appointment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Appointment | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ message: string; action?: { label: string; onClick: () => void } } | null>(null);
  const toastTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Insights state
  const [showInsights, setShowInsights] = useState(false);
  const [insightsPeriod, setInsightsPeriod] = useState<"today" | "week" | "month">("month");

  const showToast = useCallback((message: string, action?: { label: string; onClick: () => void }) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, action });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 5000);
  }, []);

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(null);
    toastTimerRef.current = null;
  }, []);

  // ── Fetch appointments ──────────────────────────
  const fetchAppointments = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/calendar/appointments");
      if (!res.ok) throw new Error("Error al cargar citas");
      const data = (await res.json()) as Appointment[];
      setAppointments(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStaff = useCallback(async () => {
    try {
      const res = await fetch("/api/calendar/staff");
      if (res.ok) {
        const data = (await res.json()) as StaffMemberInfo[];
        setStaff(data);
      }
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
    fetchStaff();
  }, [fetchAppointments, fetchStaff]);

  // ── Filter appointments for selected date ───────
  const dayAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.date === selectedDate && a.status !== "cancelled")
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [appointments, selectedDate]);

  const appointmentsOnDate = useCallback(
    (dateStr: string) => {
      return appointments.filter(
        (a) => a.date === dateStr && a.status !== "cancelled"
      ).length;
    },
    [appointments]
  );

  // ── Navigation ──────────────────────────────────
  const goToToday = useCallback(() => {
    const d = new Date();
    setSelectedDate(todayStr());
    setCurrentMonth(d.getMonth());
    setCurrentYear(d.getFullYear());
  }, []);

  const goPrev = useCallback(() => {
    if (view === "month") {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear((y) => y - 1);
      } else {
        setCurrentMonth((m) => m - 1);
      }
    } else if (view === "week") {
      const d = new Date(selectedDate + "T12:00:00");
      d.setDate(d.getDate() - 7);
      const s = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      setSelectedDate(s);
      setCurrentMonth(d.getMonth());
      setCurrentYear(d.getFullYear());
    } else {
      const d = new Date(selectedDate + "T12:00:00");
      d.setDate(d.getDate() - 1);
      const s = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      setSelectedDate(s);
    }
  }, [view, selectedDate, currentMonth, currentYear]);

  const goNext = useCallback(() => {
    if (view === "month") {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear((y) => y + 1);
      } else {
        setCurrentMonth((m) => m + 1);
      }
    } else if (view === "week") {
      const d = new Date(selectedDate + "T12:00:00");
      d.setDate(d.getDate() + 7);
      const s = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      setSelectedDate(s);
      setCurrentMonth(d.getMonth());
      setCurrentYear(d.getFullYear());
    } else {
      const d = new Date(selectedDate + "T12:00:00");
      d.setDate(d.getDate() + 1);
      const s = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      setSelectedDate(s);
    }
  }, [view, selectedDate, currentMonth, currentYear]);

  // ── Week calculation ────────────────────────────
  const weekDays = useMemo(() => {
    const d = new Date(selectedDate + "T12:00:00");
    const dayOfWeek = d.getDay();
    const start = new Date(d);
    start.setDate(d.getDate() - dayOfWeek);
    const days: { dateStr: string; day: number; name: string; isToday: boolean }[] = [];
    for (let i = 0; i < 7; i++) {
      const cur = new Date(start);
      cur.setDate(start.getDate() + i);
      const ds = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
      days.push({
        dateStr: ds,
        day: cur.getDate(),
        name: WEEKDAYS[cur.getDay()],
        isToday: ds === today,
      });
    }
    return days;
  }, [selectedDate, today]);

  // ── Month days ──────────────────────────────────
  const monthDays = useMemo(() => {
    const dim = daysInMonth(currentYear, currentMonth);
    const fdom = firstDayOfMonth(currentYear, currentMonth);
    const cells: { dateStr: string; day: number; isToday: boolean; isOther: boolean }[] = [];

    // Previous month fill
    const prevDim = daysInMonth(currentYear, currentMonth - 1);
    for (let i = fdom - 1; i >= 0; i--) {
      const d = prevDim - i;
      const m = currentMonth === 0 ? 11 : currentMonth - 1;
      const y = currentMonth === 0 ? currentYear - 1 : currentYear;
      const ds = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ dateStr: ds, day: d, isToday: ds === today, isOther: true });
    }

    // Current month
    for (let d = 1; d <= dim; d++) {
      const ds = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ dateStr: ds, day: d, isToday: ds === today, isOther: false });
    }

    // Next month fill to complete 7 columns
    const rem = 7 - (cells.length % 7);
    if (rem < 7) {
      const m = currentMonth === 11 ? 0 : currentMonth + 1;
      const y = currentMonth === 11 ? currentYear + 1 : currentYear;
      for (let d = 1; d <= rem; d++) {
        const ds = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        cells.push({ dateStr: ds, day: d, isToday: ds === today, isOther: true });
      }
    }

    return cells;
  }, [currentYear, currentMonth, today]);

  // ── Create appointment callback ─────────────────
  const handleCreate = useCallback(
    async (data: {
      customerName: string;
      phone: string;
      serviceName: string;
      date: string;
      startTime: string;
      durationMinutes: number;
      estimatedValue: number;
      status: "pending" | "confirmed" | "cancelled";
    }) => {
      try {
        setError(null);
        const res = await fetch("/api/calendar/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Error al crear cita");
        const result = (await res.json()) as { success: boolean; appointment: { date: string; customerName: string; startTime: string } };
        await fetchAppointments();
        setShowModal(false);

        // Navegar a la fecha de la reserva si es distinta a la actual
        const apptDate = result.appointment.date;
        if (apptDate !== selectedDate) {
          setSelectedDate(apptDate);
          // Sync month/year
          const d = new Date(apptDate + "T12:00:00");
          setCurrentMonth(d.getMonth());
          setCurrentYear(d.getFullYear());
          // Switch to day view to show it
          setView("day");

          const formatted = formatDateDisplay(apptDate);
          showToast(
            `Reserva creada para el ${formatted}. Mostrando esa fecha.`,
            { label: "Ver en agenda", onClick: () => setView("day") }
          );
        } else {
          showToast(
            `Reserva creada para ${result.appointment.customerName} a las ${result.appointment.startTime}.`
          );
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error desconocido");
      }
    },
    [fetchAppointments, selectedDate, showToast]
  );

  // ── Delete appointment ──────────────────────────
  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/calendar/appointments/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Error al eliminar");
        await fetchAppointments();
        setDeleteTarget(null);
        showToast("Reserva eliminada");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error desconocido");
      }
    },
    [fetchAppointments, showToast]
  );

  // ── Update appointment ──────────────────────────
  const handleUpdate = useCallback(
    async (data: {
      customerName: string;
      phone: string;
      serviceName: string;
      stylistId: string;
      stylistName: string;
      date: string;
      startTime: string;
      durationMinutes: number;
      estimatedValue: number;
      status: "pending" | "confirmed" | "cancelled";
    }) => {
      if (!editAppointment) return;
      try {
        setError(null);
        const res = await fetch(`/api/calendar/appointments/${editAppointment.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (res.status === 409) {
          const errBody = await res.json();
          showToast(errBody.message || "Conflicto de horario");
          return;
        }

        if (!res.ok) throw new Error("Error al actualizar reserva");
        const result = await res.json();
        await fetchAppointments();
        setEditAppointment(null);

        // Navegar a la nueva fecha si cambió
        const apptDate = result.appointment.date;
        if (apptDate !== selectedDate) {
          setSelectedDate(apptDate);
          const d = new Date(apptDate + "T12:00:00");
          setCurrentMonth(d.getMonth());
          setCurrentYear(d.getFullYear());
          setView("day");
        }

        showToast("Reserva actualizada correctamente");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error desconocido");
      }
    },
    [editAppointment, fetchAppointments, selectedDate, showToast]
  );

  // ── Insights computation ────────────────────────────────
  type StylistInsight = {
    stylistId: string;
    stylistName: string;
    stylistRole: string;
    assigned: number;
    completed: number;
    cancelled: number;
    pending: number;
    generatedValue: number;
    fulfillmentRate: number;
    internalIndex: number;
  };

  const stylistInsights = useMemo((): StylistInsight[] => {
    // Determine date range
    const now = new Date();
    const today = todayStr();
    let startDate: string;
    let endDate: string;

    if (insightsPeriod === "today") {
      startDate = today;
      endDate = today;
    } else if (insightsPeriod === "week") {
      const d = new Date(now);
      d.setDate(d.getDate() - d.getDay()); // start of week (Sunday)
      startDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const e = new Date(d);
      e.setDate(e.getDate() + 6);
      endDate = `${e.getFullYear()}-${String(e.getMonth() + 1).padStart(2, "0")}-${String(e.getDate()).padStart(2, "0")}`;
    } else {
      // month
      startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    }

    // Group by stylistId
    const map = new Map<string, {
      stylistName: string;
      assigned: number;
      completed: number;
      cancelled: number;
      pending: number;
      generatedValue: number;
    }>();

    // Build a lookup: for each staff member, track all stylistId values that map to them
    // This handles cases where citas have stylistId "renata" and staff has id "renata"
    // or citas have stylistName "Renata" but staff has name "Renata Ibarra"
    for (const a of appointments) {
      if (a.date < startDate || a.date > endDate) continue;

      let sid = a.stylistId || "__unassigned__";

      // Normalize: if this stylistId doesn't match any staff by ID, try matching by name
      if (sid !== "__unassigned__" && !staff.some((s) => s.id === sid)) {
        // Find staff member whose name contains this stylistName or vice versa
        const matchingStaff = staff.find(
          (s) =>
            s.name.toLowerCase().includes(a.stylistName.toLowerCase()) ||
            a.stylistName.toLowerCase().includes(s.name.toLowerCase())
        );
        if (matchingStaff) {
          sid = matchingStaff.id;
        }
      }

      const entry = map.get(sid) || {
        stylistName: a.stylistName || "Sin estilista",
        assigned: 0,
        completed: 0,
        cancelled: 0,
        pending: 0,
        generatedValue: 0,
      };

      entry.assigned++;
      if (a.status === "confirmed") {
        entry.completed++;
        entry.generatedValue += a.estimatedValue || 0;
      } else if (a.status === "cancelled") {
        entry.cancelled++;
      } else if (a.status === "pending") {
        entry.pending++;
      }

      map.set(sid, entry);
    }

    const result: StylistInsight[] = [];

    // First add all staff members from the store
    for (const s of staff) {
      const apptData = map.get(s.id);
      const assigned = apptData?.assigned ?? 0;
      const completed = apptData?.completed ?? 0;
      const cancelled = apptData?.cancelled ?? 0;
      const pending = apptData?.pending ?? 0;
      const generatedValue = apptData?.generatedValue ?? 0;
      const fulfillmentRate = assigned > 0
        ? (completed / assigned) * 100
        : 0;
      const rawIndex = assigned > 0
        ? ((completed - cancelled * 0.5) / assigned) * 100
        : 0;

      result.push({
        stylistId: s.id,
        stylistName: s.name,
        stylistRole: s.role || "Profesional",
        assigned,
        completed,
        cancelled,
        pending,
        generatedValue,
        fulfillmentRate: Math.round(fulfillmentRate),
        internalIndex: Math.max(0, Math.round(rawIndex)),
      });
    }

    // Then add any stylists from appointments not in the staff store
    for (const [, entry] of map) {
      if (!staff.some((s) => s.id === entry.stylistName)) {
        // Use stylistName as key since no ID map
        const fulfillmentRate = entry.assigned > 0
          ? (entry.completed / entry.assigned) * 100
          : 0;
        const rawIndex = entry.assigned > 0
          ? ((entry.completed - entry.cancelled * 0.5) / entry.assigned) * 100
          : 0;
        result.push({
          stylistId: entry.stylistName,
          stylistName: entry.stylistName,
          stylistRole: "Profesional",
          assigned: entry.assigned,
          completed: entry.completed,
          cancelled: entry.cancelled,
          pending: entry.pending,
          generatedValue: entry.generatedValue,
          fulfillmentRate: Math.round(fulfillmentRate),
          internalIndex: Math.max(0, Math.round(rawIndex)),
        });
      }
    }

    // Sort by fulfillment rate descending
    result.sort((a, b) => b.fulfillmentRate - a.fulfillmentRate);
    return result;
  }, [appointments, insightsPeriod, staff]);

  const headerTitle =
    view === "month"
      ? `${MONTHS[currentMonth]} ${currentYear}`
      : formatDateDisplay(selectedDate);

  return (
    <AppShell>
      <div className={styles.page}>
        {/* ── Header ── */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.headerKicker}>Agenda</span>
            <h1 className={styles.headerTitle}>{headerTitle}</h1>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.btnSecondary} onClick={goToToday}>
              Hoy
            </button>
            <button className={styles.btnSecondary} onClick={goPrev}>
              <ChevronLeft size={14} strokeWidth={1.5} />
            </button>
            <button className={styles.btnSecondary} onClick={goNext}>
              <ChevronRight size={14} strokeWidth={1.5} />
            </button>
            <button
              className={styles.btnPrimary}
              onClick={() => setShowModal(true)}
            >
              <Plus size={14} strokeWidth={2} />
              Nueva reserva
            </button>
          </div>
        </div>

        {/* ── Integration Bar ── */}
        <div className={styles.integrationBar}>
          <span>
            <span
              className={styles.integrationDot}
              style={{ background: "#10B981" }}
            />
            <span className={styles.integrationActive}>
              Agenda interna activa
            </span>
          </span>
          <span style={{ color: "rgba(197,184,229,0.4)" }}>·</span>
          <span>
            <span
              className={styles.integrationDot}
              style={{ background: "var(--text-muted)" }}
            />
            <span className={styles.integrationInactive}>
              AgendaPro: No conectado
            </span>
          </span>
          {appointments.length > 0 && (
            <>
              <span style={{ color: "rgba(197,184,229,0.4)" }}>·</span>
              <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                {appointments.filter(a => a.status !== "cancelled").length} citas activas
              </span>
            </>
          )}
        </div>

        {/* ── View Tabs ── */}
        <div className={styles.viewTabs}>
          {(["month", "week", "day"] as const).map((v) => (
            <button
              key={v}
              className={`${styles.viewTab} ${view === v ? styles.viewTabActive : ""}`}
              onClick={() => setView(v)}
            >
              {v === "month" ? "Mes" : v === "week" ? "Semana" : "Día"}
            </button>
          ))}
        </div>

        {/* ── Error ── */}
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              background: "rgba(231,76,60,0.06)",
              border: "1px solid rgba(231,76,60,0.12)",
              borderRadius: "var(--radius-lg)",
              fontSize: "11px",
              color: "#e74c3c",
              marginBottom: "16px",
            }}
          >
            <AlertCircle size={14} strokeWidth={1.5} />
            {error}
          </div>
        )}

        {/* ── Loading ── */}
        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "40vh",
              color: "var(--text-muted)",
              fontSize: "13px",
            }}
          >
            Cargando agenda…
          </div>
        ) : (
          <>
            {/* ── MONTH VIEW ── */}
            {view === "month" && (
              <div className={styles.monthGrid}>
                {WEEKDAYS.map((d) => (
                  <div key={d} className={styles.monthDayHeader}>
                    {d}
                  </div>
                ))}
                {monthDays.map((cell) => {
                  const count = appointmentsOnDate(cell.dateStr);
                  const isSelected = cell.dateStr === selectedDate;
                  return (
                    <div
                      key={cell.dateStr}
                      className={`${styles.monthDay} ${cell.isOther ? styles.monthDayOther : ""} ${cell.isToday ? styles.monthDayToday : ""} ${isSelected ? styles.monthDaySelected : ""}`}
                      onClick={() => {
                        if (!cell.isOther) {
                          setSelectedDate(cell.dateStr);
                          setView("day");
                        }
                      }}
                    >
                      <div className={styles.monthDayNum}>{cell.day}</div>
                      {count > 0 && (
                        <div>
                          {Array.from({ length: Math.min(count, 4) }).map(
                            (_, i) => (
                              <span key={i} className={styles.monthDayDot} />
                            )
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── WEEK VIEW ── */}
            {view === "week" && (
              <>
                <div className={styles.weekGrid}>
                  {weekDays.map((wd) => {
                    const count = appointmentsOnDate(wd.dateStr);
                    const isSelected = wd.dateStr === selectedDate;
                    return (
                      <div
                        key={wd.dateStr}
                        className={`${styles.weekDay} ${wd.isToday ? styles.weekDayToday : ""} ${isSelected ? styles.weekDaySelected : ""}`}
                        onClick={() => setSelectedDate(wd.dateStr)}
                      >
                        <div className={styles.weekDayName}>{wd.name}</div>
                        <div className={styles.weekDayNum}>{wd.day}</div>
                        {count > 0 && (
                          <div className={styles.weekDayCount}>
                            {count} cita{count !== 1 ? "s" : ""}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Appointments for selected week day */}
                <div className={styles.dayHeader}>
                  <div className={styles.dayTitle}>
                    {formatDateDisplay(selectedDate)}
                  </div>
                  <div className={styles.daySubtitle}>
                    {dayAppointments.length} cita
                    {dayAppointments.length !== 1 ? "s" : ""}
                  </div>
                </div>
                <AppointmentList
                  appointments={dayAppointments}
                  staff={staff}
                  onDelete={(appt) => setDeleteTarget(appt)}
                  onEdit={setEditAppointment}
                />
              </>
            )}

            {/* ── DAY VIEW ── */}
            {view === "day" && (
              <>
                <div className={styles.dayHeader}>
                  <div className={styles.dayTitle}>
                    {formatDateDisplay(selectedDate)}
                  </div>
                  <div className={styles.daySubtitle}>
                    {dayAppointments.length} cita
                    {dayAppointments.length !== 1 ? "s" : ""}
                  </div>
                </div>
                <AppointmentList
                  appointments={dayAppointments}
                  staff={staff}
                  onDelete={(appt) => setDeleteTarget(appt)}
                  onEdit={setEditAppointment}
                />
              </>
            )}
          </>
        )}

        {/* ── Team Insights ── */}
        <div className={styles.insightsSection}>
          <button
            className={styles.insightsToggle}
            onClick={() => setShowInsights(!showInsights)}
          >
            <BarChart3 size={14} strokeWidth={1.5} />
            <span>Rendimiento del equipo</span>
            <ChevronDown
              size={14}
              strokeWidth={1.5}
              className={`${styles.insightsChevron} ${showInsights ? styles.insightsChevronOpen : ""}`}
            />
          </button>

          {showInsights && (
            <div className={styles.insightsBody}>
              {/* Period filter */}
              <div className={styles.insightsPeriodFilter}>
                {(["today", "week", "month"] as const).map((p) => (
                  <button
                    key={p}
                    className={`${styles.insightsPeriodBtn} ${insightsPeriod === p ? styles.insightsPeriodBtnActive : ""}`}
                    onClick={() => setInsightsPeriod(p)}
                  >
                    {p === "today" ? "Hoy" : p === "week" ? "Semana" : "Mes"}
                  </button>
                ))}
              </div>

              {/* Cards */}
              {stylistInsights.length === 0 ? (
                <div className={styles.insightsEmpty}>
                  No hay datos en este período.
                </div>
              ) : (
                <div className={styles.insightsCards}>
                  {stylistInsights.map((s) => (
                    <div key={s.stylistId} className={`${styles.insightCard} ${s.assigned === 0 ? styles.insightCardEmpty : ""}`}>
                      {/* Header */}
                      <div className={styles.insightCardHeader}>
                        <User size={14} strokeWidth={1.5} />
                        <div className={styles.insightCardHeaderText}>
                          <span className={styles.insightCardName}>{s.stylistName}</span>
                          <span className={styles.insightCardRole}>{s.stylistRole}</span>
                        </div>
                      </div>

                      {s.assigned > 0 ? (
                        <>
                          {/* Performance bar */}
                          <div className={styles.insightBarTrack}>
                            <div
                              className={styles.insightBarFill}
                              style={{
                                width: `${Math.min(s.fulfillmentRate, 100)}%`,
                                background:
                                  s.fulfillmentRate >= 90
                                    ? "linear-gradient(90deg, #10B981, #34D399)"
                                    : s.fulfillmentRate >= 70
                                    ? "linear-gradient(90deg, #F59E0B, #FBBF24)"
                                    : "linear-gradient(90deg, #EF4444, #F87171)",
                              }}
                            />
                          </div>
                          <div className={styles.insightCardPercent}>
                            {s.fulfillmentRate}% desempeño
                            <span className={styles.insightCardVolume}>
                              {s.completed} de {s.assigned} pedidos completados
                            </span>
                          </div>

                          {/* Stats row */}
                          <div className={styles.insightCardStats}>
                            <div className={styles.insightStat}>
                              <CheckCircle size={10} strokeWidth={1.5} className={styles.insightStatIcon} style={{ color: "#10B981" }} />
                              <span>{s.completed} completados</span>
                            </div>
                            <div className={styles.insightStat}>
                              <XCircle size={10} strokeWidth={1.5} className={styles.insightStatIcon} style={{ color: s.cancelled > 0 ? "#EF4444" : "var(--text-muted)" }} />
                              <span>{s.cancelled} cancelados</span>
                            </div>
                          </div>

                          {/* Value */}
                          <div className={styles.insightCardValue}>
                            <DollarSign size={10} strokeWidth={1.5} />
                            {formatCurrency(s.generatedValue)} generado
                          </div>

                          {/* Internal index */}
                          <div className={styles.insightCardIndex} title="Índice interno estimado basado en cumplimiento y cancelaciones">
                            <TrendingUp size={10} strokeWidth={1.5} />
                            Índice interno: {s.internalIndex}%
                          </div>
                        </>
                      ) : (
                        <div className={styles.insightCardEmptyMsg}>
                          Sin desempeño registrado
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Toast ── */}
        {toast && (
          <div className={styles.toast}>
            <span className={styles.toastIcon}>
              <CalendarCheck size={14} strokeWidth={1.8} />
            </span>
            <span className={styles.toastMessage}>{toast.message}</span>
            {toast.action && (
              <button
                className={styles.toastAction}
                onClick={() => {
                  toast.action!.onClick();
                  dismissToast();
                }}
              >
                {toast.action.label}
              </button>
            )}
            <button className={styles.toastClose} onClick={dismissToast}>
              <X size={12} strokeWidth={1.5} />
            </button>
          </div>
        )}

        {/* ── Create Appointment Modal ── */}
        {showModal && (
          <CreateModal
            defaultDate={selectedDate}
            staff={staff}
            onSave={handleCreate}
            onClose={() => setShowModal(false)}
          />
        )}

        {/* ── Edit Appointment Modal ── */}
        {editAppointment && (
          <EditModal
            appointment={editAppointment}
            staff={staff}
            onSave={handleUpdate}
            onClose={() => setEditAppointment(null)}
          />
        )}

        {/* ── Confirm Delete Modal ── */}
        {deleteTarget && (
          <ConfirmDeleteModal
            appointment={deleteTarget}
            onConfirm={() => handleDelete(deleteTarget.id)}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </div>
    </AppShell>
  );
}

/* ── Appointment List Sub-component ──────────────────── */

function AppointmentList({
  appointments,
  staff,
  onDelete,
  onEdit,
}: {
  appointments: Appointment[];
  staff: StaffMemberInfo[];
  onDelete: (appt: Appointment) => void;
  onEdit: (appt: Appointment) => void;
}) {
  if (appointments.length === 0) {
    return (
      <div className={styles.emptyState}>
        <CalendarDays size={36} strokeWidth={1.2} className={styles.emptyIcon} />
        <div className={styles.emptyTitle}>Sin citas este día</div>
        <div className={styles.emptyDesc}>
          No hay reservas agendadas para esta fecha. Crea una nueva reserva manualmente.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.apptList}>
      {appointments.map((a) => {
        const clientInitials = getInitials(a.customerName);

        // Look up staff member by stylistId or by name match
        let staffMember = staff.find((s) => s.id === a.stylistId);
        if (!staffMember && a.stylistName) {
          staffMember = staff.find(
            (s) =>
              s.name.toLowerCase().includes(a.stylistName.toLowerCase()) ||
              a.stylistName.toLowerCase().includes(s.name.toLowerCase())
          );
        }

        const displayName = staffMember?.name || a.stylistName || "";
        const displayRole = staffMember?.role || "Profesional asignada";
        const stylistInitials = displayName ? getInitials(displayName) : "";
        const hasFullProfile = staffMember !== undefined;

        return (
          <div key={a.id} className={styles.apptCard}>
            {/* Time column */}
            <div className={styles.apptTime}>
              <div className={styles.apptStart}>{a.startTime}</div>
              <div className={styles.apptEnd}>{a.endTime}</div>
            </div>

            {/* Client + Professional combined column */}
            <div className={styles.apptBody}>
              {/* Client block */}
              <div className={styles.apptInfo}>
                <div className={styles.apptInfoRow}>
                  <div className={styles.avatarClient} title={a.customerName}>
                    {clientInitials}
                  </div>
                  <div className={styles.apptInfoText}>
                    <div className={styles.apptName}>{a.customerName}</div>
                    <div className={styles.apptService}>
                      {a.serviceName} · {a.durationMinutes} min
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional block */}
              <div className={styles.apptProfessional}>
                <div className={styles.apptProfessionalInner}>
                  {stylistInitials ? (
                    <div className={styles.avatarStylist} title={displayName}>
                      {stylistInitials}
                    </div>
                  ) : (
                    <User size={12} strokeWidth={1.8} />
                  )}
                  <div className={styles.apptProfessionalText}>
                    <div className={styles.apptProfessionalName}>
                      {displayName || "Sin estilista asignada"}
                    </div>
                    <div className={`${styles.apptProfessionalRole} ${!hasFullProfile ? styles.apptProfessionalRoleIncomplete : ""}`}>
                      {hasFullProfile ? displayRole : `${displayRole} · Perfil incompleto`}
                    </div>
                    {/* Rating from internal index */}
                    {displayName && (
                      <div className={styles.apptProfessionalRating}>
                        <Star size={8} strokeWidth={1.5} fill="#F59E0B" color="#F59E0B" />
                        <span className={styles.ratingStars}>5.0</span>
                        <span className={styles.ratingLabel}>Índice interno 100%</span>
                      </div>
                    )}
                  </div>
                </div>
                {/* Meta row below professional */}
                <div className={styles.apptProfessionalMeta}>
                  <div className={styles.apptValue}>
                    {a.estimatedValue > 0 ? formatCurrency(a.estimatedValue) : "—"}
                  </div>
                  <span
                    className={`${styles.statusBadge} ${
                      a.status === "confirmed"
                        ? styles.statusConfirmed
                        : a.status === "pending"
                        ? styles.statusPending
                        : styles.statusCancelled
                    }`}
                  >
                    <span className={styles.statusDot} />
                    {STATUS_LABEL[a.status] || a.status}
                  </span>
                  <button
                    onClick={() => onEdit(a)}
                    className={styles.editBtn}
                    title="Editar"
                  >
                    <Pencil size={12} strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={() => onDelete(a)}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: "4px",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      opacity: 0.4,
                      transition: "opacity 0.15s",
                    }}
                    title="Eliminar reserva"
                  >
                    <X size={12} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Create Appointment Modal ────────────────────────── */

function CreateModal({
  defaultDate,
  staff,
  onSave,
  onClose,
}: {
  defaultDate: string;
  staff: StaffMemberInfo[];
  onSave: (data: {
    customerName: string;
    phone: string;
    serviceName: string;
    stylistId: string;
    stylistName: string;
    date: string;
    startTime: string;
    durationMinutes: number;
    estimatedValue: number;
    status: "pending" | "confirmed" | "cancelled";
  }) => Promise<void>;
  onClose: () => void;
}) {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [stylistId, setStylistId] = useState("");
  const [stylistName, setStylistName] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState("10:00");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [estimatedValue, setEstimatedValue] = useState(0);
  const [status, setStatus] = useState<"pending" | "confirmed">("confirmed");
  const [saving, setSaving] = useState(false);

  const handleStylistChange = useCallback((id: string) => {
    setStylistId(id);
    const member = staff.find((s) => s.id === id);
    setStylistName(member?.name || "");
  }, [staff]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!customerName.trim()) return;
      setSaving(true);
      try {
        await onSave({
          customerName: customerName.trim(),
          phone: phone.trim(),
          serviceName: serviceName.trim(),
          stylistId,
          stylistName: stylistName.trim(),
          date,
          startTime,
          durationMinutes,
          estimatedValue,
          status,
        });
      } finally {
        setSaving(false);
      }
    },
    [customerName, phone, serviceName, stylistId, stylistName, date, startTime, durationMinutes, estimatedValue, status, onSave]
  );

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <div className={styles.modalTitle}>Nueva reserva</div>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: "4px",
            }}
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={`${styles.formField} ${styles.formFieldFull}`}>
              <label className={styles.formLabel}>Cliente</label>
              <input
                className={styles.formInput}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nombre del cliente"
                required
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Teléfono</label>
              <input
                className={styles.formInput}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+56 9 1234 5678"
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Servicio</label>
              <input
                className={styles.formInput}
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="Ej: Corte, Balayage…"
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Fecha</label>
              <input
                className={styles.formInput}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Hora inicio</label>
              <input
                className={styles.formInput}
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Duración (min)</label>
              <input
                className={styles.formInput}
                type="number"
                min={15}
                max={480}
                step={15}
                value={durationMinutes}
                onChange={(e) =>
                  setDurationMinutes(Math.max(15, Math.min(480, Number(e.target.value))))
                }
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Valor estimado ($)</label>
              <input
                className={styles.formInput}
                type="number"
                min={0}
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(Math.max(0, Number(e.target.value)))}
                placeholder="0"
              />
            </div>

            <div className={`${styles.formField} ${styles.formFieldFull}`}>
              <label className={styles.formLabel}>Profesional asignada</label>
              <select
                className={styles.formSelect}
                value={stylistId}
                onChange={(e) => handleStylistChange(e.target.value)}
              >
                <option value="">Sin asignar</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.role || "Profesional"}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Estado</label>
              <select
                className={styles.formSelect}
                value={status}
                onChange={(e) => setStatus(e.target.value as "pending" | "confirmed")}
              >
                <option value="confirmed">Confirmada</option>
                <option value="pending">Pendiente</option>
              </select>
            </div>
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={saving || !customerName.trim()}
              style={{
                opacity: saving || !customerName.trim() ? 0.6 : 1,
              }}
            >
              {saving ? "Guardando…" : "Crear reserva"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Edit Appointment Modal ───────────────────────────── */

function EditModal({
  appointment,
  staff,
  onSave,
  onClose,
}: {
  appointment: Appointment;
  staff: StaffMemberInfo[];
  onSave: (data: {
    customerName: string;
    phone: string;
    serviceName: string;
    stylistId: string;
    stylistName: string;
    date: string;
    startTime: string;
    durationMinutes: number;
    estimatedValue: number;
    status: "pending" | "confirmed" | "cancelled";
  }) => Promise<void>;
  onClose: () => void;
}) {
  const [customerName, setCustomerName] = useState(appointment.customerName);
  const [phone, setPhone] = useState(appointment.phone);
  const [serviceName, setServiceName] = useState(appointment.serviceName);
  const [stylistId, setStylistId] = useState(appointment.stylistId);
  const [stylistName, setStylistName] = useState(appointment.stylistName);
  const [date, setDate] = useState(appointment.date);
  const [startTime, setStartTime] = useState(appointment.startTime);
  const [durationMinutes, setDurationMinutes] = useState(appointment.durationMinutes);
  const [estimatedValue, setEstimatedValue] = useState(appointment.estimatedValue);
  const [status, setStatus] = useState(appointment.status);
  const [saving, setSaving] = useState(false);

  // Determine if current stylist is in staff-store
  const currentStylistInStaff = appointment.stylistId
    ? staff.some((s) => s.id === appointment.stylistId)
    : false;

  const handleStylistChange = useCallback((id: string) => {
    setStylistId(id);
    const member = staff.find((s) => s.id === id);
    setStylistName(member?.name || "");
  }, [staff]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!customerName.trim()) return;
      setSaving(true);
      try {
        await onSave({
          customerName: customerName.trim(),
          phone: phone.trim(),
          serviceName: serviceName.trim(),
          stylistId,
          stylistName: stylistName.trim(),
          date,
          startTime,
          durationMinutes,
          estimatedValue,
          status,
        });
      } finally {
        setSaving(false);
      }
    },
    [customerName, phone, serviceName, stylistId, stylistName, date, startTime, durationMinutes, estimatedValue, status, onSave]
  );

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <div className={styles.modalTitle}>Editar reserva</div>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: "4px",
            }}
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={`${styles.formField} ${styles.formFieldFull}`}>
              <label className={styles.formLabel}>Cliente</label>
              <input
                className={styles.formInput}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nombre del cliente"
                required
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Teléfono</label>
              <input
                className={styles.formInput}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+56 9 1234 5678"
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Servicio</label>
              <input
                className={styles.formInput}
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="Ej: Corte, Balayage…"
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Fecha</label>
              <input
                className={styles.formInput}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Hora inicio</label>
              <input
                className={styles.formInput}
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Duración (min)</label>
              <input
                className={styles.formInput}
                type="number"
                min={15}
                max={480}
                step={15}
                value={durationMinutes}
                onChange={(e) =>
                  setDurationMinutes(Math.max(15, Math.min(480, Number(e.target.value))))
                }
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Valor estimado ($)</label>
              <input
                className={styles.formInput}
                type="number"
                min={0}
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(Math.max(0, Number(e.target.value)))}
                placeholder="0"
              />
            </div>

            <div className={`${styles.formField} ${styles.formFieldFull}`}>
              <label className={styles.formLabel}>Profesional asignada</label>
              <select
                className={styles.formSelect}
                value={currentStylistInStaff ? stylistId : "__unknown__"}
                onChange={(e) => handleStylistChange(e.target.value)}
              >
                <option value="">Sin asignar</option>
                {!currentStylistInStaff && appointment.stylistId && (
                  <option value="__unknown__" disabled>
                    {appointment.stylistName || "Profesional no registrada"}
                  </option>
                )}
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.role || "Profesional"}
                  </option>
                ))}
              </select>
              {stylistId && (() => {
                const member = staff.find((s) => s.id === stylistId);
                return member ? (
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px", paddingLeft: "2px" }}>
                    {member.role || "Profesional"}
                  </div>
                ) : null;
              })()}
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Estado</label>
              <select
                className={styles.formSelect}
                value={status}
                onChange={(e) => setStatus(e.target.value as "pending" | "confirmed" | "cancelled")}
              >
                <option value="confirmed">Confirmada</option>
                <option value="pending">Pendiente</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={saving || !customerName.trim()}
              style={{
                opacity: saving || !customerName.trim() ? 0.6 : 1,
              }}
            >
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Confirm Delete Modal ──────────────────────────────── */

function ConfirmDeleteModal({
  appointment,
  onConfirm,
  onCancel,
}: {
  appointment: Appointment;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = useCallback(async () => {
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  }, [onConfirm]);

  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.confirmIcon}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <div className={styles.confirmTitle}>¿Eliminar reserva?</div>
        <div className={styles.confirmDesc}>
          Esta acción no se puede recuperar. La reserva será eliminada de la agenda.
        </div>

        <div className={styles.confirmDetails}>
          <div className={styles.confirmDetailRow}>
            <span className={styles.confirmDetailLabel}>Cliente</span>
            <span className={styles.confirmDetailValue}>{appointment.customerName}</span>
          </div>
          <div className={styles.confirmDetailRow}>
            <span className={styles.confirmDetailLabel}>Servicio</span>
            <span className={styles.confirmDetailValue}>{appointment.serviceName}</span>
          </div>
          <div className={styles.confirmDetailRow}>
            <span className={styles.confirmDetailLabel}>Fecha</span>
            <span className={styles.confirmDetailValue}>{formatDateDisplay(appointment.date)}</span>
          </div>
          <div className={styles.confirmDetailRow}>
            <span className={styles.confirmDetailLabel}>Hora</span>
            <span className={styles.confirmDetailValue}>{appointment.startTime}</span>
          </div>
        </div>

        <div className={styles.confirmActions}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={onCancel}
            disabled={deleting}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={styles.btnDanger}
            onClick={handleConfirm}
            disabled={deleting}
            style={{ opacity: deleting ? 0.6 : 1 }}
          >
            {deleting ? "Eliminando…" : "Eliminar reserva"}
          </button>
        </div>
      </div>
    </div>
  );
}
