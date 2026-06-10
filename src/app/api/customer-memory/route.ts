// ================================================================
// Customer Memory API — GET / POST endpoints (Prisma tenant-aware)
// Phase: FASE 2 — Customer Memory Agent MVP
// Status: migrated to Prisma (JSON fallback preserved)
// ================================================================

import { NextResponse } from "next/server";
import { requireTenantFromNativeRequest } from "@/lib/tenant-helper";
import prisma from "@/lib/prisma";
import {
  processCustomerMessage,
  getAllProfiles,
  getProfile,
} from "../../../agents/customer-memory-agent";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ── GET /api/customer-memory ──────────────────────────────────────

export async function GET(request: Request) {
  const { ctx, error } = await requireTenantFromNativeRequest(request);
  if (error) return error;
  const tenantId = ctx!.tenantId;

  const url = new URL(request.url);
  const phone = url.searchParams.get("phone");

  if (phone) {
    try {
      const record = await prisma.customerMemory.findUnique({
        where: { tenantId_phone: { tenantId, phone } },
      });
      if (!record) {
        return NextResponse.json(
          { ok: false, error: "Profile not found" },
          { status: 404 },
        );
      }
      return NextResponse.json({
        ok: true,
        profile: { ...(record.profile as any), phone: record.phone, tenantId },
      });
    } catch {
      // Fallback to JSON store
      const profile = await getProfile(phone, tenantId);
      if (!profile) {
        return NextResponse.json(
          { ok: false, error: "Profile not found" },
          { status: 404 },
        );
      }
      return NextResponse.json({ ok: true, profile });
    }
  }

  // Get all profiles for this tenant
  try {
    const records = await prisma.customerMemory.findMany({
      where: { tenantId },
      orderBy: { updatedAt: "desc" },
    });

    const profiles = records.map((r) => ({
      ...(r.profile as any),
      phone: r.phone,
      signals: r.signals as any[],
      _tenantId: tenantId,
    }));

    const stats = {
      totalSignals: records.reduce((sum, r) => sum + (Array.isArray(r.signals) ? r.signals.length : 0), 0),
      profilesWithParkingInterest: profiles.filter((p: any) => p.parkingInterest).length,
      profilesWithPriceSensitivity: profiles.filter((p: any) => p.priceSensitive).length,
      profilesWithAllergies: profiles.filter((p: any) => p.allergies?.length > 0).length,
      topFavoriteServices: [] as string[],
    };

    return NextResponse.json({
      ok: true,
      totalProfiles: records.length,
      stats,
      profiles,
    });
  } catch (err) {
    console.warn("[customer-memory] Prisma fallback:", err);
    const { getAllCustomerMemoryProfiles, getCustomerMemoryStats } = await import(
      "../../../data/customer-memory-store"
    );
    const [profiles, stats] = await Promise.all([
      getAllCustomerMemoryProfiles(),
      getCustomerMemoryStats(),
    ]);
    return NextResponse.json({
      ok: true,
      totalProfiles: profiles.length,
      stats,
      profiles,
    });
  }
}

// ── POST /api/customer-memory ─────────────────────────────────────

export async function POST(request: Request) {
  const { ctx } = await requireTenantFromNativeRequest(request);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const customerPhone = String(body.customerPhone ?? "").trim();
  const customerName = String(body.customerName ?? "").trim();
  const messageText = String(body.messageText ?? "").trim();
  const source = String(body.source ?? "api").trim();

  if (!customerPhone) {
    return NextResponse.json(
      { ok: false, error: "customerPhone is required" },
      { status: 400 },
    );
  }

  if (!messageText) {
    return NextResponse.json(
      { ok: false, error: "messageText is required" },
      { status: 400 },
    );
  }

  const result = await processCustomerMessage({
    customerPhone,
    customerName: customerName || "Unknown",
    messageText,
    source,
    tenantId: ctx?.tenantId,
  });

  // Also persist to Prisma
  if (ctx?.tenantId) {
    try {
      await prisma.customerMemory.upsert({
        where: { tenantId_phone: { tenantId: ctx.tenantId, phone: customerPhone } },
        create: {
          tenantId: ctx.tenantId,
          phone: customerPhone,
          profile: result.profile as any,
          signals: (result.profile as any)?.signals ?? [],
        },
        update: {
          profile: result.profile as any,
          signals: (result.profile as any)?.signals ?? [],
        },
      });
    } catch (err) {
      console.warn("[customer-memory] Prisma upsert failed:", err);
    }
  }

  return NextResponse.json(
    {
      ok: true,
      profile: result.profile,
      signalsAdded: result.signalsAdded,
      isNew: result.isNew,
    },
    { status: result.isNew ? 201 : 200 },
  );
}
