/* ═══════════════════════════════════════════════════════════════
   SalonOperationsDevelopmentAgent — Modelado de operación real del salón
   ═══════════════════════════════════════════════════════════════
   Este agente NO crea UI.
   Este agente NO modifica código de producción.
   Este agente NO toca Meta / WhatsApp real.

   Este agente modela los 5 lifecycles operacionales del salón
   basados en docs/SALON_OPERATION_REQUIREMENTS.md:

   1. Appointment Lifecycle
   2. Attendance Lifecycle
   3. Product Sales Lifecycle
   4. Inventory Lifecycle
   5. Commission Lifecycle

   Uso:
     import { createSalonOperationsDevelopmentReport } from "@/agents/salon-operations/SalonOperationsDevelopmentAgent";
     const report = createSalonOperationsDevelopmentReport();
   ═══════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════
   Tipos: Lifecycles
   ═══════════════════════════════════════════════════════════════ */

export type AppointmentStage =
  | "interesado"
  | "datos_solicitados"
  | "horario_propuesto"
  | "pendiente_confirmacion"
  | "agendado"
  | "recordatorio_enviado"
  | "confirmado"
  | "asistio"
  | "no_asistio";

export type AttendanceStatus =
  | "pendiente"
  | "confirmado"
  | "asistio"
  | "no_asistio"
  | "cancelado";

export type InventoryMovementType =
  | "entrada"
  | "venta_cliente"
  | "entrega_estilista"
  | "ajuste_manual"
  | "devolucion"
  | "merma";

export type PaymentMethod =
  | "efectivo"
  | "credito"
  | "debito"
  | "transferencia"
  | "otro";

export type ProductSaleType = "venta_cliente" | "entrega_estilista";

/* ═══════════════════════════════════════════════════════════════
   Tipos: Modelos de dominio
   ═══════════════════════════════════════════════════════════════ */

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  category: string;
  active: boolean;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  stockMinimo: number;
  precioVentaCliente: number;
  precioInternoEstilista: number;
  costo?: number;
  active: boolean;
}

export interface AppointmentModel {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  service: string;
  professionalId: string;
  professionalName: string;
  date: string;          // YYYY-MM-DD
  time: string;          // HH:mm
  durationMinutes: number;
  stage: AppointmentStage;
  createdVia: "whatsapp_ia" | "whatsapp_manual" | "recepcion" | "cliente_directo";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  appointmentId: string;
  clientId: string;
  status: AttendanceStatus;
  confirmedAt?: string;
  reminderSentAt?: string;
  reminderResponse?: "confirmo" | "rechazo" | "sin_respuesta";
  arrivedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSale {
  id: string;
  type: ProductSaleType;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
  paymentMethod: PaymentMethod;
  professionalId: string;
  professionalName: string;
  clientId?: string;
  clientName?: string;
  commissionRate: number;  // 0.07 for venta_cliente, 0 for entrega_estilista
  commissionAmount: number;
  saleDate: string;
  notes?: string;
  createdAt: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  type: InventoryMovementType;
  quantity: number;        // positivo = entrada, negativo = salida
  unitCost?: number;
  totalCost?: number;
  referenceId?: string;    // appointmentId, saleId, etc.
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface CommissionRecord {
  id: string;
  professionalId: string;
  professionalName: string;
  saleId: string;
  productSaleId?: string;
  productName: string;
  saleTotal: number;
  commissionRate: number;
  commissionAmount: number;
  paid: boolean;
  paidAt?: string;
  period: string;          // "2026-06"
  createdAt: string;
}

/* ═══════════════════════════════════════════════════════════════
   Report types
   ═══════════════════════════════════════════════════════════════ */

export type LifecycleHealth = {
  lifecycle: string;
  status: "modeled" | "partial" | "not_started";
  stages: number;
  implementedStages: number;
  findings: string[];
  recommendedActions: string[];
};

export type SalonOperationsDevelopmentReport = {
  module: "salon-operations-development";
  generatedAt: string;
  summary: string;
  lifecycles: LifecycleHealth[];
  allModelsDefined: boolean;
  recommendedKPIs: { label: string; description: string; formula?: string }[];
  nextActions: string[];
};

/* ═══════════════════════════════════════════════════════════════
   Lifecycle definitions
   ═══════════════════════════════════════════════════════════════ */

const APPOINTMENT_STAGES: AppointmentStage[] = [
  "interesado", "datos_solicitados", "horario_propuesto",
  "pendiente_confirmacion", "agendado", "recordatorio_enviado",
  "confirmado", "asistio", "no_asistio",
];

const ATTENDANCE_STATUSES: AttendanceStatus[] = [
  "pendiente", "confirmado", "asistio", "no_asistio", "cancelado",
];

const INVENTORY_MOVEMENT_TYPES: InventoryMovementType[] = [
  "entrada", "venta_cliente", "entrega_estilista",
  "ajuste_manual", "devolucion", "merma",
];

const PAYMENT_METHODS: PaymentMethod[] = [
  "efectivo", "credito", "debito", "transferencia", "otro",
];

/* ═══════════════════════════════════════════════════════════════
   Factory
   ═══════════════════════════════════════════════════════════════ */

export function createSalonOperationsDevelopmentReport(): SalonOperationsDevelopmentReport {
  const now = new Date().toISOString();

  // —— Lifecycle: Appointment ——
  const appointmentLifecycle: LifecycleHealth = {
    lifecycle: "Appointment",
    status: "modeled",
    stages: APPOINTMENT_STAGES.length,
    implementedStages: 0, // No runtime implementation yet — only model
    findings: [
      "Modelo completo con 9 estados: desde interesado hasta no_asistio",
      "Cubre todo el flujo real documentado: captación WhatsApp → agendamiento → recordatorio → asistencia",
      "Requiere integración con WhatsApp para etapa de captación (interesado, datos_solicitados, horario_propuesto)",
      "Requiere conexión con agenda (AgendaPro o nativa) para etapa de agendado",
      "Recordatorio 1h antes requiere módulo de recordatorios + WhatsApp send",
      "Confirmación de asistencia requiere webhook de respuesta WhatsApp",
    ],
    recommendedActions: [
      "Crear tabla appointments en BD o store JSON con AppointmentModel",
      "Implementar flujo de recepcionista IA que avance por los 9 estados",
      "Conectar con WhatsApp para etapa de captación (ya existe booking concierge parcial)",
      "Implementar recordatorio automático 1h antes con mensaje template",
    ],
  };

  // —— Lifecycle: Attendance ——
  const attendanceLifecycle: LifecycleHealth = {
    lifecycle: "Attendance",
    status: "modeled",
    stages: ATTENDANCE_STATUSES.length,
    implementedStages: 0,
    findings: [
      "Modelo completo con 5 estados de AttendanceRecord",
      "Estados visuales documentados: confirmado(🟡), asistio(🟣), no_asistio(🟠), pendiente(⚪)",
      "Requiere entrada manual o automática desde recordatorio + respuesta WhatsApp",
      "No hay UI de seguimiento de asistencia actualmente",
    ],
    recommendedActions: [
      "Crear tabla attendance_records en BD o store JSON",
      "Implementar actualización automática de estado desde recordatorio",
      "Agregar dashboard de asistencia con % cumplimiento por cliente",
    ],
  };

  // —— Lifecycle: Product Sales ——
  const productSalesLifecycle: LifecycleHealth = {
    lifecycle: "ProductSales",
    status: "modeled",
    stages: 2, // venta_cliente, entrega_estilista
    implementedStages: 0,
    findings: [
      "Modelo distingue venta a cliente (con comisión 7%) vs entrega a estilista (sin comisión)",
      "Requiere módulo de inventario como prerrequisito (descuento automático de stock)",
      "La diferenciación es crítica: un solo flujo de UI pero con reglas de negocio distintas",
      "No existe registro de venta de productos en producción actual",
    ],
    recommendedActions: [
      "Crear módulo Inventory primero (MOD-001 del roadmap)",
      "Luego implementar ProductSales con los campos del modelo ProductSale",
      "Validar que venta_cliente descuenta stock + calcula comisión 7%",
      "Validar que entrega_estilista descuenta stock sin comisión",
    ],
  };

  // —— Lifecycle: Inventory ——
  const inventoryLifecycle: LifecycleHealth = {
    lifecycle: "Inventory",
    status: "modeled",
    stages: INVENTORY_MOVEMENT_TYPES.length,
    implementedStages: 0,
    findings: [
      "Modelo completo con 6 tipos de movimiento de inventario",
      "Cubre entrada, venta a cliente, entrega a estilista, ajuste manual, devolución y merma",
      "Requiere modelo Product con SKU, precios duales (cliente/estilista), stock mínimo",
      "Sin inventario no se puede implementar venta de productos ni comisiones",
      "Es la base de toda la operación comercial del salón",
    ],
    recommendedActions: [
      "Crear módulo Inventory como prioridad #1 del roadmap de operaciones",
      "Implementar CRUD de productos con todos los campos del modelo Product",
      "Implementar registro de movimientos con todos los 6 tipos",
      "Agregar alerta de stock bajo (stock ≤ stockMinimo)",
      "Agregar historial de movimientos por producto",
    ],
  };

  // —— Lifecycle: Commission ——
  const commissionLifecycle: LifecycleHealth = {
    lifecycle: "Commission",
    status: "modeled",
    stages: 3, // generated, paid, reported
    implementedStages: 0,
    findings: [
      "Modelo CommissionRecord captura comisión por venta de producto (7%)",
      "Comisión solo aplica a venta_cliente, NO a entrega_estilista",
      "Requiere módulo ProductSales para generar comisiones automáticamente",
      "No hay tracking de comisiones en producción actual",
      "El cálculo automático de 7% debe ser transparente — el profesional debe ver su comisión acumulada",
    ],
    recommendedActions: [
      "Implementar cálculo automático de comisión 7% al crear ProductSale (type=venta_cliente)",
      "Crear reporte de comisiones por profesional y por período",
      "Agregar dashboard de comisiones para profesionales y administración",
      "Considerar pagos de comisiones: marcar como paid cuando se liquida",
    ],
  };

  const allLifecycles = [
    appointmentLifecycle,
    attendanceLifecycle,
    productSalesLifecycle,
    inventoryLifecycle,
    commissionLifecycle,
  ];

  const allModeled = allLifecycles.every((l) => l.status === "modeled");
  const totalStages = allLifecycles.reduce((s, l) => s + l.stages, 0);

  const summary =
    `Operaciones del Salón: ${allLifecycles.length} lifecycles modelados. ` +
    `${totalStages} etapas definidas en total. ` +
    `Todos los modelos de dominio están definidos (AppointmentModel, AttendanceRecord, ` +
    `ProductSale, InventoryMovement, CommissionRecord). ` +
    `Próximo paso: implementar Inventory como base, luego ProductSales + Commission.`;

  const recommendedKPIs = [
    { label: "Tasa de confirmación", description: "% de clientes que confirman asistencia vs recordatorios enviados" },
    { label: "Tasa de inasistencia", description: "% de citas con no_asistio vs total agendado" },
    { label: "Ventas de productos del mes", description: "Total en productos vendidos a clientes ($)" },
    { label: "Comisiones generadas", description: "Suma de comisiones 7% del período, por profesional" },
    { label: "Stock bajo", description: "Productos con stock ≤ stock mínimo" },
    { label: "Valor del inventario", description: "Costo total del inventario actual", formula: "SUM(stock * costo)" },
    { label: "Ticket promedio", description: "Monto promedio por servicio" },
    { label: "Servicios más vendidos", description: "Top servicios por frecuencia" },
    { label: "Productos más vendidos", description: "Top productos por unidades vendidas" },
    { label: "Consumo por profesional", description: "Insumos entregados a cada estilista ($)" },
  ];

  const nextActions = [
    "Fase 1: Implementar Inventory (CRUD + movimientos + alertas)",
    "Fase 2: Implementar ProductSales con comisión 7% automática",
    "Fase 3: Implementar StylistSupplies (entrega a estilista, sin comisión)",
    "Fase 4: Implementar AppointmentReminder + AttendanceTracking",
    "Fase 5: Implementar PaymentRegister + MonthlyFinanceSummary",
    "Fase 6: Implementar ReceptionistAI (asistente IA de captación)",
  ];

  return {
    module: "salon-operations-development",
    generatedAt: now,
    summary,
    lifecycles: allLifecycles,
    allModelsDefined: allModeled,
    recommendedKPIs,
    nextActions,
  };
}
