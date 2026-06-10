// ================================================================
// Customer Memory API — GET by phone (Prisma tenant-aware)
// ================================================================

import { NextResponse } from "next/server";
import { requireTenantFromNativeRequest } from "@/lib/tenant-helper";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function normalisePhone(raw: string): string {
  return raw.replace(/^\+/, "");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ phone: string }> },
): Promise<Response> {
  const { ctx, error } = await requireTenantFromNativeRequest(request);
  if (error) return error;

  const { phone: rawPhone } = await params;
  const phone = normalisePhone(rawPhone);

  if (!phone) {
    return NextResponse.json(
      { ok: false, error: "Phone parameter is required" },
      { status: 400 },
    );
  }

  try {
    const record = await prisma.customerMemory.findUnique({
      where: { tenantId_phone: { tenantId: ctx!.tenantId, phone } },
    });

    if (!record) {
      return NextResponse.json(
        { ok: false, error: "Customer memory profile not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      profile: {
        ...(record.profile as any),
        phone: record.phone,
        signals: record.signals,
      },
    });
  } catch (err) {
    console.warn("[customer-memory/phone] Prisma fallback:", err);
    const { getCustomerMemoryProfileByPhone } = await import(
      "../../../../data/customer-memory-store"
    );
    const profile = await getCustomerMemoryProfileByPhone(phone);
    if (!profile) {
      return NextResponse.json(
        { ok: false, error: "Customer memory profile not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true, profile });
  }
}
