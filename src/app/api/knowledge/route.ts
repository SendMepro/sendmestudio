import { NextResponse } from "next/server";
import { requireTenantFromNativeRequest } from "@/lib/tenant-helper";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export type KnowledgeSection =
  | "salonProfile" | "businessHours" | "services" | "stylists"
  | "availabilityRules" | "bookingRules" | "faqs" | "aiRules"
  | "supportFeedRules" | "mediaLibrary"
  | "hours" | "policies" | "prompts" | "documents" | "other";

const SECTION_NAMES = new Set<KnowledgeSection>([
  "salonProfile", "businessHours", "services", "stylists",
  "availabilityRules", "bookingRules", "faqs", "aiRules",
  "supportFeedRules", "mediaLibrary",
  "hours", "policies", "prompts", "documents", "other",
]);

async function upsertSection(tenantId: string, section: KnowledgeSection, data: any) {
  const existing = await prisma.knowledgeItem.findFirst({
    where: { tenantId, section },
  });

  if (existing) {
    return prisma.knowledgeItem.update({
      where: { id: existing.id },
      data: { data },
    });
  }

  return prisma.knowledgeItem.create({
    data: { tenantId, section, data },
  });
}

export async function GET(request: Request) {
  const { ctx, error } = await requireTenantFromNativeRequest(request);
  if (error) return error;
  const tenantId = ctx!.tenantId;

  try {
    const url = new URL(request.url);
    const sectionFilter = url.searchParams.get("section");
    const where: any = { tenantId };
    if (sectionFilter) where.section = sectionFilter;

    const items = await prisma.knowledgeItem.findMany({
      where,
      orderBy: { sortOrder: "asc" },
    });

    // If section filter is set, return items array
    if (sectionFilter) {
      return NextResponse.json({
        ok: true,
        items: items.map((item) => ({
          id: item.id,
          section: item.section,
          key: item.key || item.section,
          data: item.data,
          createdAt: item.createdAt,
        })),
      });
    }

    // Otherwise return bundled knowledge (backward compat)
    const knowledge: Record<string, any> = {};
    for (const item of items) {
      knowledge[item.section] = item.data;
    }

    return NextResponse.json({ ok: true, knowledge });
  } catch (err) {
    console.warn("[knowledge] Prisma fallback to JSON:", err);
    // Fallback to JSON store
    const { readKnowledgeBundle } = await import("./store");
    const knowledge = await readKnowledgeBundle();
    return NextResponse.json({ ok: true, knowledge, items: [] });
  }
}

export async function POST(request: Request) {
  const { ctx, error } = await requireTenantFromNativeRequest(request);
  if (error) return error;
  const tenantId = ctx!.tenantId;

  const body = await request.json();

  try {
    if (body?.section && SECTION_NAMES.has(body.section)) {
      const item = await upsertSection(tenantId, body.section, body.data);

      // Sync to JSON store
      try {
        const { writeKnowledgeSection } = await import("./store");
        await writeKnowledgeSection(body.section, body.data);
      } catch { /* ignore */ }

      return NextResponse.json({ ok: true, section: body.section, data: item.data });
    }

    // Write full bundle
    const bundle = body?.knowledge ?? body ?? {};
    for (const [section, data] of Object.entries(bundle)) {
      if (SECTION_NAMES.has(section as KnowledgeSection)) {
        await upsertSection(tenantId, section as KnowledgeSection, data);
      }
    }

    // Sync to JSON store
    try {
      const { writeKnowledgeBundle } = await import("./store");
      await writeKnowledgeBundle(bundle);
    } catch { /* ignore */ }

    // Re-read from Prisma
    const items = await prisma.knowledgeItem.findMany({
      where: { tenantId },
    });
    const knowledge: Record<string, any> = {};
    for (const item of items) {
      knowledge[item.section] = item.data;
    }

    return NextResponse.json({ ok: true, knowledge });
  } catch (err: any) {
    console.error("[knowledge] POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { ctx, error } = await requireTenantFromNativeRequest(request);
  if (error) return error;
  const tenantId = ctx!.tenantId;

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Se requiere id" }, { status: 400 });
  }

  try {
    // Verify ownership
    const item = await prisma.knowledgeItem.findUnique({ where: { id } });
    if (!item || item.tenantId !== tenantId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.knowledgeItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[knowledge] DELETE error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { ctx, error } = await requireTenantFromNativeRequest(request);
  if (error) return error;
  const tenantId = ctx!.tenantId;

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Se requiere id" }, { status: 400 });
  }

  try {
    // Verify ownership
    const item = await prisma.knowledgeItem.findUnique({ where: { id } });
    if (!item || item.tenantId !== tenantId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const updated = await prisma.knowledgeItem.update({
      where: { id },
      data: {
        data: body.data ?? body,
        ...(body.key ? { key: body.key } : {}),
        ...(body.section ? { section: body.section } : {}),
      },
    });

    return NextResponse.json({ ok: true, item: updated });
  } catch (err: any) {
    console.error("[knowledge] PATCH error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
