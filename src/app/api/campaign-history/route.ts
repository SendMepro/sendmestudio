// ================================================================
// api/campaign-history/route.ts — Historial de campañas
// GET  → listar historial del tenant autenticado
// POST → agregar registro al historial
// ================================================================

import { NextResponse } from "next/server";
import { requireTenantFromNativeRequest } from "@/lib/tenant-helper";
import { promises as fs } from "fs";
import path from "path";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// JSON fallback path
const historyDir = path.join(process.cwd(), "data", "campaign-history");
const historyFile = path.join(historyDir, "history.json");

async function readJsonFallback() {
  try {
    const content = await fs.readFile(historyFile, "utf8");
    return JSON.parse(content) as unknown[];
  } catch {
    await fs.mkdir(historyDir, { recursive: true });
    await fs.writeFile(historyFile, JSON.stringify([], null, 2));
    return [];
  }
}

async function writeJsonFallback(history: unknown[]) {
  await fs.mkdir(historyDir, { recursive: true });
  await fs.writeFile(historyFile, JSON.stringify(history, null, 2));
}

function fromPrismaRecord(r: any) {
  return {
    id: r.id,
    campaignId: r.campaignId,
    campaignName: r.campaignName,
    campaignType: r.campaignType,
    action: r.action,
    phone: r.phone,
    customerName: r.customerName,
    metadata: r.metadata,
    timestamp: r.createdAt?.toISOString?.() ?? r.createdAt,
    createdAt: r.createdAt?.toISOString?.() ?? r.createdAt,
  };
}

export async function GET(request: Request) {
  const { ctx, error } = await requireTenantFromNativeRequest(request);
  if (error) return error;
  const tenantId = ctx!.tenantId;

  try {
    const records = await prisma.campaignHistory.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ history: records.map(fromPrismaRecord) });
  } catch (err) {
    console.warn("[campaign-history] Prisma fallback to JSON:", err);
    return NextResponse.json({ history: await readJsonFallback() });
  }
}

export async function POST(request: Request) {
  const { ctx, error } = await requireTenantFromNativeRequest(request);
  if (error) return error;
  const tenantId = ctx!.tenantId;

  try {
    const body = await request.json();

    const record = await prisma.campaignHistory.create({
      data: {
        tenantId,
        campaignId: body.campaignId || null,
        campaignName: body.campaignName || "",
        campaignType: body.campaignType || "",
        action: body.action || "sent",
        phone: body.phone || null,
        customerName: body.customerName || null,
        metadata: body.metadata || {},
      },
    });

    // Sync to JSON fallback
    try {
      const jsonHistory = await readJsonFallback();
      jsonHistory.unshift(fromPrismaRecord(record));
      await writeJsonFallback(jsonHistory);
    } catch { /* ignore */ }

    return NextResponse.json({ ok: true, record: fromPrismaRecord(record) }, { status: 201 });
  } catch (err: any) {
    console.error("[campaign-history] POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
