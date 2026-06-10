// ================================================================
// api/audiences/route.ts — Audience (listas de contactos)
// GET  → listar audiences del tenant
// POST → crear nueva audience
// PATCH → renombrar audience
// PUT  → duplicar audience
// DELETE → eliminar audience
// ================================================================

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireTenantFromNativeRequest } from "@/lib/tenant-helper";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AudienceContact = {
  name: string;
  phone: string;
  normalizedPhone: string;
  validWhatsapp: boolean;
};

function normalizePhone(raw: string): string {
  return raw.replace(/[^\d+]/g, "").replace(/^\+/, "");
}

function isValidWhatsApp(phone: string): boolean {
  const cleaned = phone.replace(/[^\d]/g, "");
  return cleaned.length >= 10 && cleaned.length <= 15;
}

function fromPrismaAudience(a: any) {
  return {
    id: a.id,
    name: a.name,
    source: a.source,
    contacts: a.contacts,
    totalContacts: a.totalContacts,
    validWhatsapp: a.validWhatsapp,
    invalidWhatsapp: a.invalidWhatsapp,
    createdAt: a.createdAt?.toISOString?.() ?? a.createdAt,
  };
}

export async function GET(request: Request) {
  const { ctx, error } = await requireTenantFromNativeRequest(request);
  if (error) return error;
  const tenantId = ctx!.tenantId;

  try {
    const audiences = await prisma.audience.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ ok: true, audiences: audiences.map(fromPrismaAudience) });
  } catch (err) {
    console.warn("[audiences] Prisma fallback:", err);
    const { listAudiences } = await import("@/data/audiences-store");
    return NextResponse.json({ ok: true, audiences: await listAudiences() });
  }
}

export async function POST(request: Request) {
  const { ctx, error } = await requireTenantFromNativeRequest(request);
  if (error) return error;
  const tenantId = ctx!.tenantId;

  try {
    const body = (await request.json()) as {
      name: string;
      contacts: { name: string; phone: string }[];
    };

    if (!body.name?.trim()) {
      return NextResponse.json({ ok: false, error: "Audience name is required" }, { status: 400 });
    }

    if (!Array.isArray(body.contacts) || body.contacts.length === 0) {
      return NextResponse.json({ ok: false, error: "At least one contact is required" }, { status: 400 });
    }

    const contacts: AudienceContact[] = body.contacts.map((c: { name: string; phone: string }) => {
      const normalizedPhone = normalizePhone(c.phone || "");
      const validWhatsapp = isValidWhatsApp(normalizedPhone);
      return {
        name: c.name?.trim() || "Sin nombre",
        phone: c.phone?.trim() || "",
        normalizedPhone,
        validWhatsapp,
      };
    });

    const validContacts = contacts.filter((c) => c.validWhatsapp);
    const invalidContacts = contacts.filter((c) => !c.validWhatsapp);

    const audience = await prisma.audience.create({
      data: {
        tenantId,
        name: body.name.trim(),
        source: "csv",
        contacts,
        totalContacts: contacts.length,
        validWhatsapp: validContacts.length,
        invalidWhatsapp: invalidContacts.length,
      },
    });

    // Sync to JSON store
    try {
      const { readStore, writeStore } = await import("@/data/audiences-store");
      const store = await readStore();
      store.audiences.push(fromPrismaAudience(audience) as any);
      await writeStore(store);
    } catch { /* ignore */ }

    return NextResponse.json({ ok: true, audience: fromPrismaAudience(audience) }, { status: 201 });
  } catch (err: any) {
    console.error("[audiences] POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { ctx, error } = await requireTenantFromNativeRequest(request);
  if (error) return error;
  const tenantId = ctx!.tenantId;

  try {
    const body = (await request.json()) as { id: string; name?: string };
    if (!body.id) {
      return NextResponse.json({ ok: false, error: "Audience id is required" }, { status: 400 });
    }

    const existing = await prisma.audience.findFirst({
      where: { id: body.id, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Audience not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (body.name?.trim()) {
      updateData.name = body.name.trim();
    }

    const updated = await prisma.audience.update({
      where: { id: body.id },
      data: updateData,
    });

    // Sync to JSON store
    try {
      const { readStore, writeStore } = await import("@/data/audiences-store");
      const store = await readStore();
      const idx = store.audiences.findIndex((a: any) => a.id === body.id);
      if (idx >= 0) {
        store.audiences[idx] = fromPrismaAudience(updated) as any;
        await writeStore(store);
      }
    } catch { /* ignore */ }

    return NextResponse.json({ ok: true, audience: fromPrismaAudience(updated) });
  } catch (err: any) {
    console.error("[audiences] PATCH error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { ctx, error } = await requireTenantFromNativeRequest(request);
  if (error) return error;
  const tenantId = ctx!.tenantId;

  try {
    const body = (await request.json()) as { id: string; name?: string };
    if (!body.id) {
      return NextResponse.json({ ok: false, error: "Source audience id is required" }, { status: 400 });
    }

    const original = await prisma.audience.findFirst({
      where: { id: body.id, tenantId },
    });

    if (!original) {
      return NextResponse.json({ ok: false, error: "Audience not found" }, { status: 404 });
    }

    const duplicate = await prisma.audience.create({
      data: {
        tenantId,
        name: (body.name?.trim() || `${original.name} (copia)`).trim(),
        source: original.source,
        contacts: original.contacts as any,
        totalContacts: original.totalContacts,
        validWhatsapp: original.validWhatsapp,
        invalidWhatsapp: original.invalidWhatsapp,
      },
    });

    // Sync to JSON store
    try {
      const { readStore, writeStore } = await import("@/data/audiences-store");
      const store = await readStore();
      store.audiences.push(fromPrismaAudience(duplicate) as any);
      await writeStore(store);
    } catch { /* ignore */ }

    return NextResponse.json({ ok: true, audience: fromPrismaAudience(duplicate) });
  } catch (err: any) {
    console.error("[audiences] PUT error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { ctx, error } = await requireTenantFromNativeRequest(request);
  if (error) return error;
  const tenantId = ctx!.tenantId;

  try {
    const body = (await request.json()) as { id: string };
    if (!body.id) {
      return NextResponse.json({ ok: false, error: "Audience id is required" }, { status: 400 });
    }

    const existing = await prisma.audience.findFirst({
      where: { id: body.id, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Audience not found" }, { status: 404 });
    }

    await prisma.audience.delete({ where: { id: body.id } });

    // Sync to JSON store
    try {
      const { readStore, writeStore } = await import("@/data/audiences-store");
      const store = await readStore();
      store.audiences = store.audiences.filter((a: any) => a.id !== body.id);
      await writeStore(store);
    } catch { /* ignore */ }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[audiences] DELETE error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
