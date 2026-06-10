// ================================================================
// lib/tenant-knowledge.ts — Carga datos tenant-aware para AI Concierge
// Lee de Prisma: BusinessSettings + KnowledgeItems
// ================================================================

import prisma from "@/lib/prisma";

export type TenantKnowledge = {
  services: any[];
  businessHours: any;
  latePolicy: string | null;
  minimumBufferMinutes: number;
  lunchBreak: string | null;
  lastAcceptedTime: string | null;

  // From KnowledgeItems
  faqs: any[];
  salonProfile: any;
  aiRules: any;
  prompts: any[];
};

/**
 * Carga todo el conocimiento del tenant desde Prisma.
 * Retorna defaults si no hay datos.
 */
export async function loadTenantKnowledge(tenantId: string): Promise<TenantKnowledge> {
  const [bs, knowledgeItems] = await Promise.all([
    prisma.businessSettings.findUnique({ where: { tenantId } }),
    prisma.knowledgeItem.findMany({ where: { tenantId } }),
  ]);

  // Build knowledge bundle from items
  const knowledge: Record<string, any> = {};
  for (const item of knowledgeItems) {
    knowledge[item.section] = item.data;
  }

  return {
    services: (bs?.services as any[]) ?? [],
    businessHours: bs?.businessHours ?? {},
    latePolicy: bs?.latePolicy ?? null,
    minimumBufferMinutes: bs?.minimumBufferMinutes ?? 15,
    lunchBreak: bs?.lunchBreak ?? null,
    lastAcceptedTime: bs?.lastAcceptedTime ?? null,

    faqs: Array.isArray(knowledge.faqs) ? knowledge.faqs : [],
    salonProfile: knowledge.salonProfile ?? {},
    aiRules: knowledge.aiRules ?? {},
    prompts: Array.isArray(knowledge.prompts) ? knowledge.prompts : [],
  };
}

/**
 * Construye reglas de intención dinámicas desde los servicios del tenant.
 * Cada servicio genera una regla con su nombre y keywords.
 */
export function buildIntentRulesFromServices(services: any[]) {
  return services
    .filter((s) => s.name)
    .map((s) => ({
      intent: s.name.toLowerCase().replace(/\s+/g, "_"),
      label: s.name,
      keywords: [
        s.name.toLowerCase(),
        ...(s.keywords || []).map((k: string) => k.toLowerCase()),
      ],
      confidence: 0.85,
    }));
}
