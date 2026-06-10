"use client";

import { useEffect, useState } from "react";

export function useBrainAdminRealtime(
  onBrainUpdated: (summary: unknown) => void
) {
  const [incomingUpload, setIncomingUpload] = useState<{
    fileName: string;
    timestamp: number;
  } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let eventSource: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      try {
        eventSource = new EventSource("/api/brain-admin/events");
        eventSource.onmessage = (msg) => {
          try {
            const event = JSON.parse(msg.data);
            if (event.type === "upload_received") {
              setIncomingUpload({ fileName: event.fileName, timestamp: Date.now() });
              setTimeout(() => setIncomingUpload(null), 4000);
            }
            if (event.type === "brain_updated") {
              onBrainUpdated(event.summary);
            }
          } catch { /* ignore */ }
        };
        eventSource.onerror = () => {
          eventSource?.close();
          retryTimer = setTimeout(connect, 5000);
        };
      } catch {
        retryTimer = setTimeout(connect, 5000);
      }
    };

    connect();
    return () => {
      eventSource?.close();
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [onBrainUpdated]);

  return { incomingUpload, setIncomingUpload };
}
