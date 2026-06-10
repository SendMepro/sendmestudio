/* ═══════════════════════════════════════════════════════════════
   ProductSalesRepository — Registro de ventas de productos (Multi-Tenant)
   Basado en docs/SALON_OPERATION_REQUIREMENTS.md §5
   Fase 10: Migrado de JSON file store a Prisma con tenantId
   ═══════════════════════════════════════════════════════════════ */

import { prisma } from "@/lib/prisma";
import type { ProductSale } from "./inventory-types";

const COMMISSION_PERCENT = 0.07; // 7%

// ── Helper: map Prisma ProductSale → domain ProductSale ──

function mapSale(row: {
  id: string;
  productId: string;
  clientId: string;
  stylistId: string;
  salePrice: number;
  commissionPercent: number;
  commissionAmount: number;
  timestamp: Date;
}): ProductSale {
  return {
    id: row.id,
    productId: row.productId,
    clientId: row.clientId,
    stylistId: row.stylistId,
    salePrice: row.salePrice,
    commissionPercent: row.commissionPercent,
    commissionAmount: row.commissionAmount,
    timestamp: row.timestamp.toISOString(),
  };
}

/* ─── CRUD ──────────────────────────────────────────────────── */

export async function getAllSales(tenantId: string): Promise<ProductSale[]> {
  const rows = await prisma.productSale.findMany({
    where: { tenantId },
    orderBy: { timestamp: "desc" },
  });
  return rows.map(mapSale);
}

export async function getSaleById(
  tenantId: string,
  id: string
): Promise<ProductSale | undefined> {
  const row = await prisma.productSale.findFirst({
    where: { tenantId, id },
  });
  return row ? mapSale(row) : undefined;
}

export async function createSale(
  tenantId: string,
  data: Omit<ProductSale, "id" | "commissionPercent" | "commissionAmount">
): Promise<ProductSale> {
  const commissionAmount =
    Math.round(data.salePrice * COMMISSION_PERCENT * 100) / 100;

  const row = await prisma.productSale.create({
    data: {
      tenantId,
      productId: data.productId,
      clientId: data.clientId,
      stylistId: data.stylistId,
      salePrice: data.salePrice,
      commissionPercent: COMMISSION_PERCENT,
      commissionAmount,
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
    },
  });

  return mapSale(row);
}

/* ─── Monthly aggregations ──────────────────────────────────── */

export async function getMonthlySales(
  tenantId: string,
  year: number,
  month: number
): Promise<ProductSale[]> {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);

  const rows = await prisma.productSale.findMany({
    where: {
      tenantId,
      timestamp: { gte: start, lte: end },
    },
    orderBy: { timestamp: "desc" },
  });
  return rows.map(mapSale);
}

export async function getMonthlySalesTotal(
  tenantId: string,
  year: number,
  month: number
): Promise<{
  totalAmount: number;
  totalItems: number;
  count: number;
}> {
  const sales = await getMonthlySales(tenantId, year, month);
  return {
    totalAmount: sales.reduce((sum, s) => sum + s.salePrice, 0),
    totalItems: sales.length,
    count: sales.length,
  };
}

/* ─── Top seller ────────────────────────────────────────────── */

export async function getTopSeller(
  tenantId: string,
  year: number,
  month: number
): Promise<{
  stylistId: string;
  totalAmount: number;
  salesCount: number;
} | null> {
  const sales = await getMonthlySales(tenantId, year, month);
  if (sales.length === 0) return null;

  const grouped = new Map<
    string,
    { totalAmount: number; salesCount: number }
  >();
  for (const s of sales) {
    const g = grouped.get(s.stylistId) || {
      totalAmount: 0,
      salesCount: 0,
    };
    g.totalAmount += s.salePrice;
    g.salesCount++;
    grouped.set(s.stylistId, g);
  }

  let best: {
    stylistId: string;
    totalAmount: number;
    salesCount: number;
  } | null = null;
  for (const [stylistId, stats] of grouped) {
    if (!best || stats.totalAmount > best.totalAmount) {
      best = { stylistId, ...stats };
    }
  }
  return best;
}

/* ─── Top product ───────────────────────────────────────────── */

export async function getTopProduct(
  tenantId: string,
  year: number,
  month: number
): Promise<{
  productId: string;
  name: string;
  unitsSold: number;
  totalAmount: number;
} | null> {
  const sales = await getMonthlySales(tenantId, year, month);
  if (sales.length === 0) return null;

  const grouped = new Map<
    string,
    { totalAmount: number; unitsSold: number }
  >();
  for (const s of sales) {
    const g = grouped.get(s.productId) || {
      totalAmount: 0,
      unitsSold: 0,
    };
    g.totalAmount += s.salePrice;
    g.unitsSold++;
    grouped.set(s.productId, g);
  }

  let best: {
    productId: string;
    name: string;
    unitsSold: number;
    totalAmount: number;
  } | null = null;
  for (const [productId, stats] of grouped) {
    if (!best || stats.unitsSold > best.unitsSold) {
      best = { productId, name: productId, ...stats };
    }
  }
  return best;
}
