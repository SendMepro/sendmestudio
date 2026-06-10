/* ═══════════════════════════════════════════════════════════════
   CommissionRepository — Comisiones 7% sobre venta a clientes (Multi-Tenant)
   Basado en docs/SALON_OPERATION_REQUIREMENTS.md §5
   Fase 10: Migrado de JSON file store a Prisma con tenantId
   ═══════════════════════════════════════════════════════════════ */

import { prisma } from "@/lib/prisma";
import type { CommissionRecord } from "./inventory-types";

// ── Helper: map Prisma CommissionRecord → domain CommissionRecord ──

function mapRecord(row: {
  id: string;
  stylistId: string;
  saleId: string;
  amount: number;
  status: string;
}): CommissionRecord {
  return {
    id: row.id,
    stylistId: row.stylistId,
    saleId: row.saleId,
    amount: row.amount,
    status: row.status as "pending" | "paid",
  };
}

/* ─── CRUD ──────────────────────────────────────────────────── */

export async function getAllCommissions(
  tenantId: string
): Promise<CommissionRecord[]> {
  const rows = await prisma.commissionRecord.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapRecord);
}

export async function getCommissionById(
  tenantId: string,
  id: string
): Promise<CommissionRecord | undefined> {
  const row = await prisma.commissionRecord.findFirst({
    where: { tenantId, id },
  });
  return row ? mapRecord(row) : undefined;
}

export async function createCommission(
  tenantId: string,
  data: Omit<CommissionRecord, "id" | "status">
): Promise<CommissionRecord> {
  const row = await prisma.commissionRecord.create({
    data: {
      tenantId,
      stylistId: data.stylistId,
      saleId: data.saleId,
      amount: data.amount,
      status: "pending",
    },
  });
  return mapRecord(row);
}

export async function markCommissionAsPaid(
  tenantId: string,
  id: string
): Promise<CommissionRecord | undefined> {
  const existing = await prisma.commissionRecord.findFirst({
    where: { tenantId, id },
  });
  if (!existing) return undefined;

  const row = await prisma.commissionRecord.update({
    where: { id },
    data: { status: "paid" },
  });
  return mapRecord(row);
}

/* ─── Aggregations ──────────────────────────────────────────── */

export async function getPendingCommissions(
  tenantId: string
): Promise<CommissionRecord[]> {
  const rows = await prisma.commissionRecord.findMany({
    where: { tenantId, status: "pending" },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapRecord);
}

export async function getPendingCommissionsTotal(
  tenantId: string
): Promise<{ totalAmount: number; count: number }> {
  const pending = await getPendingCommissions(tenantId);
  return {
    totalAmount: pending.reduce((sum, r) => sum + r.amount, 0),
    count: pending.length,
  };
}

export async function getCommissionsByStylist(
  tenantId: string,
  stylistId: string
): Promise<CommissionRecord[]> {
  const rows = await prisma.commissionRecord.findMany({
    where: { tenantId, stylistId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapRecord);
}

export async function getPaidCommissionsTotal(
  tenantId: string
): Promise<number> {
  const result = await prisma.commissionRecord.aggregate({
    where: { tenantId, status: "paid" },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}
