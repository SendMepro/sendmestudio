// ================================================================
// api/auth/register/route.ts — Register endpoint
// Crea usuario en Supabase Auth, lo registra en nuestra tabla
// users, crea tenant, seed BusinessSettings + AiSettings,
// y aplica template automático según el tipo de negocio.
// ================================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { applyTemplate, getLatestTemplate, seedBuiltInTemplates } from "@/lib/vertical-templates";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Mapeo de businessType → slug del template built-in
const VERTICAL_TEMPLATE_SLUGS: Record<string, string> = {
  salon: "salon-belleza-v1",
  barber: "barberia-v1",
  spa: "spa-bienestar-v1",
  estetica: "centro-estetica-v1",
  clinica: "clinica-estetica-v1",
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      businessName,
      businessType = "salon",
      ownerName,
    } = body;

    if (!email || !password || !businessName) {
      return NextResponse.json(
        { error: "Email, contraseña y nombre del negocio son requeridos." },
        { status: 400 },
      );
    }

    // 1. Crear usuario en Supabase Auth
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          business_name: businessName,
          owner_name: ownerName || "",
        },
      },
    });

    if (authError) {
      console.error("[auth/register] Supabase error:", authError.message);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 },
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Error al crear usuario." },
        { status: 500 },
      );
    }

    // 2. Crear slug único para el tenant
    const slug = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80);

    // 3. Crear tenant en PostgreSQL
    const tenant = await prisma.tenant.create({
      data: {
        slug,
        businessName,
        businessType,
        ownerName: ownerName || null,
        ownerEmail: email,
      },
    });

    // 4. Crear usuario en nuestra tabla users
    const user = await prisma.user.create({
      data: {
        supabaseId: authData.user.id,
        email,
        name: ownerName || null,
      },
    });

    // 5. Vincular usuario con tenant como owner
    await prisma.userTenant.create({
      data: {
        userId: user.id,
        tenantId: tenant.id,
        role: "owner",
      },
    });

    // 6. Seed built-in templates si no existen
    await seedBuiltInTemplates();

    // 7. Crear BusinessSettings iniciales con datos del template
    const templateSlug = VERTICAL_TEMPLATE_SLUGS[businessType] || "salon-belleza-v1";
    const template = await getLatestTemplate(templateSlug);

    // Datos base para BusinessSettings
    const defaultBusinessHours = {
      monday: { isOpen: true, open: "09:00", close: "18:00" },
      tuesday: { isOpen: true, open: "09:00", close: "18:00" },
      wednesday: { isOpen: true, open: "09:00", close: "18:00" },
      thursday: { isOpen: true, open: "09:00", close: "18:00" },
      friday: { isOpen: true, open: "09:00", close: "18:00" },
      saturday: { isOpen: true, open: "10:00", close: "16:00" },
      sunday: { isOpen: false, open: "", close: "" },
    };

    // Si hay template, usar sus datos
    const templateConfig = template?.config as any;
    const servicesData = templateConfig?.services || [];
    const stylistsData = templateConfig?.stylists || [];
    const hoursData = templateConfig?.businessHours || {};
    const brandingData = templateConfig?.branding || {};
    const settingsData = templateConfig?.businessSettings || {};
    const policiesData = templateConfig?.policies || {};

    await prisma.businessSettings.create({
      data: {
        tenantId: tenant.id,
        services: servicesData,
        stylists: stylistsData,
        businessHours: hoursData.weeklyHours
          ? hoursData.weeklyHours.reduce((acc: any, h: any) => {
              const dayKey = h.day?.toLowerCase() || "";
              if (dayKey) acc[dayKey] = { isOpen: !h.closed, open: h.open || "09:00", close: h.close || "18:00" };
              return acc;
            }, {})
          : defaultBusinessHours,
        brandTone: settingsData.brandTone || "",
        shortDescription: settingsData.shortDescription || "",
        mainPromise: settingsData.mainPromise || "",
        latePolicy: hoursData.latePolicy || policiesData.latePolicy || "",
        minimumBufferMinutes: hoursData.minimumBufferMinutes || 15,
        lunchBreak: hoursData.lunchBreak || "",
        lastAcceptedTime: hoursData.lastAcceptedTime || "",
      },
    });

    // 8. Crear AiSettings iniciales
    const aiConfig = templateConfig?.ai || {};
    await prisma.aiSettings.create({
      data: {
        tenantId: tenant.id,
        autoReplyEnabled: aiConfig.autoReplyEnabled ?? true,
        aiMode: aiConfig.aiMode || "automatic",
        aiRules: aiConfig.aiRules || [],
        bookingRules: aiConfig.bookingRules || [],
        availabilityRules: aiConfig.availabilityRules || [],
      },
    });

    // 9. Aplicar template automáticamente si existe
    if (template) {
      try {
        // Actualizar tenant branding
        if (brandingData.primaryColor) {
          await prisma.tenant.update({
            where: { id: tenant.id },
            data: {
              primaryColor: brandingData.primaryColor,
              secondaryColor: brandingData.secondaryColor || "#1a1a2e",
              tagline: brandingData.tagline || "",
              templateId: template.id,
              templateVersion: template.version,
            },
          });
        }

        // Seed FAQs del template
        const faqs = templateConfig?.knowledge?.faqs || [];
        if (faqs.length > 0) {
          await prisma.knowledgeItem.create({
            data: {
              tenantId: tenant.id,
              section: "faqs",
              key: "faqs",
              data: { faqs },
              sortOrder: 0,
            },
          });
        }

        // Seed salonProfile
        const salonProfile = templateConfig?.knowledge?.salonProfile;
        if (salonProfile) {
          await prisma.knowledgeItem.create({
            data: {
              tenantId: tenant.id,
              section: "salonProfile",
              key: "profile",
              data: salonProfile as any,
              sortOrder: 1,
            },
          });
        }
      } catch (templateErr) {
        console.error("[auth/register] Error applying template:", templateErr);
        // No bloquear el registro si falla el template
      }
    }

    // 10. Actualizar app_metadata en Supabase con tenant_id y role
    await supabase.auth.admin.updateUserById(authData.user.id, {
      app_metadata: {
        tenant_id: tenant.id,
        role: "owner",
        business_name: businessName,
        slug,
        business_type: businessType,
      },
    });

    return NextResponse.json({
      ok: true,
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        businessName: tenant.businessName,
      },
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("[auth/register] Unexpected:", err);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 },
    );
  }
}
