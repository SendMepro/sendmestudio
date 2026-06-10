import { NextRequest } from "next/server";
import { subscribeToWhatsAppEvents } from "../realtime";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function resolveTenantId(
  request: NextRequest
): Promise<string | null> {
  // 1. Query param (impersonación)
  const queryTenantId = request.nextUrl.searchParams.get("tenantId");
  if (queryTenantId) {
    return queryTenantId;
  }

  // 2. Supabase session
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true },
    });
    if (!dbUser) return null;

    const userTenant = await prisma.userTenant.findFirst({
      where: { userId: dbUser.id },
      select: { tenantId: true },
      orderBy: { createdAt: "asc" },
    });

    return userTenant?.tenantId ?? null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const tenantId = await resolveTenantId(request);
  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: unknown, eventName = "message") => {
        controller.enqueue(
          encoder.encode(
            `event: ${eventName}\ndata: ${JSON.stringify(event)}\n\n`
          )
        );
      };

      unsubscribe = subscribeToWhatsAppEvents({
        id: crypto.randomUUID(),
        tenantId: tenantId ?? undefined,
        send(event) {
          send(event, event.type);
        },
      });

      send({ ok: true, tenantId }, "connected");
      heartbeat = setInterval(() => {
        send({ timestamp: Date.now() }, "heartbeat");
      }, 25000);
    },
    cancel() {
      unsubscribe?.();
      if (heartbeat) {
        clearInterval(heartbeat);
      }
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
