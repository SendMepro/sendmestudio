/* ═══════════════════════════════════════════════════════════════
   Business Center API Route (Multi-Tenant)
   Sirve datos consolidados para el dashboard de Centro de Negocio.
   Si el tenant no tiene datos reales, devuelve estado vacío.
   ═══════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/tenant-helper";
import prisma from "@/lib/prisma";
import { createInventoryHealthReport } from "@/agents/salon-operations/InventoryHealthReport";
import {
  getMonthlySalesTotal,
  getTopSeller,
} from "@/agents/salon-operations/ProductSalesRepository";
import {
  getAllCommissions,
  getPendingCommissionsTotal,
} from "@/agents/salon-operations/CommissionRepository";
import {
  getAllItems,
  getCriticalProducts,
} from "@/agents/salon-operations/InventoryRepository";
import { createSalonOperationsHealthReport } from "@/agents/salon-operations/SalonOperationsInspectorAgent";
import { createBusinessPriorityReport } from "@/agents/BusinessSupervisorAgent";
import { createWhatsAppOperationalReport } from "@/agents/whatsapp/WhatsAppOperationalInspectorAgent";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // ── Resolver tenantId (seguridad multi-tenant) ──
    const { ctx, error } = await requireTenant(request);
    if (error || !ctx) {
      return error ?? NextResponse.json(
        { error: "tenantId es requerido" },
        { status: 401 }
      );
    }
    const { tenantId } = ctx;

    // ── Detectar si hay datos reales ──
    const [realCustomers, realAppointments, realSales, realInventory] = await Promise.all([
      prisma.customer.count({ where: { tenantId } }),
      prisma.appointment.count({ where: { tenantId } }),
      prisma.productSale.count({ where: { tenantId } }),
      prisma.inventoryItem.count({ where: { tenantId } }),
    ]);

    const hasRealData = realCustomers > 0 || realAppointments > 0 || realSales > 0;

    if (!hasRealData) {
      return NextResponse.json({
        tenantId,
        hasRealData: false,
        source: "empty",
        generatedAt: new Date().toISOString(),
        kpis: [],
        opportunities: [],
        executiveSummary: {
          text: "Bienvenido a SendMe Studio. Una vez que tengas clientes, citas y ventas, aquí verás inteligencia de negocio en tiempo real.",
          cta: "Ir a configuración",
          ctaAction: "onboarding",
          source: "system",
          scores: { inventory: 0, sales: 0, commission: 0, global: 0, whatsapp: 0 },
        },
        areaSummaries: [],
        agentScores: {
          operationsScore: 0,
          businessScore: 0,
          whatsappScore: 0,
          whatsappMode: "inactive",
          executiveRecommendations: ["Conecta WhatsApp para empezar a recibir mensajes", "Configura tus servicios y horarios", "Agrega tus primeros productos"],
        },
        insights: {
          topProduct: null,
          criticalCount: 0,
          totalStockValue: 0,
          totalStock: 0,
        },
      });
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // ── Fuentes reales (multi-tenant) ──
    const healthReport = await createInventoryHealthReport(tenantId);
    const thisMonthSales = await getMonthlySalesTotal(tenantId, year, month);

    // Previous month for growth calculation
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevMonthSales = await getMonthlySalesTotal(
      tenantId,
      prevYear,
      prevMonth
    );

    const allCommissions = await getAllCommissions(tenantId);
    const pendingCommissions = await getPendingCommissionsTotal(tenantId);
    const uniqueProfessionals = new Set(
      allCommissions.map((c) => c.stylistId)
    );
    const topSeller = await getTopSeller(tenantId, year, month);

    const allItems = await getAllItems(tenantId);
    const criticalItems = await getCriticalProducts(tenantId);
    const inactiveItems = allItems.filter((i) => !i.active);

    // ── Agentes existentes ──
    const opsHealth = await createSalonOperationsHealthReport(tenantId);
    const businessReport = await createBusinessPriorityReport();
    const whatsappReport = createWhatsAppOperationalReport();

    // ── Cálculos derivados ──
    const salesGrowth =
      prevMonthSales.totalAmount > 0
        ? Math.round(
            ((thisMonthSales.totalAmount - prevMonthSales.totalAmount) /
              prevMonthSales.totalAmount) *
              100
          )
        : 0;

    const ticketPromedio =
      thisMonthSales.count > 0
        ? Math.round(thisMonthSales.totalAmount / thisMonthSales.count)
        : 0;

    const prevTicketPromedio =
      prevMonthSales.count > 0
        ? Math.round(prevMonthSales.totalAmount / prevMonthSales.count)
        : 0;

    const ticketGrowth =
      prevTicketPromedio > 0
        ? Math.round(
            ((ticketPromedio - prevTicketPromedio) / prevTicketPromedio) * 100
          )
        : 0;

    const itemGrowth =
      prevMonthSales.totalItems > 0
        ? Math.round(
            ((thisMonthSales.totalItems - prevMonthSales.totalItems) /
              prevMonthSales.totalItems) *
              100
          )
        : 0;

    return NextResponse.json({
      tenantId,
      hasRealData: true,
      source: "real_data",
      generatedAt: now.toISOString(),

      // ── KPIs (4 principales) ──
      kpis: [
        {
          id: "ventas-mes",
          label: "Ventas del Mes",
          value: thisMonthSales.totalAmount,
          display: `$${thisMonthSales.totalAmount.toLocaleString("es-CL")}`,
          trend: salesGrowth >= 0 ? "up" : "down",
          trendValue: `${salesGrowth >= 0 ? "+" : ""}${salesGrowth}% vs mes ant`,
          meta: 0,
          metaDisplay: "",
          source: "ProductSalesRepository",
          tooltip: "Ventas de productos este mes",
        },
        {
          id: "ticket-promedio",
          label: "Ticket Promedio",
          value: ticketPromedio,
          display: `$${ticketPromedio.toLocaleString("es-CL")}`,
          trend: ticketGrowth >= 0 ? "up" : "down",
          trendValue: `${ticketGrowth >= 0 ? "+" : ""}${ticketGrowth}% vs mes ant`,
          meta: 0,
          metaDisplay: "",
          source: "ProductSalesRepository",
          tooltip: "Valor promedio por venta de producto",
        },
        {
          id: "productos-vendidos",
          label: "Productos Vendidos",
          value: thisMonthSales.totalItems,
          display: `$${thisMonthSales.totalAmount.toLocaleString("es-CL")}`,
          detail: `${thisMonthSales.totalItems} unidades`,
          trend: itemGrowth >= 0 ? "up" : "down",
          trendValue: `${itemGrowth >= 0 ? "+" : ""}${itemGrowth}% vs mes ant`,
          source: "InventoryHealthReport",
          tooltip: "Productos vendidos este mes en valor y unidades",
        },
        {
          id: "comisiones-estimadas",
          label: "Comisiones Est.",
          value: pendingCommissions.totalAmount,
          display: `$${pendingCommissions.totalAmount.toLocaleString("es-CL")}`,
          detail: `${uniqueProfessionals.size} profesionales`,
          trend: pendingCommissions.count > 3 ? "up" : "neutral",
          trendValue: `${pendingCommissions.count} pendientes`,
          source: "CommissionRepository",
          tooltip: "Comisiones pendientes de pago (7% sobre ventas)",
        },
      ],

      // ── Oportunidades IA (4 InsightCards) ──
      opportunities: [
        {
          id: "stock-critico",
          icon: "Package",
          title: "Stock Crítico",
          description: `${criticalItems.length} productos con stock mínimo`,
          impact: 0,
          impactDisplay:
            criticalItems.length > 0
              ? `${criticalItems[0].name} — ${criticalItems[0].stock} unidades`
              : "Sin productos críticos",
          priority: criticalItems.length > 0 ? "alta" : "baja",
          status: criticalItems.length > 0 ? "pendiente" : "resuelto",
          cta: "Crear lista de reposición",
          ctaAction: "restock",
          source: "InventoryHealthReport",
        },
      ],

      // ── Executive Summary IA ──
      executiveSummary: {
        text: `Resumen de operaciones al día. ${thisMonthSales.count > 0 ? `${thisMonthSales.count} ventas de productos este mes por $${thisMonthSales.totalAmount.toLocaleString("es-CL")}.` : "Aún no hay ventas registradas este mes."}`,
        cta: "Ver plan recomendado",
        ctaAction: "exec_plan",
        source: "real_data",
        scores: {
          inventory:
            opsHealth.areas.find((a) => a.area === "inventory")?.score ?? 0,
          sales:
            opsHealth.areas.find((a) => a.area === "product_sales")?.score ?? 0,
          commission:
            opsHealth.areas.find((a) => a.area === "commission")?.score ?? 0,
          global: businessReport.globalHealth.score,
          whatsapp: whatsappReport.score,
        },
      },

      // ── Resumen por Área (5 cards) ──
      areaSummaries: [
        {
          id: "clientes",
          icon: "Users",
          label: "Clientes",
          primary: String(realCustomers),
          primaryLabel: "registrados",
          secondary: "",
          tertiary: "",
          source: "CustomerRepository",
        },
        {
          id: "ventas",
          icon: "BarChart3",
          label: "Ventas",
          primary: `$${thisMonthSales.totalAmount.toLocaleString("es-CL")}`,
          primaryLabel: "este mes",
          secondary: `${thisMonthSales.count} ventas productos`,
          tertiary: `Ticket prom. $${ticketPromedio.toLocaleString("es-CL")}`,
          source: "ProductSalesRepository",
        },
        {
          id: "equipo",
          icon: "Users",
          label: "Equipo",
          primary: `${uniqueProfessionals.size}`,
          primaryLabel: "profesionales",
          secondary: topSeller?.stylistId
            ? `${topSeller.stylistId} — $${topSeller.totalAmount.toLocaleString("es-CL")}`
            : "Sin ventas",
          tertiary: topSeller?.salesCount ? `${topSeller.salesCount} ventas top` : "",
          source: "CommissionRepository + ProductSalesRepository",
        },
        {
          id: "inventario",
          icon: "Package",
          label: "Inventario",
          primary: `${allItems.length}`,
          primaryLabel: "productos",
          secondary: `${criticalItems.length} agotados / mínimos`,
          tertiary: `${inactiveItems.length} inactivos`,
          source: "InventoryHealthReport",
        },
        {
          id: "citas",
          icon: "CalendarCheck",
          label: "Citas",
          primary: `${realAppointments}`,
          primaryLabel: "registradas",
          secondary: "",
          tertiary: "",
          source: "AppointmentRepository",
        },
      ],

      // ── Sidecar: scores de agentes existentes ──
      agentScores: {
        operationsScore: opsHealth.globalScore,
        businessScore: businessReport.globalHealth.score,
        whatsappScore: whatsappReport.score,
        whatsappMode: whatsappReport.operationalMode,
        executiveRecommendations:
          businessReport.executiveRecommendations.slice(0, 3),
      },

      // ── Insight agrupado para contexto ──
      insights: {
        topProduct: healthReport.topProduct
          ? `${healthReport.topProduct.name} (${healthReport.topProduct.unitsSold} unid., $${healthReport.topProduct.totalAmount.toLocaleString("es-CL")})`
          : null,
        criticalCount: criticalItems.length,
        totalStockValue: healthReport.totalStockValue,
        totalStock: healthReport.totalStock,
      },
    });
  } catch (error) {
    console.error("Business Center API error:", error);
    return NextResponse.json(
      {
        error: "No se pudo cargar el Centro de Negocio",
        details:
          error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
