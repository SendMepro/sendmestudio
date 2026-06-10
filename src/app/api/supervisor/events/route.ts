// src/app/api/supervisor/events/route.ts
// G-10: SSE endpoint for real-time supervisor dashboard updates.
// Polls BusinessEventBus.getMetrics() every 2s and sends diffs.
// Also sends agent heartbeat summary from the supervisor snapshot.

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Cached last-seen metrics fingerprint so we only push on actual changes. */
let lastMetricsJson: string | null = null;

export async function GET() {
  const encoder = new TextEncoder();
  let pollTimer: ReturnType<typeof setInterval> | undefined;
  let heartbeatTimer: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown, eventName = "message") => {
        controller.enqueue(
          encoder.encode(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      // Helper: read both bus metrics and supervisor report
      const poll = async () => {
        try {
          // Phase 1: business metrics from BusinessEventBus
          const { BusinessEventBus } = await import(
            "../../../../agents/system/BusinessEventBus"
          );
          const metrics = BusinessEventBus.getMetrics();
          const metricsPayload = {
            eventsToday: metrics.eventsToday,
            messagesReceived: metrics.messagesReceived,
            bookingsCreated: metrics.bookingsCreated,
            lastEvent: metrics.lastEvent
              ? {
                  type: metrics.lastEvent.type,
                  timestamp: metrics.lastEvent.timestamp,
                  conversationId: metrics.lastEvent.conversationId,
                  metadata: metrics.lastEvent.metadata,
                }
              : null,
            recentEvents: metrics.recentEvents.map((e) => ({
              type: e.type,
              timestamp: e.timestamp,
              conversationId: e.conversationId,
              metadata: e.metadata,
            })),
            byType: metrics.byType,
          };
          const metricsJson = JSON.stringify(metricsPayload);

          // Phase 2: supervisor snapshot (agent heartbeats)
          let supervisorPayload: Record<string, unknown> | null = null;
          try {
            const { SystemSupervisor } = await import(
              "../../../../agents/system/SystemSupervisorAgent"
            );
            const cached = SystemSupervisor.getCachedReport();
            if (cached) {
              supervisorPayload = {
                supervisor: cached.supervisor,
                overall: cached.overall,
                managedCount: cached.managedCount,
                totalAlive: cached.totalAlive,
                totalDegraded: cached.totalDegraded,
                totalUnreachable: cached.totalUnreachable,
                checkedAt: cached.checkedAt,
                isPolling: cached.isPolling,
                heartbeats: cached.heartbeats.map((hb) => ({
                  agentName: hb.agentName,
                  status: hb.status,
                  lastPing: hb.lastPing,
                  consecutiveFailures: hb.consecutiveFailures,
                  lastError: hb.lastError,
                })),
              };
            }
          } catch {
            // supervisor not available
          }

          // Only send metrics push if data changed since last poll
          if (metricsJson !== lastMetricsJson) {
            lastMetricsJson = metricsJson;
            send(
              {
                businessMetrics: metricsPayload,
                supervisor: supervisorPayload,
              },
              "supervisor_update"
            );
          }
        } catch {
          // bus not available — skip
        }
      };

      // Initial poll on connect
      await poll();

      // Poll every 2s for business event changes
      pollTimer = setInterval(poll, 2000);

      // Heartbeat every 25s to keep the connection alive
      heartbeatTimer = setInterval(() => {
        send({ timestamp: Date.now() }, "heartbeat");
      }, 25000);

      // Send connected confirmation
      send({ ok: true }, "connected");
    },
    cancel() {
      if (pollTimer) clearInterval(pollTimer);
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      lastMetricsJson = null;
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream",
      "X-Accel-Buffering": "no",
    },
  });
}
