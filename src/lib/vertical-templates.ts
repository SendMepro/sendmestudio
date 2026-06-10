// ================================================================
// lib/vertical-templates.ts — Vertical Templates library
// Core logic for applying templates, preview/diff, backups
// ================================================================

import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { BUILTIN_TEMPLATES, type TemplateSeed, type VerticalTemplateConfig } from "./vertical-templates/seed";

export type { TemplateSeed, VerticalTemplateConfig };

/**
 * Get all active templates, ordered by vertical and version
 */
export async function getAllTemplates() {
  return prisma.verticalTemplate.findMany({
    where: { isActive: true },
    orderBy: [{ vertical: "asc" }, { version: "desc" }],
  });
}

/**
 * Get a single template by ID
 */
export async function getTemplateById(id: string) {
  return prisma.verticalTemplate.findUnique({ where: { id } });
}

/**
 * Get the latest version of a template by slug
 */
export async function getLatestTemplate(slug: string) {
  return prisma.verticalTemplate.findFirst({
    where: { slug, isActive: true },
    orderBy: { version: "desc" },
  });
}

/**
 * Seed built-in templates (idempotent — skips existing slugs)
 */
export async function seedBuiltInTemplates() {
  const results: Array<{ slug: string; action: "created" | "skipped" | "updated" }> = [];

  for (const tpl of BUILTIN_TEMPLATES) {
    const existing = await prisma.verticalTemplate.findUnique({
      where: { slug: tpl.slug },
    });

    if (existing) {
      results.push({ slug: tpl.slug, action: "skipped" });
      continue;
    }

    await prisma.verticalTemplate.create({
      data: {
        slug: tpl.slug,
        name: tpl.name,
        version: tpl.version,
        vertical: tpl.vertical,
        description: tpl.description,
        config: tpl.config as any,
      },
    });
    results.push({ slug: tpl.slug, action: "created" });
  }

  return results;
}

// ── Snapshot & Backup ──

/**
 * Create a full snapshot of a tenant's current configuration
 */
export async function createTenantSnapshot(tenantId: string) {
  const [tenant, businessSettings, aiSettings, knowledgeItems] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: tenantId } }),
    prisma.businessSettings.findUnique({ where: { tenantId } }),
    prisma.aiSettings.findUnique({ where: { tenantId } }),
    prisma.knowledgeItem.findMany({
      where: { tenantId },
      select: { section: true, key: true, data: true, sortOrder: true },
    }),
  ]);

  return {
    tenant: tenant
      ? {
          businessName: tenant.businessName,
          businessType: tenant.businessType,
          ownerName: tenant.ownerName,
          logoUrl: tenant.logoUrl,
          bannerUrl: tenant.bannerUrl,
          primaryColor: tenant.primaryColor,
          secondaryColor: tenant.secondaryColor,
          faviconUrl: tenant.faviconUrl,
          tagline: tenant.tagline,
          timezone: tenant.timezone,
          language: tenant.language,
          templateId: tenant.templateId,
          templateVersion: tenant.templateVersion,
        }
      : null,
    businessSettings: businessSettings
      ? {
          businessHours: businessSettings.businessHours,
          services: businessSettings.services,
          stylists: businessSettings.stylists,
          holidays: businessSettings.holidays,
          lunchBreak: businessSettings.lunchBreak,
          lastAcceptedTime: businessSettings.lastAcceptedTime,
          minimumBufferMinutes: businessSettings.minimumBufferMinutes,
          latePolicy: businessSettings.latePolicy,
          brandTone: businessSettings.brandTone,
          shortDescription: businessSettings.shortDescription,
          mainPromise: businessSettings.mainPromise,
        }
      : null,
    aiSettings: aiSettings
      ? {
          autoReplyEnabled: aiSettings.autoReplyEnabled,
          aiMode: aiSettings.aiMode,
          aiRules: aiSettings.aiRules,
          bookingRules: aiSettings.bookingRules,
          availabilityRules: aiSettings.availabilityRules,
        }
      : null,
    knowledgeItems: knowledgeItems.map((k) => ({
      section: k.section,
      key: k.key,
      data: k.data,
      sortOrder: k.sortOrder,
    })),
  };
}

/**
 * Save a backup snapshot before applying a template
 */
export async function saveBackup(
  tenantId: string,
  templateId: string,
  version: string,
) {
  const snapshot = await createTenantSnapshot(tenantId);
  return prisma.tenantConfigBackup.create({
    data: {
      tenantId,
      templateId,
      version,
      snapshot: snapshot as any,
    },
  });
}

/**
 * Get all backups for a tenant
 */
export async function getTenantBackups(tenantId: string) {
  return prisma.tenantConfigBackup.findMany({
    where: { tenantId },
    orderBy: { appliedAt: "desc" },
    include: { template: { select: { name: true, slug: true, version: true } } },
  });
}

// ── Preview / Diff ──

type DiffCategory = "branding" | "services" | "stylists" | "faqs" | "ai" | "horarios" | "policies";

export interface DiffItem {
  category: DiffCategory;
  field: string;
  current: any;
  proposed: any;
  action: "add" | "update" | "remove" | "keep";
}

const CATEGORY_MAP: Record<string, DiffCategory> = {
  primaryColor: "branding",
  secondaryColor: "branding",
  tagline: "branding",
  brandTone: "branding",
  shortDescription: "branding",
  mainPromise: "branding",
  services: "services",
  stylists: "stylists",
  faqs: "faqs",
  autoReplyEnabled: "ai",
  aiMode: "ai",
  aiRules: "ai",
  bookingRules: "ai",
  availabilityRules: "ai",
  weeklyHours: "horarios",
  latePolicy: "policies",
  cancellationPolicy: "policies",
  welcomeMessage: "policies",
  businessHours: "horarios",
  lunchBreak: "horarios",
  lastAcceptedTime: "horarios",
  minimumBufferMinutes: "horarios",
};

/**
 * Generate a diff between a tenant's current config and a template
 */
export async function generatePreviewDiff(
  tenantId: string,
  templateId: string,
): Promise<DiffItem[]> {
  const template = await prisma.verticalTemplate.findUnique({
    where: { id: templateId },
  });
  if (!template) throw new Error("Template no encontrado.");

  const snapshot = await createTenantSnapshot(tenantId);
  const config = template.config as unknown as VerticalTemplateConfig;
  const diffs: DiffItem[] = [];

  // ── Branding ──
  if (snapshot.tenant) {
    const brandingFields: Array<{ field: string; getCurrent: () => any; getProposed: () => any }> = [
      { field: "primaryColor", getCurrent: () => snapshot.tenant!.primaryColor, getProposed: () => config.branding.primaryColor },
      { field: "secondaryColor", getCurrent: () => snapshot.tenant!.secondaryColor, getProposed: () => config.branding.secondaryColor },
      { field: "tagline", getCurrent: () => snapshot.tenant!.tagline || "", getProposed: () => config.branding.tagline },
    ];
    for (const f of brandingFields) {
      const c = f.getCurrent();
      const p = f.getProposed();
      if (c !== p) {
        diffs.push({ category: "branding", field: f.field, current: c, proposed: p, action: "update" });
      }
    }
  }

  // ── Business Settings ──
  if (snapshot.businessSettings) {
    const bsFields: Array<{ field: string; getCurrent: () => any; getProposed: () => any }> = [
      { field: "brandTone", getCurrent: () => snapshot.businessSettings!.brandTone || "", getProposed: () => config.businessSettings.brandTone },
      { field: "shortDescription", getCurrent: () => snapshot.businessSettings!.shortDescription || "", getProposed: () => config.businessSettings.shortDescription },
      { field: "mainPromise", getCurrent: () => snapshot.businessSettings!.mainPromise || "", getProposed: () => config.businessSettings.mainPromise },
    ];
    for (const f of bsFields) {
      const c = f.getCurrent();
      const p = f.getProposed();
      if (c !== p) {
        diffs.push({ category: "branding", field: f.field, current: c, proposed: p, action: "update" });
      }
    }

    // Services
    const currentServices = snapshot.businessSettings.services as any[] || [];
    const proposedServices = config.services || [];
    if (JSON.stringify(currentServices) !== JSON.stringify(proposedServices)) {
      diffs.push({
        category: "services",
        field: "services",
        current: currentServices.length,
        proposed: proposedServices.length,
        action: currentServices.length === 0 ? "add" : "update",
      });
    }

    // Stylists
    const currentStylists = snapshot.businessSettings.stylists as any[] || [];
    const proposedStylists = config.stylists || [];
    if (JSON.stringify(currentStylists) !== JSON.stringify(proposedStylists)) {
      diffs.push({
        category: "stylists",
        field: "stylists",
        current: currentStylists.length,
        proposed: proposedStylists.length,
        action: currentStylists.length === 0 ? "add" : "update",
      });
    }

    // Business Hours
    const currentHours = snapshot.businessSettings.businessHours as any || {};
    const proposedHours = config.businessHours || {};
    if (JSON.stringify(currentHours) !== JSON.stringify(proposedHours)) {
      diffs.push({
        category: "horarios",
        field: "businessHours",
        current: "Configuración actual",
        proposed: "Template propuesto",
        action: "update",
      });
    }

    // Late policy
    if (snapshot.businessSettings.latePolicy !== config.businessHours.latePolicy) {
      diffs.push({
        category: "policies",
        field: "latePolicy",
        current: snapshot.businessSettings.latePolicy || "",
        proposed: config.businessHours.latePolicy,
        action: "update",
      });
    }
  }

  // ── AI Settings ──
  if (snapshot.aiSettings) {
    const aiFields: Array<{ field: string; getCurrent: () => any; getProposed: () => any }> = [
      { field: "autoReplyEnabled", getCurrent: () => snapshot.aiSettings!.autoReplyEnabled, getProposed: () => config.ai.autoReplyEnabled },
      { field: "aiMode", getCurrent: () => snapshot.aiSettings!.aiMode, getProposed: () => config.ai.aiMode },
    ];
    for (const f of aiFields) {
      const c = f.getCurrent();
      const p = f.getProposed();
      if (c !== p) {
        diffs.push({ category: "ai", field: f.field, current: c, proposed: p, action: "update" });
      }
    }

    // AI Rules
    const currentAiRules = snapshot.aiSettings.aiRules as string[] || [];
    const proposedAiRules = config.ai.aiRules || [];
    if (JSON.stringify(currentAiRules) !== JSON.stringify(proposedAiRules)) {
      diffs.push({
        category: "ai",
        field: "aiRules",
        current: `${currentAiRules.length} reglas`,
        proposed: `${proposedAiRules.length} reglas`,
        action: "update",
      });
    }

    // Booking rules
    const currentBookingRules = snapshot.aiSettings.bookingRules as string[] || [];
    const proposedBookingRules = config.ai.bookingRules || [];
    if (JSON.stringify(currentBookingRules) !== JSON.stringify(proposedBookingRules)) {
      diffs.push({
        category: "ai",
        field: "bookingRules",
        current: `${currentBookingRules.length} reglas`,
        proposed: `${proposedBookingRules.length} reglas`,
        action: "update",
      });
    }
  }

  // ── Knowledge: FAQs ──
  const currentFaqs = snapshot.knowledgeItems
    .filter((k) => k.section === "faqs")
    .flatMap((k) => {
      const data = k.data as any;
      return data.faqs || data.items || [];
    });
  const proposedFaqs = config.knowledge?.faqs || [];
  if (currentFaqs.length === 0 && proposedFaqs.length > 0) {
    diffs.push({
      category: "faqs",
      field: "faqs",
      current: `${currentFaqs.length} FAQs`,
      proposed: `${proposedFaqs.length} FAQs`,
      action: "add",
    });
  } else if (proposedFaqs.length > 0 && JSON.stringify(currentFaqs) !== JSON.stringify(proposedFaqs)) {
    diffs.push({
      category: "faqs",
      field: "faqs",
      current: `${currentFaqs.length} FAQs`,
      proposed: `${proposedFaqs.length} FAQs`,
      action: "update",
    });
  }

  // ── Policies ──
  const proposals = config.policies || {};
  const polFields: Array<{ field: string; getCurrent: () => any; getProposed: () => any }> = [
    { field: "cancellationPolicy", getCurrent: () => snapshot.businessSettings?.latePolicy || "", getProposed: () => proposals.cancellationPolicy || "" },
    { field: "welcomeMessage", getCurrent: () => "", getProposed: () => proposals.welcomeMessage || "" },
  ];
  for (const f of polFields) {
    const c = f.getCurrent();
    const p = f.getProposed();
    if (c !== p && p) {
      diffs.push({ category: "policies", field: f.field, current: c, proposed: p, action: "add" });
    }
  }

  return diffs;
}

// ── Apply Template ──

export interface ApplyTemplateOptions {
  tenantId: string;
  templateId: string;
  mode: "merge" | "replace";
  categories?: DiffCategory[]; // If not specified, all categories
}

/**
 * Apply a VerticalTemplate to a tenant
 */
export async function applyTemplate(
  tenantId: string,
  templateId: string,
  mode: "merge" | "replace" = "merge",
  categories?: string[],
) {
  const template = await prisma.verticalTemplate.findUnique({
    where: { id: templateId },
  });
  if (!template) throw new Error("Template no encontrado.");

  const config = template.config as unknown as VerticalTemplateConfig;

  // 1. Create backup first
  const backup = await saveBackup(tenantId, templateId, template.version);

  // 2. Determine which categories to apply
  const applyAll = !categories || categories.length === 0;

  // 3. Apply changes in transaction
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // ── Tenant branding ──
    if (applyAll || categories!.includes("branding")) {
      const brandingUpdate: any = {};
      if (mode === "replace" || true) {
        brandingUpdate.primaryColor = config.branding.primaryColor;
        brandingUpdate.secondaryColor = config.branding.secondaryColor;
        brandingUpdate.tagline = config.branding.tagline;
      }
      brandingUpdate.templateId = template.id;
      brandingUpdate.templateVersion = template.version;

      await tx.tenant.update({
        where: { id: tenantId },
        data: brandingUpdate,
      });
    }

    // ── Business Settings ──
    const bsUpdate: any = {};
    let shouldUpdateBS = false;

    if (applyAll || categories!.includes("branding")) {
      bsUpdate.brandTone = config.businessSettings.brandTone;
      bsUpdate.shortDescription = config.businessSettings.shortDescription;
      bsUpdate.mainPromise = config.businessSettings.mainPromise;
      shouldUpdateBS = true;
    }

    if (applyAll || categories!.includes("services")) {
      bsUpdate.services = config.services;
      shouldUpdateBS = true;
    }

    if (applyAll || categories!.includes("stylists")) {
      bsUpdate.stylists = config.stylists;
      shouldUpdateBS = true;
    }

    if (applyAll || categories!.includes("horarios")) {
      bsUpdate.businessHours = config.businessHours;
      bsUpdate.latePolicy = config.businessHours.latePolicy;
      shouldUpdateBS = true;
    }

    if (applyAll || categories!.includes("policies")) {
      bsUpdate.latePolicy = config.policies?.latePolicy || config.businessHours.latePolicy;
      shouldUpdateBS = true;
    }

    if (shouldUpdateBS) {
      await tx.businessSettings.upsert({
        where: { tenantId },
        create: {
          tenantId,
          businessHours: config.businessHours || {},
          services: config.services || [],
          stylists: config.stylists || [],
          brandTone: config.businessSettings.brandTone || "",
          shortDescription: config.businessSettings.shortDescription || "",
          mainPromise: config.businessSettings.mainPromise || "",
        },
        update: bsUpdate,
      });
    }

    // ── AI Settings ──
    if (applyAll || categories!.includes("ai")) {
      await tx.aiSettings.upsert({
        where: { tenantId },
        create: {
          tenantId,
          autoReplyEnabled: config.ai.autoReplyEnabled,
          aiMode: config.ai.aiMode,
          aiRules: config.ai.aiRules,
          bookingRules: config.ai.bookingRules,
          availabilityRules: config.ai.availabilityRules,
        },
        update: {
          autoReplyEnabled: config.ai.autoReplyEnabled,
          aiMode: config.ai.aiMode,
          aiRules: config.ai.aiRules,
          bookingRules: config.ai.bookingRules,
          availabilityRules: config.ai.availabilityRules,
        },
      });
    }

    // ── Knowledge Items: FAQs ──
    if (applyAll || categories!.includes("faqs")) {
      const faqs = config.knowledge?.faqs || [];
      if (faqs.length > 0) {
        if (mode === "replace") {
          // Remove existing faqs
          await tx.knowledgeItem.deleteMany({
            where: { tenantId, section: "faqs" },
          });
        } else {
          // In merge mode, only add if empty
          const existingFaqs = await tx.knowledgeItem.findMany({
            where: { tenantId, section: "faqs" },
          });
          if (existingFaqs.length === 0) {
            await tx.knowledgeItem.create({
              data: {
                tenantId,
                section: "faqs",
                key: "faqs",
                data: { faqs },
                sortOrder: 0,
              },
            });
          }
        }
      }

      // AI Rules / Prompts — only in replace mode or if none exist
      const existingPrompts = await tx.knowledgeItem.findMany({
        where: { tenantId, section: "salonProfile" },
      });

      if (config.knowledge?.salonProfile && existingPrompts.length === 0) {
        await tx.knowledgeItem.create({
          data: {
            tenantId,
            section: "salonProfile",
            key: "profile",
            data: config.knowledge.salonProfile as any,
            sortOrder: 0,
          },
        });
      }
    }
  });

  return { backup, template };
}
