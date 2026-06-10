// ================================================================
// Customer Context Agent — build compact memory context for AI
// prompt enrichment.
// Phase: FASE 4 — Customer Context Injection
// Status: updated — now supports Prisma with tenantId
//
// Used by generateDeepSeekConciergeReply() and generateTenantAwareReply()
// to inject customer memory context before the AI generates a reply.
// ================================================================

import { getCustomerMemoryProfileByPhone } from "../data/customer-memory-store";

/**
 * Get a customer memory profile, preferring Prisma when tenantId is provided.
 * Falls back to JSON store if Prisma is unavailable.
 */
async function getProfileForContext(customerPhone: string, tenantId?: string) {
  if (tenantId) {
    try {
      const { prisma } = await import("../lib/prisma");
      const record = await prisma.customerMemory.findUnique({
        where: { tenantId_phone: { tenantId, phone: customerPhone } },
      });
      if (record) {
        const profile = record.profile as any;
        const signals = record.signals as any[];
        return {
          customerName: profile?.customerName ?? "",
          preferredStylist: profile?.preferredStylist ?? null,
          preferredSchedule: profile?.preferredSchedule ?? null,
          transport: profile?.transport ?? null,
          parkingInterest: profile?.parkingInterest ?? false,
          priceSensitive: profile?.priceSensitive ?? false,
          waitingSensitivity: profile?.waitingSensitivity ?? null,
          allergies: Array.isArray(profile?.allergies) ? profile.allergies : [],
          favoriteServices: Array.isArray(profile?.favoriteServices) ? profile.favoriteServices : [],
          confidenceScore: profile?.confidenceScore ?? 0,
        };
      }
    } catch {
      // Fall through to JSON store
    }
  }

  // Fallback: legacy JSON store
  return getCustomerMemoryProfileByPhone(customerPhone);
}

/**
 * Build a compact text context from a customer's memory profile.
 *
 * Returns an empty string if no profile is found.
 * Never throws — wraps errors with console.warn and returns "".
 *
 * @param customerPhone - The customer's phone number (numeric, no leading +)
 * @param tenantId - Optional tenantId for Prisma lookup (multi-tenant)
 * @returns A formatted context block, or "" if no profile / error
 */
export async function buildCustomerContext(
  customerPhone: string,
  tenantId?: string,
): Promise<string> {
  try {
    const profile = await getProfileForContext(customerPhone, tenantId);

    if (!profile) {
      return "";
    }

    const lines: string[] = [];
    lines.push("CUSTOMER MEMORY");
    lines.push("");

    if (profile.customerName && profile.customerName !== "Unknown") {
      lines.push(`Nombre: ${profile.customerName}`);
    }

    if (profile.preferredStylist) {
      lines.push(`Estilista favorita: ${profile.preferredStylist}`);
    }

    if (profile.preferredSchedule) {
      lines.push(`Horario preferido: ${profile.preferredSchedule}`);
    }

    if (profile.transport) {
      lines.push(`Transporte: ${profile.transport}`);
    }

    if (profile.parkingInterest) {
      lines.push("Interés estacionamiento: sí");
    }

    if (profile.priceSensitive) {
      lines.push("Sensibilidad precio: alta");
    }

    if (profile.waitingSensitivity) {
      lines.push(`Sensibilidad espera: ${profile.waitingSensitivity}`);
    }

    // Allergies
    if (profile.allergies.length > 0) {
      lines.push("");
      lines.push("Alergias:");
      for (const allergy of profile.allergies) {
        lines.push(`- ${allergy}`);
      }
    }

    // Favorite services
    if (profile.favoriteServices.length > 0) {
      lines.push("");
      lines.push("Servicios favoritos:");
      for (const svc of profile.favoriteServices) {
        lines.push(`- ${svc}`);
      }
    }

    // Confidence score
    if (profile.confidenceScore > 0) {
      lines.push("");
      lines.push(`Confidence Score:`);
      lines.push(String(profile.confidenceScore));
    }

    return lines.join("\n");
  } catch (error) {
    console.warn("buildCustomerContext failed", {
      customerPhone,
      error: error instanceof Error ? error.message : "unknown",
    });
    return "";
  }
}
