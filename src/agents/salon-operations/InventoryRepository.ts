/* ═══════════════════════════════════════════════════════════════
   InventoryRepository — CRUD + movimientos (Multi-Tenant)
   Almacenamiento: Prisma (inventory_items + inventory_movements)
   Fase 10: Migrado de JSON file store a Prisma con tenantId
   ═══════════════════════════════════════════════════════════════ */

import { prisma } from "@/lib/prisma";
import type {
  InventoryItem,
  InventoryMovement,
  InventoryMovementType,
} from "./inventory-types";

// ── Helper: map Prisma InventoryItem → domain InventoryItem ──

function mapItem(row: {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  stock: number;
  minimumStock: number;
  cost: number;
  salePrice: number;
  active: boolean;
}): InventoryItem {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    brand: row.brand,
    category: row.category,
    stock: row.stock,
    minimumStock: row.minimumStock,
    cost: row.cost,
    salePrice: row.salePrice,
    active: row.active,
  };
}

function mapMovement(row: {
  id: string;
  productId: string;
  type: string;
  quantity: number;
  performedBy: string;
  timestamp: Date;
  notes: string | null;
}): InventoryMovement {
  return {
    id: row.id,
    productId: row.productId,
    type: row.type as InventoryMovementType,
    quantity: row.quantity,
    performedBy: row.performedBy,
    timestamp: row.timestamp.toISOString(),
    notes: row.notes ?? undefined,
  };
}

// ── Items ───────────────────────────────────────────────────

export async function getAllItems(tenantId: string): Promise<InventoryItem[]> {
  const rows = await prisma.inventoryItem.findMany({
    where: { tenantId, active: true },
    orderBy: { name: "asc" },
  });
  return rows.map(mapItem);
}

export async function getItemById(
  tenantId: string,
  id: string
): Promise<InventoryItem | undefined> {
  const row = await prisma.inventoryItem.findFirst({
    where: { tenantId, id },
  });
  return row ? mapItem(row) : undefined;
}

export async function getItemBySku(
  tenantId: string,
  sku: string
): Promise<InventoryItem | undefined> {
  const row = await prisma.inventoryItem.findFirst({
    where: { tenantId, sku },
  });
  return row ? mapItem(row) : undefined;
}

export async function createItem(
  tenantId: string,
  data: Omit<InventoryItem, "id">
): Promise<InventoryItem> {
  const row = await prisma.inventoryItem.create({
    data: {
      tenantId,
      sku: data.sku,
      name: data.name,
      brand: data.brand,
      category: data.category,
      stock: data.stock,
      minimumStock: data.minimumStock,
      cost: data.cost,
      salePrice: data.salePrice,
      active: data.active ?? true,
    },
  });
  return mapItem(row);
}

export async function updateItem(
  tenantId: string,
  id: string,
  data: Partial<Omit<InventoryItem, "id">>
): Promise<InventoryItem | undefined> {
  const existing = await prisma.inventoryItem.findFirst({
    where: { tenantId, id },
  });
  if (!existing) return undefined;

  const row = await prisma.inventoryItem.update({
    where: { id },
    data: {
      ...(data.sku !== undefined && { sku: data.sku }),
      ...(data.name !== undefined && { name: data.name }),
      ...(data.brand !== undefined && { brand: data.brand }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.stock !== undefined && { stock: data.stock }),
      ...(data.minimumStock !== undefined && { minimumStock: data.minimumStock }),
      ...(data.cost !== undefined && { cost: data.cost }),
      ...(data.salePrice !== undefined && { salePrice: data.salePrice }),
      ...(data.active !== undefined && { active: data.active }),
    },
  });
  return mapItem(row);
}

export async function deleteItem(
  tenantId: string,
  id: string
): Promise<boolean> {
  const existing = await prisma.inventoryItem.findFirst({
    where: { tenantId, id },
  });
  if (!existing) return false;

  await prisma.inventoryItem.delete({ where: { id } });
  return true;
}

// ── Movements ───────────────────────────────────────────────

export async function getAllMovements(
  tenantId: string
): Promise<InventoryMovement[]> {
  const rows = await prisma.inventoryMovement.findMany({
    where: { tenantId },
    orderBy: { timestamp: "desc" },
  });
  return rows.map(mapMovement);
}

export async function getMovementsByProduct(
  tenantId: string,
  productId: string
): Promise<InventoryMovement[]> {
  const rows = await prisma.inventoryMovement.findMany({
    where: { tenantId, productId },
    orderBy: { timestamp: "desc" },
  });
  return rows.map(mapMovement);
}

export async function registerMovement(
  tenantId: string,
  data: Omit<InventoryMovement, "id">
): Promise<
  { movement: InventoryMovement; updatedStock: number } | { error: string }
> {
  // Validate product exists and belongs to tenant
  const item = await prisma.inventoryItem.findFirst({
    where: { tenantId, id: data.productId },
  });
  if (!item)
    return { error: `Producto ${data.productId} no encontrado` };

  // Calculate stock impact
  let stockDelta = data.quantity;
  const outgoingTypes: InventoryMovementType[] = [
    "sale",
    "stylist_delivery",
    "adjustment",
    "loss",
  ];
  const incomingTypes: InventoryMovementType[] = ["purchase", "return"];

  if (outgoingTypes.includes(data.type) && data.quantity > 0) {
    stockDelta = -data.quantity;
  } else if (incomingTypes.includes(data.type) && data.quantity < 0) {
    stockDelta = -data.quantity;
  } else {
    stockDelta = data.quantity;
  }

  const newStock = item.stock + stockDelta;
  if (newStock < 0) {
    return {
      error: `Stock insuficiente para ${item.name}. Actual: ${item.stock}, requerido: ${Math.abs(stockDelta)}`,
    };
  }

  const [movement] = await prisma.$transaction([
    prisma.inventoryMovement.create({
      data: {
        tenantId,
        productId: data.productId,
        type: data.type,
        quantity: stockDelta,
        performedBy: data.performedBy,
        timestamp: data.timestamp
          ? new Date(data.timestamp)
          : new Date(),
        notes: data.notes,
      },
    }),
    prisma.inventoryItem.update({
      where: { id: data.productId },
      data: { stock: newStock },
    }),
  ]);

  return {
    movement: {
      id: movement.id,
      productId: movement.productId,
      type: movement.type as InventoryMovementType,
      quantity: movement.quantity,
      performedBy: movement.performedBy,
      timestamp: movement.timestamp.toISOString(),
      notes: movement.notes ?? undefined,
    },
    updatedStock: newStock,
  };
}

// ── Movements by type helper ────────────────────────────────

export async function getMovementsByType(
  tenantId: string,
  type: InventoryMovementType
): Promise<InventoryMovement[]> {
  const rows = await prisma.inventoryMovement.findMany({
    where: { tenantId, type },
    orderBy: { timestamp: "desc" },
  });
  return rows.map(mapMovement);
}

// ── Critical products ───────────────────────────────────────

export async function getCriticalProducts(
  tenantId: string
): Promise<InventoryItem[]> {
  const rows = await prisma.inventoryItem.findMany({
    where: {
      tenantId,
      active: true,
    },
  });
  // Filter in-memory: stock <= minimumStock
  return rows.filter((i: { stock: number; minimumStock: number; [key: string]: unknown }) => i.stock <= i.minimumStock).map(mapItem);
}

// ── Stock value ─────────────────────────────────────────────

export async function getTotalStockValue(
  tenantId: string
): Promise<number> {
  const rows = await prisma.inventoryItem.findMany({
    where: { tenantId, active: true },
    select: { stock: true, cost: true },
  });
  return rows.reduce((sum: number, i: { stock: number; cost: number }) => sum + i.stock * i.cost, 0);
}

// ── Total stock count ───────────────────────────────────────

export async function getTotalStock(tenantId: string): Promise<number> {
  const result = await prisma.inventoryItem.aggregate({
    where: { tenantId, active: true },
    _sum: { stock: true },
  });
  return result._sum.stock ?? 0;
}
