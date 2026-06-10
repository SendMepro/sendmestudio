"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ── Types ────────────────────────────────────────────────────────────────

export type AgentStatus = "healthy" | "degraded" | "failed" | "unreachable" | "unknown";

export interface AgentInfo {
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

export interface SupervisorInfo {
  supervisor: string;
  version: string;
  uptime: number;
  overall: string;
  managedCount: number;
  totalAlive: number;
  totalDegraded: number;
  totalUnreachable: number;
  totalHealthy: number;
  totalUnhealthy: number;
  lastHeartbeat: string;
  governanceCoveragePercent: number;
  registeredCount: number;
  heartbeatedCount: number;
  pollIntervalMs: number;
  isPolling: boolean;
  checkedAt: string;
}

export interface BusinessEventSummary {
  type: string;
  timestamp: string;
  conversationId?: string;
  metadata?: Record<string, unknown>;
}

export interface BusinessMetrics {
  eventsToday: number;
  messagesReceived: number;
  bookingsCreated: number;
  lastEvent: BusinessEventSummary | null;
  recentEvents: BusinessEventSummary[];
  byType: Record<string, number>;
}

export interface SupervisorResponse {
  supervisor: string;
  version: string;
  uptime: number;
  overall: string;
  managedCount: number;
  totalAlive: number;
  totalDegraded: number;
  totalUnreachable: number;
  totalHealthy: number;
  totalUnhealthy: number;
  lastHeartbeat: string;
  governanceCoveragePercent: number;
  registeredCount: number;
  heartbeatedCount: number;
  pollIntervalMs: number;
  isPolling: boolean;
  agents: AgentInfo[];
  checkedAt: string;
  businessMetrics: BusinessMetrics;
}

export interface UseBrainAgentsResult {
  supervisor: SupervisorInfo | null;
  agents: AgentInfo[];
  businessMetrics: BusinessMetrics | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  lastRefresh: string | null;
}

// ── Hook ─────────────────────────────────────────────────────────────────

export function useBrainAgents(): UseBrainAgentsResult {
  const [supervisor, setSupervisor] = useState<SupervisorInfo | null>(null);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/supervisor");
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
      const data = (await res.json()) as SupervisorResponse;

      if (!mountedRef.current) return;

      setSupervisor({
        supervisor: data.supervisor,
        version: data.version,
        uptime: data.uptime,
        overall: data.overall,
        managedCount: data.managedCount,
        totalAlive: data.totalAlive,
        totalDegraded: data.totalDegraded,
        totalUnreachable: data.totalUnreachable,
        totalHealthy: data.totalHealthy,
        totalUnhealthy: data.totalUnhealthy,
        lastHeartbeat: data.lastHeartbeat,
        governanceCoveragePercent: data.governanceCoveragePercent,
        registeredCount: data.registeredCount,
        heartbeatedCount: data.heartbeatedCount,
        pollIntervalMs: data.pollIntervalMs,
        isPolling: data.isPolling,
        checkedAt: data.checkedAt,
      });

      setAgents(data.agents);
      setBusinessMetrics(data.businessMetrics);
      setLastRefresh(data.checkedAt);
      setError(null);
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e.message : "Error desconocido");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();

    const interval = setInterval(fetchData, 15000); // Poll every 15s
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchData]);

  return {
    supervisor,
    agents,
    businessMetrics,
    loading,
    error,
    refresh: fetchData,
    lastRefresh,
  };
}
