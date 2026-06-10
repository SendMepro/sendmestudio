/* ═══════════════════════════════════════════════════════════════
   InventoryHealthReport — Reporte de salud del módulo Inventory V1
   Fase 10: tenantId requerido para multi-tenant
   ═══════════════════════════════════════════════════════════════ */

import type { InventoryHealthReport } from "./inventory-types";
import {
  getAllItems,
  getCriticalProducts,
  getTotalStockValue,
  getTotalStock,
} from "./InventoryRepository";
import {
  getMonthlySalesTotal,
  getTopSeller,
  getTopProduct,
} from "./ProductSalesRepository";
import { getPendingCommissionsTotal } from "./CommissionRepository";

export async function createInventoryHealthReport(
  tenantId: string
): Promise<InventoryHealthReport> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [allItems, monthlySales, pendingCommissions, topSeller, topProductRaw] =
    await Promise.all([
      getAllItems(tenantId),
      getMonthlySalesTotal(tenantId, year, month),
      getPendingCommissionsTotal(tenantId),
      getTopSeller(tenantId, year, month),
      getTopProduct(tenantId, year, month),
    ]);

  const criticalItems = allItems.filter((i) => i.stock <= i.minimumStock);

  // Resolve top product name
  let topProduct = null;
  if (topProductRaw) {
    const item = allItems.find((i) => i.id === topProductRaw.productId);
    topProduct = {
      ...topProductRaw,
      name: item?.name || topProductRaw.name,
    };
  }

  return {
    generatedAt: now.toISOString(),
    totalProducts: allItems.length,
    totalStock: await getTotalStock(tenantId),
    totalStockValue: await getTotalStockValue(tenantId),
    criticalProducts: criticalItems.map((i) => ({
      sku: i.sku,
      name: i.name,
      stock: i.stock,
      minimumStock: i.minimumStock,
    })),
    monthlySales,
    pendingCommissions,
    topSeller: topSeller
      ? {
          stylistId: topSeller.stylistId,
          totalAmount: topSeller.totalAmount,
          salesCount: topSeller.salesCount,
        }
      : null,
    topProduct,
  };
}
