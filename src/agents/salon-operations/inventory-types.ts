/* ═══════════════════════════════════════════════════════════════
   inventory-types.ts — Tipos del módulo Inventory V1
   Basado en docs/SALON_OPERATION_REQUIREMENTS.md
   ═══════════════════════════════════════════════════════════════ */

export interface InventoryItem {
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
}

export type InventoryMovementType =
  | "purchase"
  | "sale"
  | "stylist_delivery"
  | "adjustment"
  | "loss"
  | "return";

export interface InventoryMovement {
  id: string;
  productId: string;
  type: InventoryMovementType;
  quantity: number;
  performedBy: string;
  timestamp: string;
  notes?: string;
}

export interface ProductSale {
  id: string;
  productId: string;
  clientId: string;
  stylistId: string;
  salePrice: number;
  commissionPercent: number;
  commissionAmount: number;
  timestamp: string;
}

export type CommissionStatus = "pending" | "paid";

export interface CommissionRecord {
  id: string;
  stylistId: string;
  saleId: string;
  amount: number;
  status: CommissionStatus;
}

/* ═══════════════════════════════════════════════════════════════
   InventoryHealthReport
   ═══════════════════════════════════════════════════════════════ */

export interface InventoryHealthReport {
  generatedAt: string;
  totalProducts: number;
  totalStock: number;
  totalStockValue: number;
  criticalProducts: { sku: string; name: string; stock: number; minimumStock: number }[];
  monthlySales: { totalAmount: number; totalItems: number; count: number };
  pendingCommissions: { totalAmount: number; count: number };
  topSeller: { stylistId: string; totalAmount: number; salesCount: number } | null;
  topProduct: { productId: string; name: string; unitsSold: number; totalAmount: number } | null;
}
