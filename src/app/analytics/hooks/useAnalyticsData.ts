"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ── Types ────────────────────────────────────────────────────────────────

export type AnalyticsLiveData = {
  date: string;
  conversationsTotal: number;
  conversationsAI: number;
  conversationsHuman: number;
  conversationsScheduled: number;
  iaMessagesSent: number;
  iaDraftsGenerated: number;
  automationPercent: number;
  iaMinutesSaved: number;
  avgResponseMinutes: number;
  currentMode: string;
  activeConversations: number;
  messagesLastHour: number;
  coveragePercent: number;
};

export type DailyAnalyticsRow = {
  date: string;
  conversationsTotal: number;
  conversationsAI: number;
  conversationsHuman: number;
  conversationsScheduled: number;
  iaMessagesSent: number;
  iaDraftsGenerated: number;
  iaMinutesSaved: number;
  automationPercent: number;
  coveragePercent: number;
  hourly: Record<string, { ai: number; human: number }>;
};

export type UseAnalyticsDataResult = {
  live: AnalyticsLiveData | null;
  daily: DailyAnalyticsRow | null;
  history: DailyAnalyticsRow[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

// ── Hook ─────────────────────────────────────────────────────────────────

export function useAnalyticsData(): UseAnalyticsDataResult {
  const [live, setLive] = useState<AnalyticsLiveData | null>(null);
  const [daily, setDaily] = useState<DailyAnalyticsRow | null>(null);
  const [history, setHistory] = useState<DailyAnalyticsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      const [liveRes, dailyRes] = await Promise.all([
        fetch("/api/analytics/live"),
        fetch("/api/analytics/daily"),
      ]);

      if (!liveRes.ok) throw new Error("Error al cargar analytics en vivo");
      if (!dailyRes.ok) throw new Error("Error al cargar analytics diarios");

      const liveJson = await liveRes.json();
      const dailyJson = await dailyRes.json();

      if (!mountedRef.current) return;

      setLive(liveJson.analytics);
      setDaily(dailyJson.analytics);
      setError(null);

      // Load last 7 days for history (in background)
      const historyPromises: Promise<DailyAnalyticsRow | null>[] = [];
      const today = new Date();
      for (let i = 1; i <= 7; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        historyPromises.push(
          fetch(`/api/analytics/daily?date=${dateKey}`)
            .then((r) => r.json())
            .then((j) => j.analytics ?? null)
            .catch(() => null)
        );
      }
      const historyResults = await Promise.all(historyPromises);
      if (mountedRef.current) {
        setHistory(historyResults.filter((r): r is DailyAnalyticsRow => r !== null));
      }
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
    const interval = setInterval(fetchData, 30000);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchData]);

  return { live, daily, history, loading, error, refresh: fetchData };
}
