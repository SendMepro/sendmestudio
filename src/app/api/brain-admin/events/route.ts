/* ─── SSE endpoint for Brain Admin realtime updates ──────────────── */

import { isBrainAdminAuthenticated } from "../auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export type BrainRealtimeEvent =
  | { type: "upload_received"; fileName: string; fileSize: number; sourceType: string; session?: string }
  | { type: "brain_updated"; summary: unknown }
  | { type: "connected" };

const clients = new Set<{
  id: string;
  send: (event: BrainRealtimeEvent) => void;
}>();

export function subscribeToBrainEvents(subscriber: {
  id: string;
  send: (event: BrainRealtimeEvent) => void;
}) {
  clients.add(subscriber);
  return () => clients.delete(subscriber);
}

export function emitBrainEvent(event: BrainRealtimeEvent) {
  for (const client of clients) {
    try {
      client.send(event);
    } catch {
      clients.delete(client);
    }
  }
}

export async function GET() {
  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: BrainRealtimeEvent) => {
        controller.enqueue(
          encoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`)
        );
      };

      unsubscribe = subscribeToBrainEvents({
        id: crypto.randomUUID(),
        send,
      });

      send({ type: "connected" });
      heartbeat = setInterval(() => {
        send({ type: "connected" as any });
      }, 25000);
    },
    cancel() {
      unsubscribe?.();
      if (heartbeat) clearInterval(heartbeat);
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
