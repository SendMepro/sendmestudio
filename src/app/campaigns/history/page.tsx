"use client";

import { useCallback, useMemo, useState } from "react";
import AppShell from "../../components/AppShell";
import styles from "./history.module.css";
import {
  CampaignHistoryEntry,
  CampaignHistoryStatus,
  DateFilterPreset,
  HISTORY_STATUS_LABELS,
  HISTORY_STATUS_COLORS,
  HISTORY_STATUS_BG,
  getDateRange,
  generateDemoHistory,
} from "./types";
import {
  Calendar,
  CalendarDays,
  CheckCircle,
  ChevronLeft,
  Clock,
  Filter,
  MessageSquare,
  Phone,
  Send,
  Users,
  X,
  XCircle,
} from "lucide-react";

export default function CampaignHistoryPage() {
  const [entries] = useState<CampaignHistoryEntry[]>(generateDemoHistory);
  const [datePreset, setDatePreset] = useState<DateFilterPreset>("this_month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [statusFilter, setStatusFilter] = useState<CampaignHistoryStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<CampaignHistoryEntry | null>(null);

  const filtered = useMemo(() => {
    const { start, end } = getDateRange(datePreset, customStart, customEnd);
    return entries.filter(e => {
      const d = new Date(e.createdAt).getTime();
      if (d < start.getTime() || d > end.getTime()) return false;
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (searchQuery && !e.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [entries, datePreset, customStart, customEnd, statusFilter, searchQuery]);

  const kpis = useMemo(() => {
    const campaignsInPeriod = filtered.length;
    const totalSent = filtered.reduce((sum, e) => sum + e.metrics.sent, 0);
    return { campaignsInPeriod, totalSent };
  }, [filtered]);

  const formatDate = (iso?: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString();
  };

  const formatDateTime = (iso?: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString() + "  " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const openDetail = useCallback((e: CampaignHistoryEntry) => {
    setSelectedEntry(e);
  }, []);

  return (
    <AppShell>
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <CalendarDays size={20} strokeWidth={1.8} />
            </div>
            <div>
              <h1 className={styles.pageTitle}>Historial de Campañas</h1>
              <p className={styles.pageSub}>
                {filtered.length} campaña{filtered.length !== 1 ? "s" : ""} encontrada{filtered.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className={styles.searchBox}>
            <Filter size={14} strokeWidth={1.8} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Buscar campaña..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filterBar}>
          <div className={styles.filterChips}>
            {([
              { key: "today", label: "Hoy" },
              { key: "this_week", label: "Esta semana" },
              { key: "this_month", label: "Este mes" },
              { key: "last_month", label: "Mes anterior" },
              { key: "custom", label: "Personalizado" },
            ] as { key: DateFilterPreset; label: string }[]).map(p => (
              <button
                key={p.key}
                className={`${styles.filterChip} ${datePreset === p.key ? styles.filterChipActive : ""}`}
                onClick={() => setDatePreset(p.key)}
                type="button"
              >
                {p.label}
              </button>
            ))}
          </div>

          {datePreset === "custom" && (
            <div className={styles.customRange}>
              <input type="date" className={styles.dateInput} value={customStart} onChange={e => setCustomStart(e.target.value)} />
              <span className={styles.dateSep}>→</span>
              <input type="date" className={styles.dateInput} value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
            </div>
          )}

          <div className={styles.statusChips}>
            {(["all", "sent", "scheduled_history", "cancelled", "failed"] as const).map(s => (
              <button
                key={s}
                className={`${styles.statusChip} ${statusFilter === s ? styles.statusChipActive : ""}`}
                onClick={() => setStatusFilter(s)}
                type="button"
              >
                {s === "all" ? "Todas" : HISTORY_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className={styles.kpiRow}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiIconWrap} style={{ background: "rgba(124,92,255,0.10)", color: "#7c5cff" }}>
              <Send size={14} strokeWidth={2.2} />
            </div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiValue}>{kpis.campaignsInPeriod}</span>
              <span className={styles.kpiLabel}>Campañas</span>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiIconWrap} style={{ background: "rgba(34,197,94,0.12)", color: "#15803d" }}>
              <Users size={14} strokeWidth={2.2} />
            </div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiValue}>{kpis.totalSent.toLocaleString()}</span>
              <span className={styles.kpiLabel}>Personas enviadas</span>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiIconWrap} style={{ background: "rgba(59,130,246,0.10)", color: "#2563eb" }}>
              <MessageSquare size={14} strokeWidth={2.2} />
            </div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiValue}>{filtered.reduce((s, e) => s + e.metrics.replies, 0).toLocaleString()}</span>
              <span className={styles.kpiLabel}>Respuestas</span>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiIconWrap} style={{ background: "rgba(234,179,8,0.12)", color: "#a16207" }}>
              <Phone size={14} strokeWidth={2.2} />
            </div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiValue}>{filtered.reduce((s, e) => s + e.metrics.bookings, 0).toLocaleString()}</span>
              <span className={styles.kpiLabel}>Reservas</span>
            </div>
          </div>
        </div>

        <div className={styles.contentArea}>
          {/* Table */}
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Fecha</th>
                  <th className={styles.th}>Nombre</th>
                  <th className={styles.th}>Audiencia</th>
                  <th className={styles.th}>Canal</th>
                  <th className={styles.th}>Estado</th>
                  <th className={styles.th}>Contactos</th>
                  <th className={styles.th}>Enviados</th>
                  <th className={styles.th}>Respuestas</th>
                  <th className={styles.th}>Reservas</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr
                    key={e.id}
                    className={`${styles.tr} ${selectedEntry?.id === e.id ? styles.trActive : ""}`}
                    onClick={() => openDetail(e)}
                  >
                    <td className={styles.td}>{formatDate(e.createdAt)}</td>
                    <td className={styles.td}>
                      <span className={styles.campaignName}>{e.name}</span>
                    </td>
                    <td className={styles.td}>{e.audienceName}</td>
                    <td className={styles.td}>{e.channel}</td>
                    <td className={styles.td}>
                      <span
                        className={styles.statusBadge}
                        style={{
                          background: HISTORY_STATUS_BG[e.status],
                          color: HISTORY_STATUS_COLORS[e.status],
                        }}
                      >
                        {HISTORY_STATUS_LABELS[e.status]}
                      </span>
                    </td>
                    <td className={styles.td}>{e.totalContacts}</td>
                    <td className={styles.td}>{e.metrics.sent}</td>
                    <td className={styles.td}>{e.metrics.replies}</td>
                    <td className={styles.td}>{e.metrics.bookings}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className={styles.emptyCell}>
                      No se encontraron campañas en este período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Detail panel */}
          {selectedEntry && (
            <div className={styles.detailPanel}>
              <div className={styles.detailHeader}>
                <h3 className={styles.detailTitle}>{selectedEntry.name}</h3>
                <button className={styles.detailClose} onClick={() => setSelectedEntry(null)} type="button">
                  <X size={16} strokeWidth={1.8} />
                </button>
              </div>

              <div className={styles.detailBody}>
                {/* Status badge */}
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Estado</span>
                  <span
                    className={styles.statusBadge}
                    style={{
                      background: HISTORY_STATUS_BG[selectedEntry.status],
                      color: HISTORY_STATUS_COLORS[selectedEntry.status],
                    }}
                  >
                    {HISTORY_STATUS_LABELS[selectedEntry.status]}
                  </span>
                </div>

                {/* Channel */}
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Canal</span>
                  <span className={styles.detailValue}>{selectedEntry.channel}</span>
                </div>

                {/* Audience */}
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>
                    <Users size={12} strokeWidth={2} /> Audiencia
                  </span>
                  <span className={styles.detailValue}>{selectedEntry.audienceName}</span>
                </div>

                {/* Dates */}
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>
                    <Calendar size={12} strokeWidth={2} /> Creada
                  </span>
                  <span className={styles.detailValue}>{formatDateTime(selectedEntry.createdAt)}</span>
                </div>

                {selectedEntry.sentAt && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>
                      <Send size={12} strokeWidth={2} /> Enviada
                    </span>
                    <span className={styles.detailValue}>{formatDateTime(selectedEntry.sentAt)}</span>
                  </div>
                )}

                {selectedEntry.scheduledAt && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>
                      <Clock size={12} strokeWidth={2} /> Programada
                    </span>
                    <span className={styles.detailValue}>{formatDateTime(selectedEntry.scheduledAt)}</span>
                  </div>
                )}

                {selectedEntry.cancelledAt && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>
                      <XCircle size={12} strokeWidth={2} /> Cancelada
                    </span>
                    <span className={styles.detailValue}>{formatDateTime(selectedEntry.cancelledAt)}</span>
                  </div>
                )}

                {/* Metrics */}
                <div className={styles.metricsGrid}>
                  <div className={styles.metricCard}>
                    <div className={styles.metricIcon}>
                      <Users size={14} strokeWidth={2} />
                    </div>
                    <div className={styles.metricInfo}>
                      <span className={styles.metricValue}>{selectedEntry.totalContacts}</span>
                      <span className={styles.metricLabel}>Total contactos</span>
                    </div>
                  </div>
                  <div className={styles.metricCard}>
                    <div className={styles.metricIcon} style={{ background: "rgba(34,197,94,0.12)", color: "#15803d" }}>
                      <CheckCircle size={14} strokeWidth={2} />
                    </div>
                    <div className={styles.metricInfo}>
                      <span className={styles.metricValue}>{selectedEntry.metrics.sent}</span>
                      <span className={styles.metricLabel}>WhatsApp válidos</span>
                    </div>
                  </div>
                  <div className={styles.metricCard}>
                    <div className={styles.metricIcon} style={{ background: "rgba(239,68,68,0.10)", color: "#dc2626" }}>
                      <XCircle size={14} strokeWidth={2} />
                    </div>
                    <div className={styles.metricInfo}>
                      <span className={styles.metricValue}>{selectedEntry.metrics.failed}</span>
                      <span className={styles.metricLabel}>Fallidos</span>
                    </div>
                  </div>
                  <div className={styles.metricCard}>
                    <div className={styles.metricIcon} style={{ background: "rgba(59,130,246,0.10)", color: "#2563eb" }}>
                      <MessageSquare size={14} strokeWidth={2} />
                    </div>
                    <div className={styles.metricInfo}>
                      <span className={styles.metricValue}>{selectedEntry.metrics.replies}</span>
                      <span className={styles.metricLabel}>Respuestas</span>
                    </div>
                  </div>
                  <div className={styles.metricCard}>
                    <div className={styles.metricIcon} style={{ background: "rgba(234,179,8,0.12)", color: "#a16207" }}>
                      <Phone size={14} strokeWidth={2} />
                    </div>
                    <div className={styles.metricInfo}>
                      <span className={styles.metricValue}>{selectedEntry.metrics.bookings}</span>
                      <span className={styles.metricLabel}>Reservas</span>
                    </div>
                  </div>
                </div>

                {/* Campaign body */}
                <div className={styles.bodySection}>
                  <span className={styles.detailLabel}>Texto enviado</span>
                  <div className={styles.bodyPreview}>
                    {selectedEntry.body.split("\n").map((line, i) => (
                      <p key={i} className={styles.bodyLine}>{line}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
