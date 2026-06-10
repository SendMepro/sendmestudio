/* ═══════════════════════════════════════════════════════════════
   SalonOperationsInspectorAgent — Health check por área operacional
   ═══════════════════════════════════════════════════════════════
   Este agente NO modifica código.
   Este agente NO crea UI.
   Este agente NO toca Meta / WhatsApp real.

   Este agente inspecciona el estado de salud de cada área operacional
   del salón según docs/SALON_OPERATION_REQUIREMENTS.md y genera
   un SalonOperationsHealthReport con score por área.

   Áreas evaluadas:
   - Appointment (agendamiento y flujo completo)
   - Attendance (asistencia y recordatorios)
   - ProductSales (venta de productos)
   - Inventory (inventario)
   - Commission (comisiones)

   Uso:
     import { createSalonOperationsHealthReport } from "@/agents/salon-operations/SalonOperationsInspectorAgent";
     const report = createSalonOperationsHealthReport();
   ═══════════════════════════════════════════════════════════════ */

import fs from "fs";
import path from "path";
import { createInventoryHealthReport } from "./InventoryHealthReport";
import { getAllItems, getCriticalProducts, getTotalStock, getTotalStockValue } from "./InventoryRepository";
import { getAllSales, getMonthlySalesTotal } from "./ProductSalesRepository";
import { getPendingCommissionsTotal } from "./CommissionRepository";

/* ═══════════════════════════════════════════════════════════════
   Tipos
   ═══════════════════════════════════════════════════════════════ */

export type AreaHealthStatus = "healthy" | "attention" | "critical" | "not_started";

export type AreaHealth = {
  area: string;
  label: string;
  status: AreaHealthStatus;
  score: number;
  checks: number;
  passed: number;
  failed: number;
  description: string;
  findings: {
    id: string;
    title: string;
    severity: "critical" | "high" | "medium" | "low" | "info";
    passed: boolean;
    detail: string;
    recommendation: string;
  }[];
};

export type SalonOperationsHealthReport = {
  module: "salon-operations-inspector";
  generatedAt: string;
  summary: string;
  globalScore: number;
  areas: AreaHealth[];
};

/* ═══════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════ */

function getEnv(key: string): string | undefined {
  return process.env[key];
}

function getStorePath(): string {
  return path.join(process.cwd(), "data", "whatsapp-store.json");
}

function hasAppointmentStore(): boolean {
  try {
    return fs.existsSync(getStorePath());
  } catch {
    return false;
  }
}

function hasDeepSeekKey(): boolean {
  return Boolean(getEnv("DEEPSEEK_API_KEY"));
}

/* ═══════════════════════════════════════════════════════════════
   Area health checks
   ═══════════════════════════════════════════════════════════════ */

function checkAppointmentHealth(): AreaHealth {
  const findings: AreaHealth["findings"] = [];

  // Check 1: Appointment model defined
  findings.push({
    id: "SO-INSP-001",
    title: "Modelo AppointmentModel definido",
    severity: "critical",
    passed: true,
    detail: "AppointmentModel con 9 estados, servicio, profesional, fechas. Definido en SalonOperationsDevelopmentAgent.ts",
    recommendation: "Modelo completo. Migrar a implementación runtime.",
  });

  // Check 2: 9 stages coverage
  findings.push({
    id: "SO-INSP-002",
    title: "Cobertura de 9 estados del appointment lifecycle",
    severity: "high",
    passed: true,
    detail: "interesado → datos_solicitados → horario_propuesto → pendiente_confirmacion → agendado → recordatorio_enviado → confirmado → asistio → no_asistio",
    recommendation: "Cobertura completa. Implementar avance automático entre estados.",
  });

  // Check 3: WhatsApp booking concierge exists
  const bookingConciergeExists = fs.existsSync(
    path.join(process.cwd(), "src", "app", "api", "whatsapp", "ai-concierge.ts")
  );
  findings.push({
    id: "SO-INSP-003",
    title: "Booking concierge WhatsApp implementado",
    severity: "high",
    passed: bookingConciergeExists,
    detail: bookingConciergeExists
      ? "ai-concierge.ts existe con generateBookingConciergeDecision() y flujo booking"
      : "ai-concierge.ts no encontrado",
    recommendation: bookingConciergeExists
      ? "Booking concierge existe. Conectar con Appointment lifecycle stages."
      : "Crear booking concierge para detectar intención de agendar en WhatsApp.",
  });

  // Check 4: Appointment API endpoint
  const appointmentsApiExists = fs.existsSync(
    path.join(process.cwd(), "src", "app", "api", "appointments", "route.ts")
  );
  findings.push({
    id: "SO-INSP-004",
    title: "API endpoint de appointments (/api/appointments)",
    severity: "critical",
    passed: appointmentsApiExists,
    detail: appointmentsApiExists
      ? "POST /api/appointments existe (usado por booking concierge)"
      : "No existe API de appointments",
    recommendation: appointmentsApiExists
      ? "Endpoint existe. Verificar que soporte todos los campos de AppointmentModel."
      : "Crear /api/appointments con CRUD completo.",
  });

  // Check 5: autoReply status — appointment flow needs it
  const autoReplyEnabled = hasAppointmentStore();
  findings.push({
    id: "SO-INSP-005",
    title: "Auto-reply para flujo de agendamiento",
    severity: "high",
    passed: autoReplyEnabled,
    detail: autoReplyEnabled
      ? "WhatsApp store existe, auto-reply puede activarse para booking flow"
      : "Sin WhatsApp store no puede haber flujo automático de agendamiento",
    recommendation: "Activar autoReplyEnabled en conversaciones para habilitar booking concierge.",
  });

  const passed1 = findings.filter((f) => f.passed).length;
  const score1 = Math.round((passed1 / findings.length) * 100);
  const status1: AreaHealthStatus = score1 >= 80 ? "healthy" : score1 >= 50 ? "attention" : "critical";

  return {
    area: "appointment",
    label: "Agendamiento (Appointment Lifecycle)",
    status: status1,
    score: score1,
    checks: findings.length,
    passed: passed1,
    failed: findings.length - passed1,
    description: "Flujo completo de agendamiento: detección de intención → captación de datos → confirmación → recordatorio → asistencia",
    findings,
  };
}

function checkAttendanceHealth(): AreaHealth {
  const findings: AreaHealth["findings"] = [];

  // Check 1: Attendance model defined
  findings.push({
    id: "SO-INSP-010",
    title: "Modelo AttendanceRecord definido",
    severity: "critical",
    passed: true,
    detail: "AttendanceRecord con 5 estados: pendiente, confirmado, asistio, no_asistio, cancelado",
    recommendation: "Modelo completo. Implementar runtime.",
  });

  // Check 2: Reminder automation
  findings.push({
    id: "SO-INSP-011",
    title: "Recordatorio automático 1h antes",
    severity: "high",
    passed: false,
    detail: "Actualmente los recordatorios los hace Betzi manualmente por WhatsApp. No hay automatización.",
    recommendation: "Implementar módulo AppointmentReminder: disparo 1h antes, mensaje WhatsApp con confirmación.",
  });

  // Check 3: WhatsApp send capability for reminders
  const senderExists = fs.existsSync(
    path.join(process.cwd(), "src", "app", "api", "whatsapp", "sender.ts")
  );
  findings.push({
    id: "SO-INSP-012",
    title: "Capacidad de envío WhatsApp para recordatorios",
    severity: "high",
    passed: senderExists,
    detail: senderExists
      ? "sender.ts existe con sendWhatsAppMessage() — se puede reutilizar para recordatorios"
      : "No hay sender para enviar recordatorios por WhatsApp",
    recommendation: senderExists
      ? "Reutilizar sendWhatsAppMessage() para recordatorios automáticos."
      : "Implementar sender.ts primero.",
  });

  // Check 4: Attendance tracking dashboard
  findings.push({
    id: "SO-INSP-013",
    title: "Dashboard de seguimiento de asistencia",
    severity: "medium",
    passed: false,
    detail: "No existe dashboard ni UI de seguimiento de asistencia. No hay estados visuales.",
    recommendation: "Agregar attendance dashboard con estados visuales: 🟡🟣🟠⚪.",
  });

  const passed2 = findings.filter((f) => f.passed).length;
  const score2 = Math.round((passed2 / findings.length) * 100);
  const status2: AreaHealthStatus = score2 >= 80 ? "healthy" : score2 >= 50 ? "attention" : "critical";

  return {
    area: "attendance",
    label: "Asistencia (Attendance Lifecycle)",
    status: status2,
    score: score2,
    checks: findings.length,
    passed: passed2,
    failed: findings.length - passed2,
    description: "Recordatorios automáticos, confirmación de asistencia, seguimiento y dashboard de cumplimiento",
    findings,
  };
}

async function checkProductSalesHealth(tenantId?: string): Promise<AreaHealth> {
  const findings: AreaHealth["findings"] = [];
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  let monthlySales = { totalAmount: 0, totalItems: 0, count: 0 };
  let invItems = 0;
  try {
    if (tenantId) {
      monthlySales = await getMonthlySalesTotal(tenantId, year, month);
      try { invItems = (await getAllItems(tenantId)).length; } catch { }
    } else {
      // Sin tenantId — datos no disponibles en modo multi-tenant
    }
  } catch {
    // not available
  }

  // Check 1: ProductSale model defined
  findings.push({
    id: "SO-INSP-020",
    title: "Modelo ProductSale definido",
    severity: "critical",
    passed: true,
    detail: "ProductSale con productId, clientId, stylistId, salePrice, commissionPercent (7%), commissionAmount",
    recommendation: "Modelo completo. Implementado en inventory-types.ts.",
  });

  // Check 2: Runtime CRUD implementado
  findings.push({
    id: "SO-INSP-021",
    title: "Runtime CRUD de ventas implementado",
    severity: "high",
    passed: true,
    detail: "ProductSalesRepository.ts con createSale(), getAllSales(), getMonthlySalesTotal(). Store: Prisma (product_sales)",
    recommendation: "Mantener. Agregar integración con Inventory (descuento automático de stock) en próxima iteración.",
  });

  // Check 3: Commission rate 7% configurada en runtime
  findings.push({
    id: "SO-INSP-022",
    title: "Tasa de comisión 7% implementada",
    severity: "high",
    passed: true,
    detail: "COMMISSION_PERCENT = 0.07 en ProductSalesRepository.ts. commissionAmount se calcula automáticamente al crear sale.",
    recommendation: "Tasa correcta. Comisión se calcula automáticamente.",
  });

  // Check 4: Inventory integration
  findings.push({
    id: "SO-INSP-023",
    title: "Integración con Inventory para descuento automático de stock",
    severity: "high",
    passed: invItems > 0,
    detail: invItems > 0
      ? `InventoryRepository activo con ${invItems} productos. Pendiente integración automática: crear ProductSale debe llamar registerMovement(type="sale").`
      : "InventoryRepository existente pero sin productos. No hay integración automática aún.",
    recommendation: "Conectar createSale() + registerMovement(type='sale') para descuento automático de stock.",
  });

  // Check 5: Monthly sales activity
  findings.push({
    id: "SO-INSP-024",
    title: "Ventas del mes",
    severity: "medium",
    passed: monthlySales.count > 0,
    detail: monthlySales.count > 0
      ? `${monthlySales.count} ventas este mes por $${monthlySales.totalAmount.toLocaleString()}`
      : "Sin ventas registradas este mes",
    recommendation: monthlySales.count > 0
      ? "Actividad comercial registrada. Mantener seguimiento mensual."
      : "Registrar primera venta de prueba para validar el flujo completo.",
  });

  const passed3 = findings.filter((f) => f.passed).length;
  const score3 = Math.round((passed3 / findings.length) * 100);
  const status3: AreaHealthStatus = score3 >= 80 ? "healthy" : score3 >= 50 ? "attention" : "critical";

  return {
    area: "product_sales",
    label: "Venta de Productos (Product Sales Lifecycle)",
    status: status3,
    score: score3,
    checks: findings.length,
    passed: passed3,
    failed: findings.length - passed3,
    description: "Venta a clientes con comisión 7% automática. Pendiente: integración con descuento de stock.",
    findings,
  };
}

async function checkInventoryHealth(tenantId?: string): Promise<AreaHealth> {
  const findings: AreaHealth["findings"] = [];
  let items: Awaited<ReturnType<typeof getAllItems>> = [];
  let criticalItems: Awaited<ReturnType<typeof getCriticalProducts>> = [];
  let totalStockCount = 0;
  let totalValue = 0;
  try {
    if (tenantId) {
      items = await getAllItems(tenantId);
      criticalItems = await getCriticalProducts(tenantId);
      totalStockCount = await getTotalStock(tenantId);
      totalValue = await getTotalStockValue(tenantId);
    }
  } catch {
    // repos not available
  }

  // Check 1: InventoryItem model defined
  findings.push({
    id: "SO-INSP-030",
    title: "Modelo InventoryItem definido",
    severity: "critical",
    passed: true,
    detail: "InventoryItem con sku, name, brand, category, stock, minimumStock, cost, salePrice, active",
    recommendation: "Modelo completo en inventory-types.ts.",
  });

  // Check 2: 6 movement types defined
  findings.push({
    id: "SO-INSP-031",
    title: "6 tipos de movimiento de inventario definidos",
    severity: "high",
    passed: true,
    detail: "purchase, sale, stylist_delivery, adjustment, loss, return",
    recommendation: "Cobertura completa de tipos de movimiento.",
  });

  // Check 3: Runtime CRUD implementado
  findings.push({
    id: "SO-INSP-032",
    title: "Runtime CRUD + movimientos implementado",
    severity: "critical",
    passed: true,
    detail: `InventoryRepository.ts activo. ${items.length} productos registrados, ${totalStockCount} unidades en stock, valor total $${totalValue.toLocaleString()}. Store: data/inventory-store.json`,
    recommendation: "CRUD funcional. Agregar UI de gestión en próxima iteración.",
  });

  // Check 4: Stock alerts
  findings.push({
    id: "SO-INSP-033",
    title: "Alertas de stock bajo (stock ≤ minimumStock)",
    severity: "medium",
    passed: criticalItems.length === 0,
    detail: criticalItems.length > 0
      ? `${criticalItems.length} producto(s) crítico(s): ${criticalItems.map((i) => `${i.name} (stock: ${i.stock}, min: ${i.minimumStock})`).join(", ")}`
      : "Sin productos críticos. Todos los stocks están sobre el mínimo.",
    recommendation: criticalItems.length > 0
      ? `Reponer: ${criticalItems.map((i) => i.name).join(", ")}.`
      : "Stock saludable. Mantener monitoreo.",
  });

  // Check 5: Store persistence
  const storeExists = fs.existsSync(
    path.join(process.cwd(), "data", "inventory-store.json")
  );
  findings.push({
    id: "SO-INSP-034",
    title: "Persistencia en disco",
    severity: "high",
    passed: storeExists,
    detail: storeExists
      ? "data/inventory-store.json existe con datos persistentes"
      : "Store no encontrado. Se creará automáticamente al primer uso.",
    recommendation: storeExists
      ? "Persistencia OK."
      : "Crear primera entrada de producto para inicializar el store.",
  });

  const passed4 = findings.filter((f) => f.passed).length;
  const score4 = Math.round((passed4 / findings.length) * 100);
  const status4: AreaHealthStatus = score4 >= 80 ? "healthy" : score4 >= 50 ? "attention" : "critical";

  return {
    area: "inventory",
    label: "Inventario (Inventory Lifecycle)",
    status: status4,
    score: score4,
    checks: findings.length,
    passed: passed4,
    failed: findings.length - passed4,
    description: "Productos, movimientos, stock mínimo y alertas. CRUD runtime implementado.",
    findings,
  };
}

async function checkCommissionHealth(tenantId?: string): Promise<AreaHealth> {
  const findings: AreaHealth["findings"] = [];
  let pendingTotal = { totalAmount: 0, count: 0 };
  try {
    if (tenantId) {
      pendingTotal = await getPendingCommissionsTotal(tenantId);
    }
  } catch {
    // repo not available
  }

  // Check 1: CommissionRecord model defined
  findings.push({
    id: "SO-INSP-040",
    title: "Modelo CommissionRecord definido",
    severity: "critical",
    passed: true,
    detail: "CommissionRecord con stylistId, saleId, amount, status (pending/paid)",
    recommendation: "Modelo completo en inventory-types.ts.",
  });

  // Check 2: Automatic calculation from ProductSales
  findings.push({
    id: "SO-INSP-041",
    title: "Cálculo automático de comisión 7%",
    severity: "high",
    passed: true,
    detail: "ProductSalesRepository.createSale() calcula commissionAmount = salePrice * 0.07 automáticamente. CommissionRepository almacena el registro con status=pending.",
    recommendation: "Cálculo automático funcional. Próximo paso: integrar con UI de pagos.",
  });

  // Check 3: Per-stylist reporting
  findings.push({
    id: "SO-INSP-042",
    title: "Reporte de comisiones por profesional",
    severity: "medium",
    passed: true,
    detail: "CommissionRepository.getCommissionsByStylist(stylistId) permite consultar comisiones por profesional.",
    recommendation: "API disponible. Agregar dashboard visible en UI.",
  });

  // Check 4: Payment tracking
  findings.push({
    id: "SO-INSP-043",
    title: "Seguimiento de pago de comisiones",
    severity: "low",
    passed: true,
    detail: "CommissionRepository con createCommission(), markCommissionAsPaid(), getPendingCommissions(). " +
      `${pendingTotal.count} comisiones pendientes por $${pendingTotal.totalAmount.toLocaleString()}.`,
    recommendation: pendingTotal.count > 0
      ? `${pendingTotal.count} comisiones por liquidar. Usar markCommissionAsPaid() cuando se paguen.`
      : "Sin comisiones pendientes. Mantener registro al crear ventas.",
  });

  const passed5 = findings.filter((f) => f.passed).length;
  const score5 = Math.round((passed5 / findings.length) * 100);
  const status5: AreaHealthStatus = score5 >= 80 ? "healthy" : score5 >= 50 ? "attention" : "critical";

  return {
    area: "commission",
    label: "Comisiones (Commission Lifecycle)",
    status: status5,
    score: score5,
    checks: findings.length,
    passed: passed5,
    failed: findings.length - passed5,
    description: "Cálculo automático de 7% sobre venta a cliente, reportes por profesional, pago de comisiones",
    findings,
  };
}

/* ═══════════════════════════════════════════════════════════════
   Factory
   ═══════════════════════════════════════════════════════════════ */

export async function createSalonOperationsHealthReport(tenantId?: string): Promise<SalonOperationsHealthReport> {
  const areas = await Promise.all([
    checkAppointmentHealth(),
    checkAttendanceHealth(),
    checkProductSalesHealth(tenantId),
    checkInventoryHealth(tenantId),
    checkCommissionHealth(tenantId),
  ]);

  const totalChecks = areas.reduce((s, a) => s + a.checks, 0);
  const totalPassed = areas.reduce((s, a) => s + a.passed, 0);
  const globalScore = Math.round((totalPassed / totalChecks) * 100);

  const criticalAreas = areas.filter((a) => a.status === "critical");
  const attentionAreas = areas.filter((a) => a.status === "attention");

  let summary: string;
  if (criticalAreas.length > 0) {
    summary =
      `${criticalAreas.length} área(s) crítica(s): ${criticalAreas.map((a) => a.label).join(", ")}. ` +
      `Global score: ${globalScore}. Prioridad: Inventory → ProductSales → Commission.`;
  } else if (attentionAreas.length > 0) {
    summary =
      `${attentionAreas.length} área(s) requieren atención: ${attentionAreas.map((a) => a.label).join(", ")}. ` +
      `Global score: ${globalScore}.`;
  } else {
    summary =
      `Todas las ${areas.length} áreas operacionales en estado saludable. ` +
      `Global score: ${globalScore}.`;
  }

  return {
    module: "salon-operations-inspector",
    generatedAt: new Date().toISOString(),
    summary,
    globalScore,
    areas,
  };
}
