"use client";

// src/app/supervisor/page.tsx
// G-5: Supervisor Dashboard — live runtime state of the agent ecosystem

import { useEffect, useState, useCallback, useRef } from "react";
import { Shield, RefreshCw, Activity, CheckCircle, AlertTriangle, XCircle, Clock, BarChart3, Brain, MessageSquare, CalendarCheck, Zap } from "lucide-react";
import AppShell from "../components/AppShell";
import styles from "./supervisor.module.css";

// ── Types ──

type AgentStatus = 'healthy' | 'degraded' | 'failed' | 'unreachable' | 'unknown';

interface AgentRow {
  name: string;
  category: string;
  phase: string;
  description: string;
  registered: boolean;
  status: AgentStatus;
  lastPing: string;
  consecutiveFailures: number;
  lastError: string | null;
}

interface SupervisorApiResponse {
  supervisor: string;
  version: string;
  uptime: number;
  overall: 'healthy' | 'degraded' | 'critical';
  managedCount: number;
  totalAlive: number;
  totalDegraded: number;
  totalUnreachable: number;
  totalHealthy: number;
  totalUnhealthy: number;
  lastHeartbeat: string | null;
  governanceCoveragePercent: number;
  registeredCount: number;
  heartbeatedCount: number;
  pollIntervalMs: number;
  isPolling: boolean;
  agents: AgentRow[];
  checkedAt: string;
  error?: string;
  /** G-9: Business activity metrics */
  businessMetrics?: {
    eventsToday: number;
    messagesReceived: number;
    bookingsCreated: number;
    lastEvent: { type: string; timestamp: string; conversationId?: string; metadata?: Record<string, unknown> } | null;
    recentEvents: { type: string; timestamp: string; conversationId?: string; metadata?: Record<string, unknown> }[];
    byType: Record<string, number>;
  };
}

// ── Helpers ──

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return iso;
  }
}

function categoryClassName(cat: string): string {
  const map: Record<string, string> = {
    system: styles.catSystem,
    skill: styles.catSkill,
    leaf: styles.catLeaf,
    infrastructure: styles.catInfrastructure,
    section: styles.catSection,
    bridge: styles.catBridge,
    planned: styles.catPlanned,
  };
  return map[cat] ?? styles.catPlanned;
}

function statusBadgeClass(status: AgentStatus): string {
  const map: Record<string, string> = {
    healthy: styles.badgeHealthy,
    degraded: styles.badgeDegraded,
    failed: styles.badgeFailed,
    unreachable: styles.badgeUnreachable,
    unknown: styles.badgeUnknown,
  };
  return map[status] ?? styles.badgeUnknown;
}

function statusLabel(status: AgentStatus): string {
  const map: Record<string, string> = {
    healthy: 'Healthy',
    degraded: 'Degraded',
    failed: 'Failed',
    unreachable: 'Unreachable',
    unknown: 'UNKNOWN',
  };
  return map[status] ?? 'UNKNOWN';
}

// G-9: Event display helpers
function eventLabel(type: string): string {
  const map: Record<string, string> = {
    message_received: 'Message Received',
    intent_detected: 'Intent Detected',
    service_detected: 'Service Detected',
    date_detected: 'Date Detected',
    time_detected: 'Time Detected',
    booking_confirmed: 'Booking Confirmed',
    appointment_created: 'Appointment Created',
    reply_sent: 'Reply Sent',
  };
  return map[type] ?? type;
}

function eventColor(type: string): string {
  const map: Record<string, string> = {
    message_received: '#7c5cff',
    intent_detected: '#a98cff',
    service_detected: '#4a7dd9',
    date_detected: '#c47e2a',
    time_detected: '#da8e3b',
    booking_confirmed: '#2e9b6b',
    appointment_created: '#1a7a4e',
    reply_sent: '#5a9fd9',
  };
  return map[type] ?? '#888';
}

// ── Page ──

export default function SupervisorDashboard() {
  const [data, setData] = useState<SupervisorApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const res = await fetch('/api/supervisor', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const json: SupervisorApiResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch supervisor data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // G-10: Connect to SSE for real-time updates
  useEffect(() => {
    // Initial fetch
    fetchData();

    // Try EventSource
    let sseFallbackTimer: ReturnType<typeof setInterval> | undefined;
    let es: EventSource;

    try {
      es = new EventSource('/api/supervisor/events');
      eventSourceRef.current = es;

      es.addEventListener('supervisor_update', (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.businessMetrics) {
            setData((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                businessMetrics: payload.businessMetrics,
                ...(payload.supervisor ? {
                  overall: payload.supervisor.overall,
                  managedCount: payload.supervisor.managedCount,
                  totalAlive: payload.supervisor.totalAlive,
                  totalDegraded: payload.supervisor.totalDegraded,
                  totalUnreachable: payload.supervisor.totalUnreachable,
                  checkedAt: payload.supervisor.checkedAt,
                  isPolling: payload.supervisor.isPolling,
                  agents: payload.supervisor.heartbeats
                    ? prev.agents.map((agent) => {
                        const hb = payload.supervisor.heartbeats.find(
                          (h: { agentName: string }) => h.agentName === agent.name
                        );
                        if (!hb) return agent;
                        return {
                          ...agent,
                          status: hb.status === 'alive' ? 'healthy'
                            : hb.status === 'degraded' ? 'degraded'
                            : hb.status === 'unreachable' ? 'unreachable'
                            : agent.status,
                          lastPing: hb.lastPing,
                          consecutiveFailures: hb.consecutiveFailures,
                          lastError: hb.lastError,
                        };
                      })
                    : prev.agents,
                } : {}),
              };
            });
          }
        } catch {
          // ignore parse errors
        }
      });

      es.addEventListener('connected', () => {
        setSseConnected(true);
      });

      es.addEventListener('error', () => {
        // EventSource failed — fall back to polling
        setSseConnected(false);
        es.close();
        eventSourceRef.current = null;
        sseFallbackTimer = setInterval(() => fetchData(true), 10000);
      });
    } catch {
      // EventSource not supported — fall back to polling
      setSseConnected(false);
      sseFallbackTimer = setInterval(() => fetchData(true), 10000);
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (sseFallbackTimer) clearInterval(sseFallbackTimer);
    };
  }, [fetchData]);

  // ── Status icon for the overall ──

  const overallIcon = data?.overall === 'healthy'
    ? <CheckCircle size={20} />
    : data?.overall === 'degraded'
      ? <AlertTriangle size={20} />
      : <XCircle size={20} />;

  const overallColor = data?.overall === 'healthy'
    ? '#2e9b6b'
    : data?.overall === 'degraded'
      ? '#da8e3b'
      : '#d14545';

  return (
    <AppShell>
      <div className={styles.supervisorPage}>
        {/* ── Header ── */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <Shield size={22} />
            </div>
            <div>
              <h1 className={styles.headerTitle}>Supervisor Dashboard</h1>
              <p className={styles.headerSubtitle}>
                SystemSupervisorAgent · Agent governance runtime
                {data && ` · v${data.version}`}
              </p>
            </div>
          </div>
          <button
            className={styles.headerRefresh}
            onClick={() => fetchData(true)}
            disabled={refreshing}
          >
            <RefreshCw size={14} className={refreshing ? styles.spinning : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* ── Loading state ── */}
        {loading && !data && (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <span>Loading supervisor data...</span>
          </div>
        )}

        {/* ── Error state ── */}
        {error && !data && (
          <div className={styles.errorContainer}>
            <XCircle size={32} />
            <span>Failed to connect to supervisor</span>
            <span style={{ fontSize: 12, maxWidth: 400 }}>{error}</span>
            <button
              className={styles.headerRefresh}
              onClick={() => fetchData()}
              style={{ marginTop: 8 }}
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        )}

        {/* ── Empty state (no agents) ── */}
        {data && data.agents.length === 0 && !error && (
          <div className={styles.emptyContainer}>
            <Brain size={36} />
            <span>No agents registered</span>
            <span style={{ fontSize: 12, maxWidth: 320 }}>
              {data.error
                ? `Supervisor error: ${data.error}`
                : 'The supervisor is running but no agents are registered yet.'}
            </span>
          </div>
        )}

        {/* ── Dashboard content ── */}
        {data && data.agents.length > 0 && (
          <>
            {/* ── Summary cards ── */}
            <div className={styles.summaryGrid}>
              <div className={styles.summaryCard}>
                <span className={styles.summaryCardLabel}>
                  <BarChart3 size={12} style={{ marginRight: 4, verticalAlign: -1 }} />
                  Total Agents
                </span>
                <span className={styles.summaryCardValue}>{data.managedCount}</span>
                <span className={styles.summaryCardMeta}>
                  {data.registeredCount} in registry
                </span>
              </div>

              <div className={styles.summaryCard}>
                <span className={styles.summaryCardLabel}>
                  <CheckCircle size={12} style={{ marginRight: 4, verticalAlign: -1 }} />
                  Healthy
                </span>
                <span className={`${styles.summaryCardValue} ${styles.healthyValue}`}>
                  {data.totalAlive}
                </span>
                <span className={styles.summaryCardMeta}>
                  {data.managedCount > 0
                    ? `${Math.round((data.totalAlive / data.managedCount) * 100)}% of managed`
                    : '—'}
                </span>
              </div>

              <div className={styles.summaryCard}>
                <span className={styles.summaryCardLabel}>
                  <AlertTriangle size={12} style={{ marginRight: 4, verticalAlign: -1 }} />
                  Degraded
                </span>
                <span className={`${styles.summaryCardValue} ${styles.degradedValue}`}>
                  {data.totalDegraded}
                </span>
                <span className={styles.summaryCardMeta}>
                  {data.totalDegraded === 0 ? 'None' : 'Requires attention'}
                </span>
              </div>

              <div className={styles.summaryCard}>
                <span className={styles.summaryCardLabel}>
                  <XCircle size={12} style={{ marginRight: 4, verticalAlign: -1 }} />
                  Failed
                </span>
                <span className={`${styles.summaryCardValue} ${styles.failedValue}`}>
                  {data.totalUnreachable}
                </span>
                <span className={styles.summaryCardMeta}>
                  {data.totalUnreachable === 0 ? 'None' : 'Critical'}
                </span>
              </div>

              <div className={styles.summaryCard}>
                <span className={styles.summaryCardLabel}>
                  <Clock size={12} style={{ marginRight: 4, verticalAlign: -1 }} />
                  Last Heartbeat
                </span>
                <span className={styles.summaryCardValue} style={{ fontSize: 18 }}>
                  {data.lastHeartbeat ? formatTime(data.lastHeartbeat) : 'UNKNOWN'}
                </span>
                <span className={styles.summaryCardMeta}>
                  Poll: {data.isPolling ? `${data.pollIntervalMs}ms` : 'OFF'}
                </span>
              </div>

              <div className={styles.summaryCard}>
                <span className={styles.summaryCardLabel}>
                  <Activity size={12} style={{ marginRight: 4, verticalAlign: -1 }} />
                  Governance Coverage
                </span>
                <span className={styles.summaryCardValue} style={{ fontSize: 22 }}>
                  {data.governanceCoveragePercent}%
                </span>
                <span className={styles.summaryCardMeta}>
                  Overall: <span style={{ color: overallColor, fontWeight: 600 }}>
                    {data.overall.toUpperCase()}
                  </span>
                  {' · '}Uptime: {formatUptime(data.uptime)}
                </span>
              </div>
            </div>

            {/* ── Business Activity (G-9) ── */}
            {data.businessMetrics && (
              <div className={styles.businessSection}>
                <h2 className={styles.sectionTitle}>
                  <Zap size={16} style={{ marginRight: 6, verticalAlign: -2 }} />
                  Live Business Activity
                </h2>

                <div className={styles.businessGrid}>
                  <div className={styles.businessCard}>
                    <span className={styles.businessCardLabel}>
                      <Activity size={11} style={{ marginRight: 3, verticalAlign: -1 }} />
                      Events Today
                    </span>
                    <span className={styles.businessCardValue}>
                      {data.businessMetrics.eventsToday}
                    </span>
                    <span className={styles.businessCardMeta}>
                      From BusinessEventBus
                    </span>
                  </div>

                  <div className={styles.businessCard}>
                    <span className={styles.businessCardLabel}>
                      <MessageSquare size={11} style={{ marginRight: 3, verticalAlign: -1 }} />
                      Messages Received
                    </span>
                    <span className={styles.businessCardValue}>
                      {data.businessMetrics.messagesReceived}
                    </span>
                    <span className={styles.businessCardMeta}>
                      WhatsApp inbound
                    </span>
                  </div>

                  <div className={styles.businessCard}>
                    <span className={styles.businessCardLabel}>
                      <CalendarCheck size={11} style={{ marginRight: 3, verticalAlign: -1 }} />
                      Bookings Created
                    </span>
                    <span className={styles.businessCardValue}>
                      {data.businessMetrics.bookingsCreated}
                    </span>
                    <span className={styles.businessCardMeta}>
                      Confirmed appointments
                    </span>
                  </div>

                  <div className={styles.businessCard}>
                    <span className={styles.businessCardLabel}>
                      <Clock size={11} style={{ marginRight: 3, verticalAlign: -1 }} />
                      Last Event
                    </span>
                    <span className={styles.businessCardValue} style={{ fontSize: 16 }}>
                      {data.businessMetrics.lastEvent
                        ? eventLabel(data.businessMetrics.lastEvent.type)
                        : '—'}
                    </span>
                    <span className={styles.businessCardMeta}>
                      {data.businessMetrics.lastEvent
                        ? formatTime(data.businessMetrics.lastEvent.timestamp)
                        : 'No activity yet'}
                    </span>
                  </div>
                </div>

                {/* ── Event Timeline ── */}
                {data.businessMetrics.recentEvents.length > 0 && (
                  <div className={styles.eventTimeline}>
                    {data.businessMetrics.recentEvents.slice().reverse().map((evt, i) => (
                      <div key={i} className={styles.eventRow}>
                        <span
                          className={styles.eventDot}
                          style={{ background: eventColor(evt.type) }}
                        />
                        <span className={styles.eventTime}>
                          {formatTime(evt.timestamp)}
                        </span>
                        <span className={styles.eventType}>
                          {eventLabel(evt.type)}
                        </span>
                        <span className={styles.eventDetail}>
                          {evt.metadata?.service
                            ? String(evt.metadata.service)
                            : evt.metadata?.intent
                              ? String(evt.metadata.intent)
                              : evt.conversationId
                                ? evt.conversationId.slice(0, 12)
                                : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Agent table ── */}
            <h2 className={styles.sectionTitle}>
              Registered Agent List
              <span style={{ fontWeight: 400, fontSize: 13, color: 'var(--text-muted)', marginLeft: 8 }}>
                ({data.agents.length} agents)
              </span>
            </h2>

            <div className={styles.tableCard}>
              <div className={styles.tableScroll}>
                <table className={styles.agentTable}>
                  <thead>
                    <tr>
                      <th>Agent Name</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Last Check</th>
                      <th>Registered</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.agents.map((agent) => (
                      <tr key={agent.name}>
                        <td className={styles.agentName}>{agent.name}</td>
                        <td>
                          <span className={`${styles.categoryPill} ${categoryClassName(agent.category)}`}>
                            {agent.category}
                          </span>
                        </td>
                        <td>
                          <span className={`${styles.statusBadge} ${statusBadgeClass(agent.status)}`}>
                            <span className={styles.statusDot} />
                            {statusLabel(agent.status)}
                          </span>
                          {agent.consecutiveFailures > 0 && (
                            <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--text-muted)' }}>
                              ({agent.consecutiveFailures}fail)
                            </span>
                          )}
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                          {agent.lastPing ? formatTime(agent.lastPing) : '—'}
                        </td>
                        <td>
                          {agent.registered
                            ? <span className={styles.registeredYes}>Yes</span>
                            : <span className={styles.registeredNo}>No</span>
                          }
                        </td>
                        <td>
                          <span className={styles.agentDescription}>
                            {agent.description || '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
