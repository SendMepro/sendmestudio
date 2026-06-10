"use client";

/* ══════════════════════════════════════════════════════════
   Campaign History — Types & Constants
   ══════════════════════════════════════════════════════════ */

export type CampaignHistoryStatus =
  | "sent"
  | "scheduled_history"
  | "cancelled"
  | "failed"
  | "draft_history";

export interface CampaignHistoryMetrics {
  totalContacts: number;
  sent: number;
  failed: number;
  replies: number;
  bookings: number;
}

export interface CampaignHistoryEntry {
  id: string;
  name: string;
  type: "WhatsApp" | "Instagram" | "Facebook";
  channel: string;
  body: string;
  audienceId?: string;
  audienceName: string;
  totalContacts: number;
  status: CampaignHistoryStatus;
  metrics: CampaignHistoryMetrics;
  createdAt: string;       // ISO
  updatedAt: string;       // ISO
  sentAt?: string;         // ISO
  scheduledAt?: string;    // ISO
  cancelledAt?: string;    // ISO
}

export const HISTORY_STATUS_LABELS: Record<CampaignHistoryStatus, string> = {
  sent: "Enviada",
  scheduled_history: "Programada",
  cancelled: "Cancelada",
  failed: "Fallida",
  draft_history: "Borrador",
};

export const HISTORY_STATUS_COLORS: Record<CampaignHistoryStatus, string> = {
  sent: "#15803d",
  scheduled_history: "#8b6f3a",
  cancelled: "#dc2626",
  failed: "#dc2626",
  draft_history: "#6b7280",
};

export const HISTORY_STATUS_BG: Record<CampaignHistoryStatus, string> = {
  sent: "rgba(34,197,94,0.12)",
  scheduled_history: "rgba(198,163,109,0.15)",
  cancelled: "rgba(239,68,68,0.10)",
  failed: "rgba(239,68,68,0.10)",
  draft_history: "rgba(107,114,128,0.10)",
};

export type DateFilterPreset =
  | "today"
  | "this_week"
  | "this_month"
  | "last_month"
  | "custom";

export function getDateRange(preset: DateFilterPreset, customStart?: string, customEnd?: string): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  switch (preset) {
    case "today":
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "this_week": {
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "this_month":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "last_month":
      start.setMonth(start.getMonth() - 1, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "custom":
      if (customStart) start.setTime(new Date(customStart).getTime());
      if (customEnd) end.setTime(new Date(customEnd).getTime());
      break;
  }
  return { start, end };
}

/** Generate demo history entries */
export function generateDemoHistory(): CampaignHistoryEntry[] {
  const now = Date.now();
  const day = 86400000;

  return [
    {
      id: "hist_001",
      name: "Promo Corte + Brushing",
      type: "WhatsApp",
      channel: "WhatsApp",
      body: "Hola {{nombre}} ✨\n\nEsta semana tenemos cupos especiales para corte + brushing con nuestros estilistas.\n\n¿Te gustaría agendar?",
      audienceName: "Clientes frecuentes",
      totalContacts: 345,
      status: "sent",
      metrics: { totalContacts: 345, sent: 340, failed: 5, replies: 28, bookings: 12 },
      createdAt: new Date(now - 7 * day).toISOString(),
      updatedAt: new Date(now - 7 * day).toISOString(),
      sentAt: new Date(now - 7 * day).toISOString(),
    },
    {
      id: "hist_002",
      name: "Balayage Premium",
      type: "WhatsApp",
      channel: "WhatsApp",
      body: "Hola {{nombre}} ✨\n\nEste mes tenemos promoción en Balayage Premium con queratina incluida.\n\n¡Aprovecha!",
      audienceName: "Todas las clientas",
      totalContacts: 892,
      status: "sent",
      metrics: { totalContacts: 892, sent: 885, failed: 7, replies: 64, bookings: 31 },
      createdAt: new Date(now - 14 * day).toISOString(),
      updatedAt: new Date(now - 14 * day).toISOString(),
      sentAt: new Date(now - 14 * day).toISOString(),
    },
    {
      id: "hist_003",
      name: "Mascarilla Capilar",
      type: "Instagram",
      channel: "Instagram (Próximamente)",
      body: "✨ Dale vida a tu cabello con nuestra Mascarilla Capilar Premium.\n\nResultados visibles desde la primera aplicación.",
      audienceName: "Seguidores Instagram",
      totalContacts: 0,
      status: "cancelled",
      metrics: { totalContacts: 0, sent: 0, failed: 0, replies: 0, bookings: 0 },
      createdAt: new Date(now - 21 * day).toISOString(),
      updatedAt: new Date(now - 18 * day).toISOString(),
      cancelledAt: new Date(now - 18 * day).toISOString(),
    },
    {
      id: "hist_004",
      name: "Día de la Madre",
      type: "WhatsApp",
      channel: "WhatsApp",
      body: "🌸 Celebra a mamá con un día de belleza completo.\n\nDescuento especial del 20% en todos nuestros servicios.",
      audienceName: "Clientas VIP",
      totalContacts: 128,
      status: "failed",
      metrics: { totalContacts: 128, sent: 0, failed: 128, replies: 0, bookings: 0 },
      createdAt: new Date(now - 30 * day).toISOString(),
      updatedAt: new Date(now - 30 * day).toISOString(),
    },
    {
      id: "hist_005",
      name: "Alisado Orgánico",
      type: "WhatsApp",
      channel: "WhatsApp",
      body: "Hola {{nombre}} ✨\n\nLanzamos nuestro nuevo Alisado Orgánico libre de formol.\n\nResultado liso, brillante y saludable.",
      audienceName: "Clientes frecuentes",
      totalContacts: 210,
      status: "scheduled_history",
      metrics: { totalContacts: 210, sent: 0, failed: 0, replies: 0, bookings: 0 },
      createdAt: new Date(now - 5 * day).toISOString(),
      updatedAt: new Date(now - 5 * day).toISOString(),
      scheduledAt: new Date(now + 3 * day).toISOString(),
    },
    {
      id: "hist_006",
      name: "Botox Capilar",
      type: "WhatsApp",
      channel: "WhatsApp",
      body: "Hola {{nombre}} ✨\n\nRecupera la vitalidad de tu cabello con nuestro tratamiento de Botox Capilar.",
      audienceName: "Todas las clientas",
      totalContacts: 567,
      status: "sent",
      metrics: { totalContacts: 567, sent: 560, failed: 7, replies: 42, bookings: 18 },
      createdAt: new Date(now - 45 * day).toISOString(),
      updatedAt: new Date(now - 45 * day).toISOString(),
      sentAt: new Date(now - 45 * day).toISOString(),
    },
  ];
}
