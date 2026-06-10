// ================================================================
// api/admin/tenants/route.ts — CRUD de tenants (Super Admin)
// GET  /api/admin/tenants → listar todos los tenants
// POST /api/admin/tenants → crear nuevo tenant
// ================================================================

import { NextResponse, type NextRequest } from "next/server";
import { requireSuperAdmin } from "@/lib/admin-helper";
import { createClient } from "@supabase/supabase-js";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { user, error } = await requireSuperAdmin(request);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const includeDeleted = searchParams.get("includeDeleted") === "true";
    const status = searchParams.get("status"); // active | trial | expired | suspended | cancelled

    const where: any = {};
    if (!includeDeleted) where.deletedAt = null;
    if (status) where.licenseStatus = status;

    const tenants = await prisma.tenant.findMany({
      where,
      include: {
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: { userTenants: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Add owner info (first user_tenant with role=owner)
    const enriched = await Promise.all(
      tenants.map(async (t: any) => {
        const owner = await prisma.userTenant.findFirst({
          where: { tenantId: t.id, role: "owner" },
          include: { user: { select: { name: true, email: true } } },
        });
        return {
          ...t,
          ownerName: owner?.user?.name || t.ownerName || null,
          ownerEmail: owner?.user?.email || t.ownerEmail || null,
        };
      }),
    );

    return NextResponse.json({ tenants: enriched });
  } catch (err: any) {
    console.error("[admin/tenants] GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { user: adminUser, error } = await requireSuperAdmin(request);
  if (error) return error;

  try {
    const body = await request.json();
    const {
      slug,
      businessName,
      businessType,
      ownerName,
      ownerEmail,
      ownerPhone,
      logoUrl,
      bannerUrl,
      faviconUrl,
      primaryColor,
      secondaryColor,
      timezone,
      language,
      planId,
      licenseExpiresAt,
    } = body;

    if (!slug || !businessName) {
      return NextResponse.json(
        { error: "slug y businessName son requeridos." },
        { status: 400 },
      );
    }

    if (!ownerEmail) {
      return NextResponse.json(
        { error: "ownerEmail es requerido para crear el usuario owner." },
        { status: 400 },
      );
    }

    // Check slug uniqueness
    const existing = await prisma.tenant.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: `El slug "${slug}" ya está en uso.` },
        { status: 409 },
      );
    }

    // Determine plan
    const plan = planId
      ? await prisma.plan.findUnique({ where: { id: planId } })
      : await prisma.plan.findFirst({ orderBy: { monthlyPriceClp: "asc" } });

    if (!plan) {
      return NextResponse.json(
        { error: "No se encontró un plan. Crea un plan primero." },
        { status: 400 },
      );
    }

    // Generate temporal password
    const temporalPassword =
      "Temp" +
      Math.random().toString(36).slice(2, 8) +
      Math.random().toString(10).slice(2, 6) +
      "!";

    // Calculate license expiry
    const expiry = licenseExpiresAt
      ? new Date(licenseExpiresAt)
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year default

    // Create Supabase auth user for the owner
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: ownerEmail,
        password: temporalPassword,
        email_confirm: true,
        user_metadata: { name: ownerName || businessName },
        app_metadata: {
          tenant_id: null, // Will be set after tenant creation
          role: "owner",
          is_super_admin: false,
        },
      });

    if (authError) {
      return NextResponse.json(
        { error: `Error creando usuario en Supabase: ${authError.message}` },
        { status: 500 },
      );
    }

    // Create everything in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Tenant with all branding/config fields
      const tenant = await tx.tenant.create({
        data: {
          slug,
          businessName,
          businessType: businessType || "salon",
          ownerName,
          ownerEmail,
          ownerPhone,
          logoUrl: logoUrl || null,
          bannerUrl: bannerUrl || null,
          faviconUrl: faviconUrl || null,
          primaryColor: primaryColor || "#7c5cff",
          secondaryColor: secondaryColor || "#1a1a2e",
          timezone: timezone || "America/Santiago",
          language: language || "es",
          licenseStatus: "active",
          licenseExpiresAt: expiry,
        },
      });

      // 1b. Create default BusinessSettings
      await tx.businessSettings.create({
        data: {
          tenantId: tenant.id,
          businessHours: {
            weeklyHours: [
              { day: "Monday", open: "10:00", close: "19:00", closed: false },
              { day: "Tuesday", open: "10:00", close: "19:00", closed: false },
              { day: "Wednesday", open: "10:00", close: "19:00", closed: false },
              { day: "Thursday", open: "10:00", close: "19:00", closed: false },
              { day: "Friday", open: "10:00", close: "19:00", closed: false },
              { day: "Saturday", open: "10:00", close: "16:00", closed: false },
              { day: "Sunday", open: "", close: "", closed: true },
            ],
            holidays: [],
            lunchBreak: "14:00-15:00",
            lastAcceptedTime: "17:30",
            minimumBufferMinutes: 15,
            latePolicy: "Se conserva la reserva con 10 minutos de tolerancia.",
          },
          services: [],
          stylists: [],
          brandTone: "Profesional y cálido, con atención personalizada.",
          shortDescription: `${businessName} — Tu salón de belleza.`,
          mainPromise: "Crear experiencias de belleza cuidadas, luminosas y memorables.",
        },
      });

      // 1c. Create default AiSettings
      await tx.aiSettings.create({
        data: {
          tenantId: tenant.id,
          autoReplyEnabled: true,
          aiMode: "automatic",
          aiRules: [],
          supportFeedRules: [],
          bookingRules: [],
          availabilityRules: [],
        },
      });

      // 2. Create local user
      const localUser = await tx.user.create({
        data: {
          supabaseId: authData.user!.id,
          email: ownerEmail,
          name: ownerName || businessName,
          mustChangePassword: true,
        },
      });

      // 3. Link user to tenant as owner
      await tx.userTenant.create({
        data: {
          userId: localUser.id,
          tenantId: tenant.id,
          role: "owner",
        },
      });

      // 4. Create subscription
      const subscription = await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          planId: plan.id,
          status: "active",
          paymentStatus: "paid",
          currentPeriodEnd: expiry,
        },
        include: { plan: true },
      });

      // Update Supabase auth user with tenant_id
      await supabaseAdmin.auth.admin.updateUserById(authData.user!.id, {
        app_metadata: {
          tenant_id: tenant.id,
          role: "owner",
          is_super_admin: false,
          business_name: businessName,
          slug: slug,
        },
      });

      return { tenant, user: localUser, subscription };
    });

    return NextResponse.json(
      {
        tenant: result.tenant,
        user: { email: result.user.email, name: result.user.name },
        temporalPassword,
        subscription: {
          plan: { name: result.subscription.plan.name },
          status: result.subscription.status,
        },
      },
      { status: 201 },
    );
  } catch (err: any) {
    console.error("[admin/tenants] POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
