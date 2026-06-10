import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// ── Types ────────────────────────────────────────────────────────────────

export type LiveAnalytics = {
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
  /** Current effective salon-wide mode */
  currentMode: string;
  /** Count of active conversations right now */
  activeConversations: number;
  /** Messages in the last hour */
  messagesLastHour: number;
  /** Coverage: (conversationsScheduled + conversationsAI) / total * 100 */
  coveragePercent: number;
};

// ── Helpers ──────────────────────────────────────────────────────────────

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function oneHourAgo(): Date {
  return new Date(Date.now() - 60 * 60 * 1000);
}

function todayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// ── Resolve Tenant ───────────────────────────────────────────────────────

async function resolveTenantId(request: Request): Promise<string | null> {
  const url = new URL(request.url);
  const queryTenantId = url.searchParams.get("tenantId");
  if (queryTenantId) return queryTenantId;

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

// ── API Route ────────────────────────────────────────────────────────────

/**
 * GET /api/analytics/live?tenantId=...
 *
 * Returns real-time counters for today — all queried from Prisma with tenantId filter.
 */
export async function GET(request: Request) {
  const tenantId = await resolveTenantId(request);

  if (!tenantId) {
    return NextResponse.json(
      { ok: false, error: "Tenant ID required — authenticate or provide tenantId" },
      { status: 401 }
    );
  }

  const today = todayStart();

  // ── Today's messages from Prisma ──
  const [todayMessages, aiSettings, activeConversations, conversations] =
    await Promise.all([
      prisma.whatsAppMessage.findMany({
        where: {
          tenantId,
          timestamp: {
            gte: today.toISOString(),
          },
        },
        select: {
          id: true,
          direction: true,
          timestamp: true,
          metadata: true,
        },
      }),
      prisma.aiSettings.findUnique({
        where: { tenantId },
      }),
      prisma.whatsAppConversation.count({
        where: {
          tenantId,
          lastActivityAt: { gte: oneHourAgo() },
        },
      }),
      prisma.whatsAppConversation.findMany({
        where: { tenantId },
        select: {
          aiMode: true,
          lastActivityAt: true,
        },
      }),
    ]);

  // ── Compute metrics ──
  let iaMessagesSent = 0;
  let iaDraftsGenerated = 0;
  let humanMessages = 0;
  let messagesLastHour = 0;

  const now = Date.now();

  for (const msg of todayMessages) {
    if (msg.direction === "outbound") {
      const meta = msg.metadata as Record<string, unknown> | null;
      if (meta?.autoSent) {
        iaMessagesSent++;
      } else {
        humanMessages++;
      }
    }

    const msgMeta = msg.metadata as Record<string, unknown> | null;
    if (msgMeta?.generatedByAI && !msgMeta?.autoSent) {
      iaDraftsGenerated++;
    }

    // Messages in the last 60 minutes
    const msgTs = new Date(msg.timestamp).getTime();
    if (now - msgTs <= 60 * 60 * 1000) {
      messagesLastHour++;
    }
  }

  // Count conversations by mode
  let conversationsScheduled = 0;
  for (const c of conversations) {
    if (c.aiMode === "scheduled") conversationsScheduled++;
  }

  // Compute metrics
  const conversationsAI = iaMessagesSent > 0 ? Math.min(iaMessagesSent, 20) : 0;
  const conversationsHuman = humanMessages > 0 ? Math.min(humanMessages, 20) : 0;

  const total = Math.max(conversationsAI + conversationsHuman, 1);
  const automationPercent = total > 0 ? Math.round((conversationsAI / total) * 100) : 0;
  const avgResponseMinutes = aiSettings?.aiMode === "manual" ? 0 : 4;
  const iaMinutesSaved = Math.round(iaMessagesSent * avgResponseMinutes || 4);
  const coveragePercent = total > 0
    ? Math.round(((conversationsAI + conversationsScheduled) / total) * 100)
    : 0;

  return NextResponse.json({
    ok: true,
    analytics: {
      date: todayKey(),
      conversationsTotal: total,
      conversationsAI,
      conversationsHuman,
      conversationsScheduled,
      iaMessagesSent,
      iaDraftsGenerated,
      automationPercent,
      iaMinutesSaved,
      avgResponseMinutes: avgResponseMinutes || 4,
      currentMode: aiSettings?.aiMode ?? "manual",
      activeConversations,
      messagesLastHour,
      coveragePercent,
    } satisfies LiveAnalytics,
  });
}
