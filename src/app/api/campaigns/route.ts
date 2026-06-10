import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireTenantFromNativeRequest } from "@/lib/tenant-helper";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CampaignType =
  | "reactivacion" | "cumpleanos" | "promocion" | "recordatorio" | "personalizada";

type CreateBody = {
  name: string;
  type: CampaignType;
  description?: string;
  targetCount?: number;
  estimatedMessages?: number;
  scheduledDate?: string | null;
};

function fromPrismaCampaign(c: any) {
  return {
    id: c.id,
    name: c.name,
    type: c.type,
    status: c.status,
    description: c.description,
    targetCount: c.targetCount,
    estimatedMessages: c.estimatedMessages,
    scheduledDate: c.scheduledDate,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export async function GET(request: Request) {
  const { ctx, error } = await requireTenantFromNativeRequest(request);
  if (error) return error;

  try {
    const campaigns = await prisma.campaign.findMany({
      where: { tenantId: ctx!.tenantId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(campaigns.map(fromPrismaCampaign));
  } catch (err) {
    console.warn("[campaigns] Prisma fallback:", err);
    // Fallback to JSON store (filtered by tenantId for isolation)
    const { readStore } = await import("@/data/campaigns-store");
    const store = await readStore();
    const tenantFiltered = ctx?.tenantId
      ? store.campaigns.filter((c: any) => c.tenantId === ctx!.tenantId || !c.tenantId)
      : store.campaigns;
    return NextResponse.json(tenantFiltered);
  }
}

export async function POST(request: Request) {
  const { ctx, error } = await requireTenantFromNativeRequest(request);
  if (error) return error;
  const tenantId = ctx!.tenantId;

  const body = (await request.json()) as CreateBody;

  if (!body.name || !body.type) {
    return NextResponse.json(
      { error: "name and type are required" },
      { status: 400 },
    );
  }

  const validTypes: CampaignType[] = [
    "reactivacion", "cumpleanos", "promocion", "recordatorio", "personalizada",
  ];
  if (!validTypes.includes(body.type)) {
    return NextResponse.json(
      { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
      { status: 400 },
    );
  }

  try {
    const campaign = await prisma.campaign.create({
      data: {
        tenantId,
        name: body.name,
        type: body.type,
        status: "draft",
        description: body.description || "",
        targetCount: body.targetCount || 0,
        estimatedMessages: body.estimatedMessages || 0,
        scheduledDate: body.scheduledDate || null,
      },
    });

    // Also sync to JSON store as fallback
    try {
      const campaignJson = {
        id: campaign.id,
        name: campaign.name,
        type: campaign.type,
        status: campaign.status,
        description: campaign.description,
        targetCount: campaign.targetCount,
        estimatedMessages: campaign.estimatedMessages,
        scheduledDate: campaign.scheduledDate,
        createdAt: campaign.createdAt.toISOString(),
        updatedAt: campaign.updatedAt.toISOString(),
      };
      const { readStore, writeStore } = await import("@/data/campaigns-store");
      const store = await readStore();
      store.campaigns.push(campaignJson as any);
      await writeStore(store);
    } catch { /* ignore JSON sync */ }

    return NextResponse.json({ success: true, campaign: fromPrismaCampaign(campaign) }, { status: 201 });
  } catch (err: any) {
    console.error("[campaigns] Create error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
