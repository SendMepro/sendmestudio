// ================================================================
// customers/store.ts — Customer persistence via Prisma (tenant-aware)
// v2: Prisma es fuente única — sin JSON fallback
// ================================================================

import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import { matchTextToServices } from "../../lib/serviceMatcher";
import { recordAnalyticsEvent, type WhatsAppInternalMessage } from "../whatsapp/store";

export type ServiceHistoryEntry = {
  service: string;
  date: string;
  specialist: string;
  price: string;
};

export type CustomerProfile = {
  id: string;
  phone: string;
  displayName: string;
  firstName: string;
  tags: string[];
  interests: string[];
  requestedServices: string[];
  lastVisit: string | null;
  lastConversationAt: string;
  preferredStylist: string | null;
  favoriteServices: string[];
  uploadedAssets: string[];
  campaignEligible: boolean;
  consentWhatsapp?: boolean;
  notes: string;
  aiSummary: string;
  lifecycleStage: string;
  serviceHistory: ServiceHistoryEntry[];
  avatarManualUrl?: string;
  avatarWhatsappUrl?: string;
  avatarSource?: "manual" | "whatsapp" | "initials";
  lastAvatarSync?: string;
};

export type CustomerImportRow = {
  firstName: string;
  phone: string;
  tags: string[];
  lastVisit: string | null;
  requestedService: string;
  consentWhatsapp: boolean;
};

// ── Prisma helpers ──────────────────────────────────────────────

function fromPrismaCustomer(c: any): CustomerProfile {
  return {
    id: c.id,
    phone: c.phone,
    displayName: c.displayName ?? c.phone,
    firstName: c.firstName ?? "",
    tags: Array.isArray(c.tags) ? c.tags : [],
    interests: Array.isArray(c.interests) ? c.interests : [],
    requestedServices: Array.isArray(c.requestedServices) ? c.requestedServices : [],
    lastVisit: c.lastVisit ?? null,
    lastConversationAt: c.lastConversationAt ?? new Date().toISOString(),
    preferredStylist: c.preferredStylist ?? null,
    favoriteServices: Array.isArray(c.favoriteServices) ? c.favoriteServices : [],
    uploadedAssets: Array.isArray(c.uploadedAssets) ? c.uploadedAssets : [],
    campaignEligible: c.campaignEligible ?? false,
    consentWhatsapp: c.consentWhatsapp ?? undefined,
    notes: c.notes ?? "",
    aiSummary: c.aiSummary ?? "",
    lifecycleStage: c.lifecycleStage ?? "new",
    serviceHistory: Array.isArray(c.serviceHistory) ? c.serviceHistory : [],
    avatarManualUrl: c.avatarManualUrl ?? undefined,
    avatarWhatsappUrl: c.avatarWhatsappUrl ?? undefined,
    avatarSource: c.avatarSource ?? undefined,
    lastAvatarSync: c.lastAvatarSync ?? undefined,
  };
}

// ── Public API ──────────────────────────────────────────────────

export async function readCustomers(tenantId?: string): Promise<CustomerProfile[]> {
  if (!tenantId) return [];

  try {
    const records = await prisma.customer.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
    return records.map(fromPrismaCustomer);
  } catch (err) {
    console.warn("[customers/store] Prisma read failed:", err);
    return [];
  }
}

export async function writeCustomers(customers: CustomerProfile[], tenantId?: string) {
  if (!tenantId) return;

  // Sync to Prisma: upsert each customer
  try {
    for (const c of customers) {
      await prisma.customer.upsert({
        where: { tenantId_phone: { tenantId, phone: c.phone } },
        create: {
          tenantId,
          phone: c.phone,
          displayName: c.displayName,
          firstName: c.firstName,
          tags: c.tags,
          interests: c.interests,
          requestedServices: c.requestedServices,
          lastVisit: c.lastVisit,
          lastConversationAt: c.lastConversationAt,
          preferredStylist: c.preferredStylist,
          favoriteServices: c.favoriteServices,
          uploadedAssets: c.uploadedAssets,
          campaignEligible: c.campaignEligible,
          consentWhatsapp: c.consentWhatsapp,
          notes: c.notes,
          aiSummary: c.aiSummary,
          lifecycleStage: c.lifecycleStage,
          serviceHistory: c.serviceHistory,
          avatarManualUrl: c.avatarManualUrl,
          avatarWhatsappUrl: c.avatarWhatsappUrl,
          avatarSource: c.avatarSource,
          lastAvatarSync: c.lastAvatarSync,
        },
        update: {
          displayName: c.displayName,
          firstName: c.firstName,
          tags: c.tags,
          interests: c.interests,
          requestedServices: c.requestedServices,
          lastVisit: c.lastVisit,
          lastConversationAt: c.lastConversationAt,
          preferredStylist: c.preferredStylist,
          favoriteServices: c.favoriteServices,
          uploadedAssets: c.uploadedAssets,
          campaignEligible: c.campaignEligible,
          consentWhatsapp: c.consentWhatsapp,
          notes: c.notes,
          aiSummary: c.aiSummary,
          lifecycleStage: c.lifecycleStage,
          serviceHistory: c.serviceHistory,
          avatarManualUrl: c.avatarManualUrl,
          avatarWhatsappUrl: c.avatarWhatsappUrl,
          avatarSource: c.avatarSource,
          lastAvatarSync: c.lastAvatarSync,
        },
      });
    }
  } catch (err) {
    console.warn("[customers/store] Prisma write failed:", err);
  }
}

export async function importCustomers(rows: CustomerImportRow[], tenantId?: string) {
  const customers = await readCustomers(tenantId);
  const now = new Date().toISOString();
  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const phone = normalizePhone(row.phone);
    if (!phone) continue;

    const existingIndex = customers.findIndex((customer) => customer.phone === phone);
    const existing = existingIndex >= 0 ? customers[existingIndex] : null;
    const requestedService = row.requestedService.trim().toLowerCase();
    const requestedServices = unique([...(existing?.requestedServices ?? []), requestedService]);
    const tags = unique([
      ...(existing?.tags ?? []),
      ...row.tags,
      row.consentWhatsapp ? "whatsapp-consent" : "no-whatsapp-consent",
      requestedService ? `${requestedService}-interest` : "",
    ]);

    const profile: CustomerProfile = {
      id: existing?.id ?? randomUUID(),
      phone,
      displayName: existing?.displayName || row.firstName || phone,
      firstName: row.firstName || existing?.firstName || firstNameFrom(existing?.displayName ?? ""),
      tags,
      interests: unique([...(existing?.interests ?? []), requestedService]),
      requestedServices,
      lastVisit: row.lastVisit ?? existing?.lastVisit ?? null,
      lastConversationAt: existing?.lastConversationAt ?? now,
      preferredStylist: existing?.preferredStylist ?? null,
      favoriteServices: unique([...(existing?.favoriteServices ?? []), requestedService]),
      uploadedAssets: existing?.uploadedAssets ?? [],
      campaignEligible: row.consentWhatsapp,
      consentWhatsapp: row.consentWhatsapp,
      notes: existing?.notes ?? "",
      aiSummary: requestedService
        ? `Imported campaign audience. Requested service: ${row.requestedService}.`
        : existing?.aiSummary ?? "Imported campaign audience.",
      lifecycleStage: existing?.lifecycleStage ?? "imported",
      serviceHistory: existing?.serviceHistory ?? [],
    };

    if (existingIndex >= 0) {
      customers[existingIndex] = profile;
      updated += 1;
    } else {
      customers.push(profile);
      created += 1;
    }
  }

  await writeCustomers(customers, tenantId);

  return {
    created,
    updated,
    total: customers.length,
    imported: created + updated,
    customers,
  };
}

export async function getCustomerByPhone(phone: string, tenantId?: string) {
  if (!tenantId) return null;

  try {
    const record = await prisma.customer.findUnique({
      where: { tenantId_phone: { tenantId, phone } },
    });
    return record ? fromPrismaCustomer(record) : null;
  } catch {
    return null;
  }
}

export async function upsertCustomerFromMessage(
  message: WhatsAppInternalMessage,
  tenantId?: string,
) {
  if (message.direction !== "inbound" || !tenantId) return null;

  // Get or create customer directly in Prisma
  const detected = detectCustomerIntents(message.content);
  const requestedServices = detected.map((intent) => intent.service);
  const tags = detected.flatMap((intent) => intent.tags);
  const timestamp = new Date(Number(message.timestamp) * 1000 || Date.now()).toISOString();

  try {
    const existing = await prisma.customer.findUnique({
      where: { tenantId_phone: { tenantId, phone: message.phone } },
    });

    const profile = {
      displayName: message.senderName,
      firstName: existing?.firstName || firstNameFrom(message.senderName),
      tags: unique([...(existing?.tags as string[] ?? []), ...tags]),
      interests: unique([...(existing?.interests as string[] ?? []), ...requestedServices]),
      requestedServices: unique([...(existing?.requestedServices as string[] ?? []), ...requestedServices]),
      lastConversationAt: timestamp,
      preferredStylist: existing?.preferredStylist ?? null,
      favoriteServices: unique([...(existing?.favoriteServices as string[] ?? []), ...requestedServices.slice(0, 1)]),
      campaignEligible: existing?.campaignEligible ?? false,
      consentWhatsapp: existing?.consentWhatsapp ?? false,
      notes: existing?.notes ?? "",
      aiSummary:
        requestedServices.length > 0
          ? `Interés detectado en ${requestedServices.join(", ")}.`
          : existing?.aiSummary ?? "",
      lifecycleStage: requestedServices.length > 0 ? "lead" : (existing?.lifecycleStage ?? "new"),
    };

    const customer = await prisma.customer.upsert({
      where: { tenantId_phone: { tenantId, phone: message.phone } },
      create: {
        tenantId,
        phone: message.phone,
        ...profile,
        serviceHistory: [],
        uploadedAssets: [],
      },
      update: profile,
    });

    const result = fromPrismaCustomer(customer);

    for (const intent of detected) {
      await recordAnalyticsEvent({
        conversationId: message.conversationId,
        type: "intent_detected",
        metadata: {
          phone: message.phone,
          service: intent.service,
          messageId: message.id,
          tags: intent.tags,
        },
      });
    }

    return result;
  } catch (err) {
    console.warn("[customers/store] upsertCustomerFromMessage failed:", err);
    return null;
  }
}

export async function addCustomerAsset(phone: string, assetId: string, tenantId?: string) {
  if (!tenantId) return null;

  try {
    const existing = await prisma.customer.findUnique({
      where: { tenantId_phone: { tenantId, phone } },
      select: { uploadedAssets: true, tags: true },
    });

    if (!existing) return null;

    const assets = unique([...(existing.uploadedAssets as string[] ?? []), assetId]);
    const tags = unique([...(existing.tags as string[] ?? []), "sent-photo"]);

    const updated = await prisma.customer.update({
      where: { tenantId_phone: { tenantId, phone } },
      data: { uploadedAssets: assets, tags },
    });

    return fromPrismaCustomer(updated);
  } catch (err) {
    console.warn("[customers/store] addCustomerAsset failed:", err);
    return null;
  }
}

export async function getCustomerSegments(tenantId?: string) {
  const customers = await readCustomers(tenantId);
  const olderThan30 = new Date();
  olderThan30.setDate(olderThan30.getDate() - 30);

  return [
    { id: "interested-balayage", label: "Interesados en balayage", customers: customers.filter((c) => c.requestedServices.includes("balayage")) },
    { id: "interested-color", label: "Interesados en color", customers: customers.filter((c) => c.requestedServices.includes("color")) },
    { id: "sent-photo", label: "Clientas que enviaron foto", customers: customers.filter((c) => c.uploadedAssets.length > 0 || c.tags.includes("sent-photo")) },
    { id: "no-booking", label: "Clientas sin reserva", customers: customers.filter((c) => !c.lastVisit) },
    { id: "vip", label: "Clientas VIP", customers: customers.filter((c) => c.tags.includes("vip")) },
    { id: "inactive-30", label: "Última visita > 30 días", customers: customers.filter((c) => c.lastVisit && new Date(c.lastVisit) < olderThan30) },
  ];
}

// ── Helpers ─────────────────────────────────────────────────────

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function firstNameFrom(name: string) {
  const first = name.trim().split(/\s+/)[0] ?? "";
  return /^[a-zA-ZÁÉÍÓÚÜÑáéíóúüñ]{2,18}$/.test(first) ? first : "";
}

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
}

export function detectCustomerIntents(text: string) {
  const matches = matchTextToServices(
    text,
    serviceIntentKeywords.map((intent) => ({
      ...intent,
      id: intent.service,
    })),
  );
  const ids = new Set(matches.map((service: any) => service.id));
  return serviceIntentKeywords.filter((intent) => ids.has(intent.id));
}

// ── Intent detection data ───────────────────────────────────────

const intentKeywords = [
  { service: "balayage", tags: ["balayage", "color", "lead-hot"], keywords: ["balayage", "mechas", "rubio", "iluminar"] },
  { service: "color", tags: ["color", "lead-hot"], keywords: ["color", "coloración", "tintura"] },
  { service: "corte", tags: ["corte", "lead"], keywords: ["corte", "capas", "flequillo"] },
  { service: "lavado", tags: ["lavado", "lead"], keywords: ["lavado", "shampoo"] },
  { service: "hidratación", tags: ["hidratacion", "wellness", "lead"], keywords: ["hidratación", "hidratacion", "frizz", "seco"] },
  { service: "gloss", tags: ["gloss", "color", "lead"], keywords: ["gloss", "brillo"] },
  { service: "alisado", tags: ["alisado", "lead-hot"], keywords: ["alisado", "keratina"] },
];

const serviceIntentKeywords = intentKeywords.map((intent) => ({
  ...intent,
  id: intent.service === "hidratación" ? "hidratacion" : intent.service,
}));
