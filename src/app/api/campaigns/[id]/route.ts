import { NextResponse } from "next/server";
import { requireTenantFromNativeRequest } from "@/lib/tenant-helper";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { logFieldOverrideAttempt } from "@/lib/security/audit-log";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Zod strict schema for campaign updates
const campaignUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  type: z.string().optional(),
  status: z.enum(["draft", "active", "paused", "completed", "cancelled"]).optional(),
  description: z.string().max(2000).optional(),
  targetCount: z.number().int().min(0).optional(),
  estimatedMessages: z.number().int().min(0).optional(),
  scheduledDate: z.string().optional(),
}).strict();

// Fields that should NEVER come from frontend
const BLOCKED_FIELDS = [
  "tenantId", "id", "createdAt", "updatedAt", "ownerId",
  "role", "isAdmin", "permissions",
];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, error } = await requireTenantFromNativeRequest(request);
  if (error) return error;
  const tenantId = ctx!.tenantId;

  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;

  try {
    const existing = await prisma.campaign.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // ── Block forbidden fields ──
    const blockedAttempt = BLOCKED_FIELDS.find((f) => body[f] !== undefined);
    if (blockedAttempt) {
      logFieldOverrideAttempt({
        userId: ctx!.user.id,
        tenantId,
        field: blockedAttempt,
        path: request.url,
        detail: `Blocked field '${blockedAttempt}' in PATCH body`,
      });
      return NextResponse.json(
        { error: `Campo '${blockedAttempt}' no permitido` },
        { status: 400 },
      );
    }

    // ── Zod strict validation ──
    const validation = campaignUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten() },
        { status: 400 },
      );
    }

    const updateData = validation.data;

    const updated = await prisma.campaign.update({
      where: { id },
      data: updateData as any,
    });

    // Sync to JSON store
    try {
      const campaignJson = {
        id: updated.id,
        name: updated.name,
        type: updated.type,
        status: updated.status,
        description: updated.description,
        targetCount: updated.targetCount,
        estimatedMessages: updated.estimatedMessages,
        scheduledDate: updated.scheduledDate,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
      const { readStore, writeStore } = await import("@/data/campaigns-store");
      const store = await readStore();
      const idx = store.campaigns.findIndex((c: any) => c.id === id);
      if (idx >= 0) {
        store.campaigns[idx] = campaignJson as any;
        await writeStore(store);
      }
    } catch { /* ignore */ }

    return NextResponse.json({ success: true, campaign: updated });
  } catch (err: any) {
    console.error("[campaigns/patch] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, error } = await requireTenantFromNativeRequest(request);
  if (error) return error;
  const tenantId = ctx!.tenantId;

  const { id } = await params;

  try {
    const existing = await prisma.campaign.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    await prisma.campaign.delete({ where: { id } });

    // Sync to JSON store
    try {
      const { readStore, writeStore } = await import("@/data/campaigns-store");
      const store = await readStore();
      store.campaigns = store.campaigns.filter((c: any) => c.id !== id);
      await writeStore(store);
    } catch { /* ignore */ }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[campaigns/delete] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
