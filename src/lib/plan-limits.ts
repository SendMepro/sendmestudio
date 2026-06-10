// ================================================================
// lib/plan-limits.ts — Enforcement de límites de plan por tenant
// Verifica límites configurables desde Plan.features y Plan.limits.
// ================================================================

import prisma from "@/lib/prisma";

export interface PlanEnforcementResult {
  allowed: boolean;
  reason: string | null;
  limits: {
    monthlyAiRequests: number;
    usedAiRequests: number;
    aiBudgetClp: number;
    usedAiBudgetClp: number;
    maxUsers: number;
    currentUsers: number;
  };
}

/**
 * Verifica los límites de un tenant según su plan activo.
 * Retorna { allowed: false, reason } si algún límite se ha excedido.
 */
export async function enforcePlanLimits(
  tenantId: string,
  options?: { checkAiRequests?: boolean; checkAiBudget?: boolean }
): Promise<PlanEnforcementResult> {
  const checkAiRequests = options?.checkAiRequests ?? false;
  const checkAiBudget = options?.checkAiBudget ?? false;

  const defaults = {
    monthlyAiRequests: 0,
    usedAiRequests: 0,
    aiBudgetClp: 0,
    usedAiBudgetClp: 0,
    maxUsers: 0,
    currentUsers: 0,
  };

  try {
    const [tenant, subscription, aiSettings] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { isActive: true, licenseStatus: true },
      }),
      prisma.subscription.findFirst({
        where: { tenantId },
        include: { plan: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.aiSettings.findUnique({
        where: { tenantId },
        select: { monthlyAiRequests: true, monthlyAiBudget: true },
      }),
    ]);

    // Verificar estado del tenant
    if (!tenant || !tenant.isActive) {
      return {
        allowed: false,
        reason: "Tu cuenta está desactivada. Contacta a soporte.",
        limits: defaults,
      };
    }

    if (tenant.licenseStatus === "expired" || tenant.licenseStatus === "suspended" || tenant.licenseStatus === "cancelled") {
      return {
        allowed: false,
        reason: `Licencia ${tenant.licenseStatus}. Contrata un plan para continuar.`,
        limits: defaults,
      };
    }

    if (!subscription || !subscription.plan) {
      return {
        allowed: false,
        reason: "No tienes un plan activo. Contacta a soporte.",
        limits: defaults,
      };
    }

    // Extraer límites del plan
    const planLimits = (subscription.plan.limits || {}) as {
      monthlyAiRequests?: number;
      monthlyCampaigns?: number;
      maxUsers?: number;
      maxBranches?: number;
      monthlyAiBudgetClp?: number;
    };

    const currentUsers = await prisma.userTenant.count({
      where: { tenantId, isActive: true },
    });

    const limits = {
      monthlyAiRequests: planLimits.monthlyAiRequests ?? Infinity,
      usedAiRequests: aiSettings?.monthlyAiRequests ?? 0,
      aiBudgetClp: planLimits.monthlyAiBudgetClp ?? (aiSettings?.monthlyAiBudget ?? Infinity),
      usedAiBudgetClp: 0,
      maxUsers: planLimits.maxUsers ?? Infinity,
      currentUsers,
    };

    // Verificar límites
    if (checkAiRequests && limits.usedAiRequests >= limits.monthlyAiRequests) {
      return {
        allowed: false,
        reason: `Has alcanzado el límite mensual de ${limits.monthlyAiRequests} solicitudes AI. Actualiza tu plan para más.`,
        limits,
      };
    }

    if (checkAiBudget && limits.aiBudgetClp !== Infinity) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const costEvents = await prisma.whatsAppAnalyticsEvent.findMany({
        where: {
          tenantId,
          type: "ai_cost_event",
          timestamp: {
            gte: new Date(`${currentMonth}-01T00:00:00Z`),
          },
        },
      });

      const usedBudget = costEvents.reduce((sum, e) => {
        const meta = e.metadata as Record<string, unknown> || {};
        return sum + ((meta.estimatedCostClp as number) || 0);
      }, 0);

      limits.usedAiBudgetClp = usedBudget;
      if (usedBudget >= limits.aiBudgetClp) {
        return {
          allowed: false,
          reason: `Has alcanzado el presupuesto mensual de $${limits.aiBudgetClp.toLocaleString("es-CL")} en costos AI.`,
          limits,
        };
      }
    }

    if (limits.currentUsers > limits.maxUsers) {
      return {
        allowed: false,
        reason: `Tu plan permite máximo ${limits.maxUsers} usuarios. Tienes ${limits.currentUsers}. Elimina usuarios o actualiza tu plan.`,
        limits,
      };
    }

    return { allowed: true, reason: null, limits };
  } catch (err) {
    console.error("[plan-limits] Error:", err);
    return { allowed: true, reason: null, limits: defaults };
  }
}

/**
 * Helper rápido para verificar límite de solicitudes AI.
 */
export async function checkAiRequestLimit(tenantId: string) {
  return enforcePlanLimits(tenantId, { checkAiRequests: true });
}

/**
 * Helper rápido para verificar presupuesto AI.
 */
export async function checkAiBudget(tenantId: string) {
  return enforcePlanLimits(tenantId, { checkAiBudget: true });
}

/**
 * Helper rápido para verificar límite de usuarios.
 */
export async function checkUserLimit(tenantId: string) {
  return enforcePlanLimits(tenantId);
}
