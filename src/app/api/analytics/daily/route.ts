import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// ── Types ────────────────────────────────────────────────────────────────

export type DailyAnalytics = {
  date: string; // "2026-05-30"
  conversationsTotal: number;
  conversationsAI: number; // inbound that got autoSent reply
  conversationsHuman: number; // outbound without autoSent (manual sent)
  conversationsScheduled: number;
  iaMessagesSent: number; // AI auto replies sent
  iaDraftsGenerated: number; // AI drafts (not sent)
  iaMinutesSaved: number;
  automationPercent: number;
  coveragePercent: number;
  hourly: Record<string, { ai: number; human: number }>;
};

// ── Helpers ──────────────────────────────────────────────────────────────

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function hourKey(dateStr: string): string {
  const d = new Date(dateStr);
  return String(d.getHours()).padStart(2, "0");
}

function dateKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dayRange(targetDate: string): { start: Date; end: Date } {
  const [year, month, day] = targetDate.split("-").map(Number);
  const start = new Date(year, month - 1, day, 0, 0, 0, 0);
  const end = new Date(year, month - 1, day, 23, 59, 59, 999);
  return { start, end };
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

// ── Compute daily metrics from Prisma messages ───────────────────────────

async function computeDailyAnalytics(
  tenantId: string,
  targetDate: string,
  avgResponseMinutes: number
): Promise<DailyAnalytics> {
  const { start, end } = dayRange(targetDate);

  const messages = await prisma.whatsAppMessage.findMany({
    where: {
      tenantId,
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    select: {
      direction: true,
      timestamp: true,
      metadata: true,
    },
  });

  const hourly: Record<string, { ai: number; human: number }> = {};

  let iaMessagesSent = 0;
  let iaDraftsGenerated = 0;

  for (const msg of messages) {
    const hour = hourKey(msg.timestamp);
    if (!hourly[hour]) {
      hourly[hour] = { ai: 0, human: 0 };
    }

    if (msg.direction === "outbound") {
      const meta = msg.metadata as Record<string, unknown> | null;
      if (meta?.autoSent) {
        iaMessagesSent++;
        hourly[hour].ai++;
      } else {
        hourly[hour].human++;
      }
    }

    const meta = msg.metadata as Record<string, unknown> | null;
    if (meta?.generatedByAI && !meta?.autoSent) {
      iaDraftsGenerated++;
    }
  }

  const aiHours = Object.values(hourly).filter((h) => h.ai > 0).length;
  const humanHours = Object.values(hourly).filter((h) => h.human > 0).length;

  const conversationsAI = Math.max(aiHours, iaMessagesSent > 0 ? 1 : 0);
  const conversationsHuman = Math.max(humanHours, 1);

  const total = Math.max(conversationsAI + conversationsHuman, 1);
  const automationPercent = total > 0 ? Math.round((conversationsAI / total) * 100) : 0;
  const iaMinutesSaved = Math.round(iaMessagesSent * avgResponseMinutes);
  const coveragePercent = total > 0
    ? Math.round((conversationsAI / total) * 100)
    : 0;

  // Row per hour for the chart (00..23)
  const fullHourly: Record<string, { ai: number; human: number }> = {};
  for (let i = 0; i < 24; i++) {
    const h = String(i).padStart(2, "0");
    fullHourly[h] = hourly[h] || { ai: 0, human: 0 };
  }

  return {
    date: targetDate,
    conversationsTotal: total,
    conversationsAI,
    conversationsHuman,
    conversationsScheduled: 0,
    iaMessagesSent,
    iaDraftsGenerated,
    iaMinutesSaved,
    automationPercent,
    coveragePercent,
    hourly: fullHourly,
  };
}

// ── API Route ────

/**
 * GET /api/analytics/daily?date=2026-05-30&tenantId=...
 *
 * Returns computed daily analytics from Prisma with tenantId filter.
 */
export async function GET(request: Request) {
  const tenantId = await resolveTenantId(request);

  if (!tenantId) {
    return NextResponse.json(
      { ok: false, error: "Tenant ID required — authenticate or provide tenantId" },
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  const targetDate = url.searchParams.get("date") || todayKey();
  const avgResponseMinutes = Number(url.searchParams.get("avgResponseMinutes")) || 4;

  // Compute fresh from Prisma messages
  const analytics = await computeDailyAnalytics(tenantId, targetDate, avgResponseMinutes);

  return NextResponse.json({ ok: true, analytics });
}
