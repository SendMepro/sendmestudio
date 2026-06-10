/* ═══════════════════════════════════════════════════════════════
   SalonOperationsAgent — Análisis de operación real del salón
   ═══════════════════════════════════════════════════════════════
   Analiza los flujos operativos reales documentados en
   docs/SALON_OPERATION_REQUIREMENTS.md y sugiere mejoras
   para agenda, WhatsApp, recordatorios, pagos, asistencia,
   venta de productos, comisiones, inventario e insumos.

   Este agente NO ejecuta acciones.
   Este agente analiza, diagnostica y recomienda.

   Uso:
     import { createSalonOperationsReport } from "@/agents/salon-operations/SalonOperationsAgent";
     const report = createSalonOperationsReport();
   ═══════════════════════════════════════════════════════════════ */

export type OperationArea =
  | "agenda"
  | "whatsapp"
  | "recordatorios"
  | "pagos"
  | "asistencia"
  | "venta_productos"
  | "comisiones"
  | "inventario"
  | "insumos_estilistas";

export type PainPoint = {
  id: string;
  area: OperationArea;
  title: string;
  description: string;
  currentBehavior: string;
  impact: "high" | "medium" | "low";
  suggestedSolution: string;
};

export type Opportunity = {
  id: string;
  area: OperationArea;
  title: string;
  description: string;
  estimatedValue: "high" | "medium" | "low";
  effort: "high" | "medium" | "low";
  dependencies: string[];
};

export type RecommendedModule = {
  id: string;
  name: string;
  description: string;
  primaryArea: OperationArea;
  secondaryAreas: OperationArea[];
  keyFeatures: string[];
  dependsOn: string[];
};

export type RecommendedKPI = {
  id: string;
  label: string;
  description: string;
  area: OperationArea;
  formula?: string;
};

export type ImplementationPriority = {
  phase: number;
  label: string;
  modules: string[];
  estimatedEffort: string;
  rationale: string;
};

export type SalonOperationsReport = {
  module: "salon-operations";
  source: string;
  generatedAt: string;
  summary: string;
  operationalSummary: {
    area: OperationArea;
    status: "manual_only" | "partial" | "not_implemented";
    currentTool: string;
    description: string;
  }[];
  painPoints: PainPoint[];
  opportunities: Opportunity[];
  recommendedModules: RecommendedModule[];
  recommendedKPIs: RecommendedKPI[];
  priorities: ImplementationPriority[];
};

/* ═══════════════════════════════════════════════════════════════
   Factory
   ═══════════════════════════════════════════════════════════════ */

export function createSalonOperationsReport(): SalonOperationsReport {
  const now = new Date().toISOString();

  const operationalSummary: SalonOperationsReport["operationalSummary"] = [
    {
      area: "agenda",
      status: "manual_only",
      currentTool: "AgendaPro",
      description:
        "La agenda se gestiona completamente en AgendaPro. La recepcionista abre AgendaPro en el computador para validar disponibilidad, crear citas y notificar al estilista. SendMe Studio no tiene integración directa con la agenda operativa.",
    },
    {
      area: "whatsapp",
      status: "partial",
      currentTool: "WhatsApp manual + AgendaPro automático",
      description:
        "El WhatsApp se usa manualmente para captar clientes (la recepcionista conversa y pide datos). AgendaPro envía confirmaciones automáticas al cliente. SendMe Studio tiene módulo de inbox funcional pero no está conectado al flujo de agendamiento.",
    },
    {
      area: "recordatorios",
      status: "manual_only",
      currentTool: "Betzi (persona)",
      description:
        "Una persona (Betzi) escribe manualmente por WhatsApp una hora antes de cada cita para recordar al cliente. No hay automatización.",
    },
    {
      area: "pagos",
      status: "manual_only",
      currentTool: "AgendaPro",
      description:
        "Los pagos se registran en AgendaPro: se selecciona la cita, se ingresa método de pago (efectivo/crédito/débito/transferencia). No hay reportes financieros integrados con SendMe Studio.",
    },
    {
      area: "asistencia",
      status: "manual_only",
      currentTool: "AgendaPro (implícito)",
      description:
        "No hay un sistema formal de tracking de asistencia. El salón sabe quién asistió o no por observación directa. No hay estados de asistencia registrados sistemáticamente.",
    },
    {
      area: "venta_productos",
      status: "not_implemented",
      currentTool: "Ninguno",
      description:
        "No existe registro de venta de productos. El salón no sabe qué productos se vendieron, quién los vendió, ni a qué cliente. No hay control de comisiones por producto.",
    },
    {
      area: "comisiones",
      status: "not_implemented",
      currentTool: "Ninguno",
      description:
        "La regla de negocio (7% del valor del producto para el profesional que vende) no está implementada en ningún sistema. Se pierde trazabilidad de comisiones.",
    },
    {
      area: "inventario",
      status: "not_implemented",
      currentTool: "Ninguno",
      description:
        "No existe control de inventario. No se sabe stock actual, stock mínimo, ni movimientos de entrada/salida de productos.",
    },
    {
      area: "insumos_estilistas",
      status: "not_implemented",
      currentTool: "Ninguno",
      description:
        "No hay registro de entrega de insumos a estilistas. Se desconoce cuánto producto se le ha entregado a cada profesional.",
    },
  ];

  const painPoints: PainPoint[] = [
    {
      id: "PP-001",
      area: "whatsapp",
      title: "Captación manual sin seguimiento de estados",
      description:
        "La recepcionista conversa por WhatsApp sin ayuda del sistema. No hay detección automática de intención de agendar, ni seguimiento de en qué etapa está cada cliente (interesado, datos solicitados, pendiente de confirmación, etc.).",
      currentBehavior:
        "La recepcionista pregunta horario, pide datos, abre AgendaPro, crea la cita — todo manual. Si el cliente no confirma, se pierde.",
      impact: "high",
      suggestedSolution:
        "Implementar flujo de recepcionista IA que detecte intención de agendar, guíe la conversación, y mantenga estado del cliente en cada etapa.",
    },
    {
      id: "PP-002",
      area: "recordatorios",
      title: "Recordatorio manual depende de una persona",
      description:
        "Betzi debe acordarse de escribir a cada cliente una hora antes. Si se olvida o está ocupada, el cliente no recibe recordatorio y aumenta la probabilidad de inasistencia.",
      currentBehavior:
        "Betzi escribe manualmente 'Hola, te recordamos tu hora...' por WhatsApp. Sin automatización ni tracking de si el cliente respondió.",
      impact: "high",
      suggestedSolution:
        "Automatizar el recordatorio 1h antes con mensaje WhatsApp, botón de confirmación, y estado visible en CRM.",
    },
    {
      id: "PP-003",
      area: "asistencia",
      title: "Sin registro formal de asistencia",
      description:
        "No existe un sistema que registre si el cliente asistió, no asistió, o canceló. Esto impide calcular métricas de cumplimiento y detectar patrones de inasistencia.",
      currentBehavior:
        "El salón sabe quién asistió por observación directa. No hay datos históricos ni reportes.",
      impact: "medium",
      suggestedSolution:
        "Implementar registro de asistencia con estados: confirmado, asistió, no asistió, canceló. Asociar a cada cita en el calendario.",
    },
    {
      id: "PP-004",
      area: "pagos",
      title: "Pagos registrados en sistema externo sin reportes integrados",
      description:
        "Los pagos se registran en AgendaPro pero no hay integración con SendMe Studio. No se pueden cruzar pagos con campañas, clientes, ni generar reportes financieros unificados.",
      currentBehavior:
        "La recepcionista registra el pago en AgendaPro. Luego AgendaPro permite ver ventas del mes, pero fuera de SendMe Studio.",
      impact: "medium",
      suggestedSolution:
        "Crear módulo de registro de pagos en SendMe Studio con servicio, profesional, monto, método de pago. Sincronizar o complementar AgendaPro.",
    },
    {
      id: "PP-005",
      area: "venta_productos",
      title: "Cero visibilidad de venta de productos",
      description:
        "El salón no sabe qué productos se vendieron, quién los vendió, ni a qué cliente. No hay control de inventario asociado a ventas.",
      currentBehavior:
        "No hay registro. La venta ocurre de forma verbal y no queda trazabilidad.",
      impact: "high",
      suggestedSolution:
        "Implementar módulo de venta de productos con SKU, precio, profesional, cliente, método de pago. Calcular comisión 7% automáticamente.",
    },
    {
      id: "PP-006",
      area: "comisiones",
      title: "Comisiones no registradas ni calculadas",
      description:
        "La regla de 7% de comisión sobre venta de productos no se aplica en ningún sistema. Los profesionales no tienen visibilidad de sus comisiones.",
      currentBehavior:
        "No existe registro ni cálculo. La comisión se 'acuerda verbalmente' y no se paga formalmente.",
      impact: "medium",
      suggestedSolution:
        "Calcular comisión 7% automáticamente al registrar una venta de producto. Mostrar reporte de comisiones por profesional y por período.",
    },
    {
      id: "PP-007",
      area: "inventario",
      title: "Sin control de stock ni alertas de reposición",
      description:
        "No se sabe cuánto producto hay, qué falta, ni cuándo reponer. No hay alertas de stock mínimo.",
      currentBehavior:
        "El salón compra productos 'cuando se acuerda' o cuando un cliente pide algo específico. No hay sistema de inventario.",
      impact: "high",
      suggestedSolution:
        "Implementar módulo de inventario con SKU, nombre, categoría, stock actual, stock mínimo, precio venta, precio interno, costo. Alertas automáticas de stock bajo.",
    },
    {
      id: "PP-008",
      area: "insumos_estilistas",
      title: "Pérdida de trazabilidad de insumos entregados a estilistas",
      description:
        "No se sabe cuánto producto se le ha entregado a cada estilista. No hay control de consumo interno vs. venta a cliente.",
      currentBehavior:
        "Se entrega producto completo al estilista sin registro. No se diferencia de una venta a cliente.",
      impact: "medium",
      suggestedSolution:
        "Crear módulo de insumos que diferencie venta a cliente (con comisión) de entrega a estilista (sin comisión, consumo interno). Ambos descuentan stock.",
    },
  ];

  const opportunities: Opportunity[] = [
    {
      id: "OP-001",
      area: "whatsapp",
      title: "Automatizar flujo de captación con IA",
      description:
        "Implementar un asistente IA que detecte intención de agendar, pida datos estructurados, sugiera horarios basados en disponibilidad real y mantenga estado del cliente.",
      estimatedValue: "high",
      effort: "high",
      dependencies: ["Inventario de profesionales y horarios", "Integración con agenda"],
    },
    {
      id: "OP-002",
      area: "recordatorios",
      title: "Reducir inasistencias con recordatorios automáticos",
      description:
        "Automatizar el recordatorio 1h antes con confirmación por WhatsApp. Estimar reducción de 20-30% en inasistencias.",
      estimatedValue: "high",
      effort: "medium",
      dependencies: ["Conexión con agenda (AgendaPro o propia)"],
    },
    {
      id: "OP-003",
      area: "venta_productos",
      title: "Nueva fuente de ingresos con trazabilidad",
      description:
        "Registrar cada venta de producto genera datos para: comisiones a profesionales, control de inventario, productos más vendidos, y margen por producto.",
      estimatedValue: "high",
      effort: "medium",
      dependencies: ["Módulo de inventario"],
    },
    {
      id: "OP-004",
      area: "pagos",
      title: "Reportes financieros unificados",
      description:
        "Unificar registro de pagos de servicios + venta de productos en un solo sistema de reportes financieros. Visibilidad de ingresos por servicio, producto, profesional y método de pago.",
      estimatedValue: "medium",
      effort: "medium",
      dependencies: ["Módulo de pagos", "Módulo de venta de productos"],
    },
    {
      id: "OP-005",
      area: "inventario",
      title: "Control de stock con alertas tempranas",
      description:
        "Implementar inventario con alertas de stock mínimo evita quedarse sin productos populares y permite planificar compras con anticipación.",
      estimatedValue: "medium",
      effort: "low",
      dependencies: [],
    },
    {
      id: "OP-006",
      area: "insumos_estilistas",
      title: "Control de costos por profesional",
      description:
        "Registrar insumos entregados a cada estilista permite calcular costo de servicio por profesional y detectar desperdicio o consumo excesivo.",
      estimatedValue: "medium",
      effort: "medium",
      dependencies: ["Módulo de inventario"],
    },
  ];

  const recommendedModules: RecommendedModule[] = [
    {
      id: "MOD-001",
      name: "Inventory",
      description:
        "Gestión de stock de productos con SKU, categorías, precios (cliente e interno), stock mínimo, alertas, y movimientos (entrada, venta, entrega, ajuste, devolución, merma).",
      primaryArea: "inventario",
      secondaryAreas: ["venta_productos", "insumos_estilistas"],
      keyFeatures: [
        "CRUD de productos con SKU, nombre, categoría, precios, stock, costo",
        "Registro de movimientos: entrada, venta_cliente, entrega_estilista, ajuste, devolución, merma",
        "Alerta automática cuando stock ≤ stock mínimo",
        "Historial de movimientos por producto",
      ],
      dependsOn: [],
    },
    {
      id: "MOD-002",
      name: "ProductSales",
      description:
        "Venta de productos a clientes con registro de profesional vendedor, método de pago, comisión 7% automática y descuento de inventario.",
      primaryArea: "venta_productos",
      secondaryAreas: ["comisiones", "inventario"],
      keyFeatures: [
        "Registro de venta: producto, cliente, cantidad, profesional, método de pago",
        "Cálculo automático de comisión 7%",
        "Descuento automático de stock",
        "Reporte de ventas por período, profesional, producto y método de pago",
      ],
      dependsOn: ["MOD-001 (Inventory)"],
    },
    {
      id: "MOD-003",
      name: "StylistSupplies",
      description:
        "Entrega de insumos a estilistas. Se diferencia de venta a cliente: no genera comisión, se registra como consumo interno o cargo al profesional.",
      primaryArea: "insumos_estilistas",
      secondaryAreas: ["inventario", "comisiones"],
      keyFeatures: [
        "Registro de entrega: producto, profesional, cantidad, fecha",
        "NO genera comisión (diferente de venta a cliente)",
        "Descuento automático de stock",
        "Reporte de consumo por profesional y período",
      ],
      dependsOn: ["MOD-001 (Inventory)"],
    },
    {
      id: "MOD-004",
      name: "PaymentRegister",
      description:
        "Registro de pagos por servicio con método de pago, profesional, y reportes financieros básicos.",
      primaryArea: "pagos",
      secondaryAreas: ["agenda"],
      keyFeatures: [
        "Registro de pago asociado a cita: servicio, profesional, monto, método de pago",
        "KPIs: total vendido hoy/mes, por método, por profesional",
        "Ticket promedio y servicios más vendidos",
      ],
      dependsOn: [],
    },
    {
      id: "MOD-005",
      name: "ProfessionalCommissions",
      description:
        "Cálculo y reporte de comisiones por venta de productos (7%). Agrega visibilidad para profesionales y administración.",
      primaryArea: "comisiones",
      secondaryAreas: ["venta_productos"],
      keyFeatures: [
        "Cálculo automático de 7% por venta de producto",
        "Reporte por profesional y período",
        "Dashboard de comisiones",
      ],
      dependsOn: ["MOD-002 (ProductSales)"],
    },
    {
      id: "MOD-006",
      name: "AppointmentReminder",
      description:
        "Recordatorio automático de citas 1 hora antes con mensaje WhatsApp y botón de confirmación.",
      primaryArea: "recordatorios",
      secondaryAreas: ["whatsapp", "asistencia"],
      keyFeatures: [
        "Disparo automático 1 hora antes de la cita",
        "Mensaje WhatsApp con {{nombre}}, {{hora}}, {{servicio}}",
        "Botón de confirmación de asistencia",
        "Actualización de estado en CRM al recibir respuesta",
        "Estados visuales: confirmado (🟡), asistió (🟣), no asistió (🟠), pendiente (⚪)",
      ],
      dependsOn: ["Conexión con agenda"],
    },
    {
      id: "MOD-007",
      name: "AttendanceTracking",
      description:
        "Seguimiento de asistencia a citas con estados y métricas de cumplimiento.",
      primaryArea: "asistencia",
      secondaryAreas: ["agenda"],
      keyFeatures: [
        "Estados: confirmado, asistió, no asistió, canceló",
        "Registro histórico por cliente",
        "% de cumplimiento por cliente y por período",
        "Detección de patrones de inasistencia",
      ],
      dependsOn: ["MOD-006 (AppointmentReminder)"],
    },
    {
      id: "MOD-008",
      name: "ReceptionistAI",
      description:
        "Asistente IA para captación y agendamiento por WhatsApp. Detecta intención, pide datos, sugiere horarios y prepara reservas.",
      primaryArea: "whatsapp",
      secondaryAreas: ["agenda", "recordatorios"],
      keyFeatures: [
        "Detección de intención de agendar en conversación WhatsApp",
        "Solicitud estructurada de datos: nombre, teléfono, servicio, hora",
        "Sugerencia de horarios disponibles",
        "Preparación de reserva para confirmación humana",
        "Seguimiento de estado del cliente en flujo de agendamiento",
      ],
      dependsOn: [
        "MOD-001 (Inventory) — para servicios",
        "MOD-006 (AppointmentReminder) — para recordatorios post-agendamiento",
        "Conexión con agenda",
      ],
    },
    {
      id: "MOD-009",
      name: "MonthlyFinanceSummary",
      description:
        "Resumen financiero mensual que integra pagos de servicios + venta de productos + comisiones.",
      primaryArea: "pagos",
      secondaryAreas: ["venta_productos", "comisiones"],
      keyFeatures: [
        "Ingresos totales del mes (servicios + productos)",
        "Desglose por método de pago",
        "Ventas por profesional",
        "Comisiones pagadas",
        "Ticket promedio",
        "Comparativa mes anterior",
      ],
      dependsOn: ["MOD-004 (PaymentRegister)", "MOD-002 (ProductSales)", "MOD-005 (ProfessionalCommissions)"],
    },
  ];

  const recommendedKPIs: RecommendedKPI[] = [
    { id: "KPI-001", label: "Tasa de confirmación de recordatorios", description: "% de clientes que confirman asistencia vs. recordatorios enviados", area: "recordatorios" },
    { id: "KPI-002", label: "Tasa de inasistencia", description: "% de clientes que no asisten vs. citas agendadas", area: "asistencia" },
    { id: "KPI-003", label: "Cumplimiento por cliente", description: "% de citas a las que el cliente asistió en los últimos 3 meses", area: "asistencia" },
    { id: "KPI-004", label: "Ingresos totales del mes", description: "Suma de pagos de servicios + venta de productos en el mes", area: "pagos", formula: "SUM(pagos.servicio) + SUM(ventas producto.total)" },
    { id: "KPI-005", label: "Ventas por método de pago", description: "Distribución de ingresos por efectivo, crédito, débito, transferencia", area: "pagos" },
    { id: "KPI-006", label: "Ticket promedio por cita", description: "Monto promedio pagado por servicio", area: "pagos", formula: "SUM(total servicios) / COUNT(citas)" },
    { id: "KPI-007", label: "Servicios más vendidos", description: "Top servicios por frecuencia de reserva", area: "pagos" },
    { id: "KPI-008", label: "Ventas de productos del mes", description: "Total vendido en productos (valor público)", area: "venta_productos" },
    { id: "KPI-009", label: "Comisiones generadas por profesional", description: "Suma de comisiones 7% por profesional en el período", area: "comisiones", formula: "SUM(ventas_producto.total * 0.07) GROUP BY profesional" },
    { id: "KPI-010", label: "Comisión total del período", description: "Suma de todas las comisiones 7% generadas", area: "comisiones", formula: "SUM(ventas_producto.total * 0.07)" },
    { id: "KPI-011", label: "Productos más vendidos", description: "Top productos por unidades vendidas a clientes", area: "venta_productos" },
    { id: "KPI-012", label: "Stock bajo", description: "Productos con stock actual ≤ stock mínimo", area: "inventario" },
    { id: "KPI-013", label: "Valor del inventario", description: "Costo total del inventario actual (stock * costo)", area: "inventario", formula: "SUM(productos.stock * productos.costo)" },
    { id: "KPI-014", label: "Consumo de insumos por profesional", description: "Valor de insumos entregados a cada estilista en el período", area: "insumos_estilistas" },
    { id: "KPI-015", label: "Clientes captados por WhatsApp", description: "Nuevos clientes que agendaron vía WhatsApp con asistencia IA", area: "whatsapp" },
  ];

  const priorities: ImplementationPriority[] = [
    {
      phase: 1,
      label: "Fundación de datos",
      modules: ["MOD-001 (Inventory)"],
      estimatedEffort: "1-2 semanas",
      rationale:
        "Inventario es la base de venta de productos, insumos a estilistas y control de stock. Sin inventario no se puede vender ni rastrear productos.",
    },
    {
      phase: 2,
      label: "Ventas y comisiones",
      modules: ["MOD-002 (ProductSales)", "MOD-003 (StylistSupplies)", "MOD-005 (ProfessionalCommissions)"],
      estimatedEffort: "2-3 semanas",
      rationale:
        "Una vez que existe inventario, se puede vender a clientes y entregar a estilistas. Las comisiones se calculan automáticamente desde las ventas.",
    },
    {
      phase: 3,
      label: "Recordatorios y asistencia",
      modules: ["MOD-006 (AppointmentReminder)", "MOD-007 (AttendanceTracking)"],
      estimatedEffort: "2-3 semanas",
      rationale:
        "Reducir inasistencias es un beneficio inmediato. Requiere conexión con la agenda (AgendaPro o propia).",
    },
    {
      phase: 4,
      label: "Pagos y finanzas",
      modules: ["MOD-004 (PaymentRegister)", "MOD-009 (MonthlyFinanceSummary)"],
      estimatedEffort: "2 semanas",
      rationale:
        "Unificar registro de pagos y generar reportes financieros integrados. Se beneficia de los módulos de ventas ya implementados.",
    },
    {
      phase: 5,
      label: "IA y automatización",
      modules: ["MOD-008 (ReceptionistAI)"],
      estimatedEffort: "3-4 semanas",
      rationale:
        "El asistente IA de captación es el módulo más complejo. Requiere la infraestructura de agenda y recordatorios ya funcionando.",
    },
  ];

  const summary =
    "El salón opera con 3 sistemas/herramientas: AgendaPro (agenda + pagos básicos), " +
    "WhatsApp manual (captación + recordatorios), y memoria humana (ventas, comisiones, inventario). " +
    "Las brechas principales son: (1) recordatorios manuales dependientes de una persona, " +
    "(2) cero visibilidad de venta de productos y comisiones, (3) sin control de inventario, " +
    "(4) captación de clientes sin seguimiento de estados. " +
    "La prioridad es construir inventario como base, luego ventas y comisiones, " +
    "después recordatorios y pagos, y finalmente el asistente IA de recepción.";

  return {
    module: "salon-operations",
    source: "docs/SALON_OPERATION_REQUIREMENTS.md",
    generatedAt: now,
    summary,
    operationalSummary,
    painPoints,
    opportunities,
    recommendedModules,
    recommendedKPIs,
    priorities,
  };
}
