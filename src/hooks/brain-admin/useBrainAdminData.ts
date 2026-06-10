"use client";

import { useState } from "react";
import { useFetchOnSearch } from "./useFetchOnSearch";

type NightQueue = {
  pending: number;
  completed: number;
  failed: number;
  summary: string | null;
  jobs: Array<{
    id: string;
    type: string;
    status: string;
    createdAt: string;
  }>;
};

interface UseBrainAdminDataReturn<TSummary> {
  summary: TSummary;
  setSummary: React.Dispatch<React.SetStateAction<TSummary>>;
  storageStats: Record<string, unknown> | null;
  nightQueue: NightQueue | null;
  toastMessage: string;
  toastVisible: boolean;
  loadSummary: () => Promise<void>;
  loadStorageStats: () => Promise<void>;
  loadNightQueue: () => Promise<void>;
  showToast: (message: string) => void;
}

export function useBrainAdminData<TSummary>(
  emptySummary: TSummary
): UseBrainAdminDataReturn<TSummary> {
  const [summary, setSummary] = useState<TSummary>(emptySummary);
  const [storageStats, setStorageStats] = useState<Record<string, unknown> | null>(null);
  const [nightQueue, setNightQueue] = useState<NightQueue | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  const { execute: fetchOnSearch } = useFetchOnSearch();

  const loadSummary = async () => {
    const result = await fetchOnSearch<{ summary?: TSummary }>({
      url: "/api/brain-admin/upload",
    });
    if (result?.summary) {
      setSummary(result.summary);
    }
  };

  const loadStorageStats = async () => {
    const data = await fetchOnSearch<Record<string, unknown>>({
      url: "/api/brain-admin/storage",
      silent: true,
    });
    if (data) setStorageStats(data);
  };

  const loadNightQueue = async () => {
    const data = await fetchOnSearch({
      url: "/api/brain-admin/queue",
      silent: true,
    });
    if (data) setNightQueue(data as NightQueue);
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 4000);
  };

  return {
    summary,
    setSummary,
    storageStats,
    nightQueue,
    toastMessage,
    toastVisible,
    loadSummary,
    loadStorageStats,
    loadNightQueue,
    showToast,
  };
}
