import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ConversationMode = "manual" | "automatic" | "scheduled" | "inherit";

type ConfigBody = {
  defaultMode?: ConversationMode;
  scheduleStart?: string;
  scheduleEnd?: string;
  averageHumanResponseMinutes?: number;
  conversationOverride?: {
    conversationId: string;
    mode: ConversationMode;
  };
  removeOverride?: string; // conversationId
};

type AiConfigResponse = {
  defaultMode: ConversationMode;
  scheduleStart: string;
  scheduleEnd: string;
  averageHumanResponseMinutes: number;
  conversationOverrides: Record<string, { mode: ConversationMode }>;
};

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

// ── Read config from Prisma (AiSettings + WhatsAppTenantMapping) ─────────

async function getAiConfig(tenantId: string): Promise<AiConfigResponse> {
  const settings = await prisma.aiSettings.findUnique({
    where: { tenantId },
  });

  const mapping = await prisma.whatsAppTenantMapping.findUnique({
    where: { tenantId },
  });

  // Extract schedule from aiRules JSON or use defaults
  const rules = (settings?.aiRules ?? []) as Record<string, unknown>[];
  const scheduleRule = rules.find((r: Record<string, unknown>) => r.type === "schedule");
  const scheduleStart = (scheduleRule?.start as string) ?? "22:00";
  const scheduleEnd = (scheduleRule?.end as string) ?? "08:00";

  return {
    defaultMode: (settings?.aiMode as ConversationMode) ?? "manual",
    scheduleStart,
    scheduleEnd,
    averageHumanResponseMinutes: 4, // default
    conversationOverrides: (settings?.supportFeedRules as Record<string, { mode: ConversationMode }>) ?? {},
  };
}

// ── Save config to Prisma ────────────────────────────────────────────────

async function saveAiConfig(tenantId: string, config: AiConfigResponse): Promise<void> {
  const settings = await prisma.aiSettings.findUnique({
    where: { tenantId },
  });

  const aiRules = (settings?.aiRules ?? []) as Record<string, unknown>[];
  const scheduleIndex = aiRules.findIndex((r: Record<string, unknown>) => r.type === "schedule");
  const scheduleRule = {
    type: "schedule",
    start: config.scheduleStart,
    end: config.scheduleEnd,
  };

  let updatedRules: Record<string, unknown>[];
  if (scheduleIndex >= 0) {
    updatedRules = [...aiRules];
    updatedRules[scheduleIndex] = scheduleRule;
  } else {
    updatedRules = [...aiRules, scheduleRule];
  }

  await prisma.aiSettings.upsert({
    where: { tenantId },
    create: {
      tenantId,
      aiMode: config.defaultMode,
      aiRules: updatedRules as object,
      supportFeedRules: config.conversationOverrides as object,
    },
    update: {
      aiMode: config.defaultMode,
      aiRules: updatedRules as object,
      supportFeedRules: config.conversationOverrides as object,
    },
  });
}

// ── API Routes ───────────────────────────────────────────────────────────

/**
 * GET /api/analytics/config?tenantId=...
 *
 * Returns the current AI configuration for the tenant.
 */
export async function GET(request: Request) {
  const tenantId = await resolveTenantId(request);

  if (!tenantId) {
    return NextResponse.json(
      { ok: false, error: "Tenant ID required — authenticate or provide tenantId" },
      { status: 401 }
    );
  }

  const config = await getAiConfig(tenantId);
  return NextResponse.json({ ok: true, config });
}

/**
 * POST /api/analytics/config
 *
 * Updates AI configuration for the tenant.
 * Partial updates allowed — only provided fields are changed.
 */
export async function POST(request: Request) {
  const tenantId = await resolveTenantId(request);

  if (!tenantId) {
    return NextResponse.json(
      { ok: false, error: "Tenant ID required — authenticate or provide tenantId" },
      { status: 401 }
    );
  }

  const body = (await request.json()) as ConfigBody;
  const config = await getAiConfig(tenantId);

  if (body.defaultMode !== undefined) {
    const valid: ConversationMode[] = ["manual", "automatic", "scheduled", "inherit"];
    if (!valid.includes(body.defaultMode)) {
      return NextResponse.json(
        { ok: false, error: `Invalid mode: ${body.defaultMode}. Must be one of: ${valid.join(", ")}` },
        { status: 400 }
      );
    }
    config.defaultMode = body.defaultMode;
  }

  if (body.scheduleStart !== undefined) {
    if (!/^\d{2}:\d{2}$/.test(body.scheduleStart)) {
      return NextResponse.json(
        { ok: false, error: "scheduleStart must be in HH:mm format (24h)" },
        { status: 400 }
      );
    }
    config.scheduleStart = body.scheduleStart;
  }

  if (body.scheduleEnd !== undefined) {
    if (!/^\d{2}:\d{2}$/.test(body.scheduleEnd)) {
      return NextResponse.json(
        { ok: false, error: "scheduleEnd must be in HH:mm format (24h)" },
        { status: 400 }
      );
    }
    config.scheduleEnd = body.scheduleEnd;
  }

  if (body.averageHumanResponseMinutes !== undefined) {
    if (body.averageHumanResponseMinutes < 1 || body.averageHumanResponseMinutes > 60) {
      return NextResponse.json(
        { ok: false, error: "averageHumanResponseMinutes must be between 1 and 60" },
        { status: 400 }
      );
    }
    config.averageHumanResponseMinutes = body.averageHumanResponseMinutes;
  }

  if (body.conversationOverride) {
    const valid: ConversationMode[] = ["manual", "automatic", "scheduled", "inherit"];
    if (!valid.includes(body.conversationOverride.mode)) {
      return NextResponse.json(
        { ok: false, error: `Invalid override mode: ${body.conversationOverride.mode}` },
        { status: 400 }
      );
    }
    config.conversationOverrides[body.conversationOverride.conversationId] = {
      mode: body.conversationOverride.mode,
    };
    await prisma.whatsAppConversation.upsert({
      where: {
        tenantId_id: {
          tenantId,
          id: body.conversationOverride.conversationId,
        },
      },
      create: {
        id: body.conversationOverride.conversationId,
        tenantId,
        phone: body.conversationOverride.conversationId,
        aiMode: body.conversationOverride.mode,
        lastActivityAt: new Date(),
      },
      update: {
        aiMode: body.conversationOverride.mode,
      },
    });
  }

  if (body.removeOverride) {
    delete config.conversationOverrides[body.removeOverride];
    await prisma.whatsAppConversation.updateMany({
      where: {
        tenantId,
        id: body.removeOverride,
      },
      data: { aiMode: "inherit" },
    });
  }

  await saveAiConfig(tenantId, config);

  return NextResponse.json({ ok: true, config });
}
