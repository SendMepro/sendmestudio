// ================================================================
// scripts/seed.ts — Seed inicial
// Crea tenant "Maite Guerra Beauty Studio", plan premium, usuario admin.
// Idempotente: si ya existe, salta sin errores.
// Ejecutar: npx tsx scripts/seed.ts
// ================================================================

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Cargar entorno: Prisma busca prisma/.env, fallback a .env.local
const prismaEnvPath = path.join(process.cwd(), "prisma", ".env");
const localEnvPath = path.join(process.cwd(), ".env.local");

if (fs.existsSync(prismaEnvPath)) {
  dotenv.config({ path: prismaEnvPath });
  // Sobrescribir con .env.local para SUPABASE_SERVICE_ROLE_KEY
  dotenv.config({ path: localEnvPath });
} else {
  dotenv.config({ path: localEnvPath });
}

const prisma = new PrismaClient();
const ADMIN_EMAIL = "admin@sendmestudio.cl";
const ADMIN_PASSWORD = "Admin2026!";
const TENANT_SLUG = "maite-guerra";

// ── Helpers ──────────────────────────────────────────────────────

async function ensurePlan(name: string, price: number, features: any, limits: any) {
  let plan = await prisma.plan.findFirst({ where: { name } });
  if (!plan) {
    plan = await prisma.plan.create({
      data: { name, monthlyPriceClp: price, features, limits },
    });
    console.log(`  ✅ Plan "${name}" creado`);
  } else {
    console.log(`  ℹ️  Plan "${name}" ya existe (ID: ${plan.id.slice(0, 8)}…)`);
  }
  return plan;
}

async function main() {
  console.log("🌱 Seed: Iniciando...\n");

  // ── 1. Verificar entorno ──
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Faltan variables de entorno Supabase.");
    console.error("   Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY");
    console.error("   en .env.local o prisma/.env");
    process.exit(1);
  }

  // ── 2. Crear/verificar tenant ──
  let tenant = await prisma.tenant.findUnique({ where: { slug: TENANT_SLUG } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        slug: TENANT_SLUG,
        businessName: "Maite Guerra Beauty Studio",
        businessType: "salon",
        ownerName: "Maite Guerra",
        ownerEmail: ADMIN_EMAIL,
        ownerPhone: "+56929103822",
        isActive: true,
        licenseStatus: "active",
        licenseExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año
      },
    });
    console.log(`  ✅ Tenant "${tenant.businessName}" creado`);
  } else {
    console.log(`  ℹ️  Tenant "${TENANT_SLUG}" ya existe`);
  }

  // ── 3. Crear/verificar planes ──
  const premium = await ensurePlan("premium", 89900,
    { whatsapp: true, aiReceptionist: true, campaigns: true, growthEngine: true, customerMemory: true, agenda: true, reports: true, teamManagement: true },
    { monthlyAiRequests: 5000, monthlyCampaigns: 50, maxUsers: 15, maxBranches: 3 },
  );

  await ensurePlan("basic", 29900,
    { whatsapp: true, aiReceptionist: false, campaigns: false, growthEngine: false, customerMemory: false, agenda: true, reports: false, teamManagement: false },
    { monthlyAiRequests: 0, monthlyCampaigns: 0, maxUsers: 3, maxBranches: 1 },
  );

  await ensurePlan("pro", 59900,
    { whatsapp: true, aiReceptionist: false, campaigns: true, growthEngine: false, customerMemory: true, agenda: true, reports: true, teamManagement: false },
    { monthlyAiRequests: 2000, monthlyCampaigns: 20, maxUsers: 8, maxBranches: 1 },
  );

  // ── 4. Crear/verificar suscripción ──
  const existingSub = await prisma.subscription.findFirst({
    where: { tenantId: tenant.id, planId: premium.id },
  });
  if (!existingSub) {
    await prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        planId: premium.id,
        status: "active",
        paymentStatus: "paid",
        startDate: new Date("2024-06-01"),
        nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    console.log(`  ✅ Suscripción premium creada`);
  } else {
    console.log(`  ℹ️  Suscripción premium ya existe`);
  }

  // ── 5. Crear/verificar usuario admin en Supabase Auth ──
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Buscar si ya existe en Supabase Auth
  let authUserId: string | null = null;
  const { data: existingUsers } = await supabase.auth.admin.listUsers();

  const existingAuthUser = existingUsers?.users.find(
    (u) => u.email === ADMIN_EMAIL,
  );

  if (existingAuthUser) {
    authUserId = existingAuthUser.id;
    console.log(`  ℹ️  Usuario "${ADMIN_EMAIL}" ya existe en Supabase Auth`);
  } else {
    console.log(`  🔐 Creando usuario "${ADMIN_EMAIL}" en Supabase Auth...`);
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: {
          business_name: "Maite Guerra Beauty Studio",
          owner_name: "Maite Guerra",
        },
        app_metadata: {
          tenant_id: tenant.id,
          role: "owner",
          business_name: "Maite Guerra Beauty Studio",
          slug: TENANT_SLUG,
        },
      });

    if (authError) {
      console.error(`  ❌ Error creando usuario Supabase: ${authError.message}`);
      console.error(`     El seed no puede continuar sin el usuario admin.`);
      process.exit(1);
    }

    if (authData?.user) {
      authUserId = authData.user.id;
      console.log(`  ✅ Usuario admin creado en Supabase Auth (ID: ${authUserId.slice(0, 8)}…)`);
    }
  }

  if (!authUserId) {
    console.error("❌ No se pudo obtener el ID del usuario admin. Abortando.");
    process.exit(1);
  }

  // ── 6. Crear/verificar registro en public.users ──
  // NOTA: user_tenants.user_id apunta a users.id (el UUID de nuestra tabla),
  // NO a supabase_id. Primero creamos el user local y obtenemos su PK.
  let localUser = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (localUser) {
    console.log(`  ℹ️  Registro local en users ya existe (ID: ${localUser.id.slice(0, 8)}…)`);

    // Asegurar que tenga el supabase_id actualizado
    if (localUser.supabaseId !== authUserId) {
      localUser = await prisma.user.update({
        where: { email: ADMIN_EMAIL },
        data: { supabaseId: authUserId },
      });
      console.log(`  🔄 supabase_id actualizado en users`);
    }
  } else {
    localUser = await prisma.user.create({
      data: {
        supabaseId: authUserId,
        email: ADMIN_EMAIL,
        name: "Maite Guerra",
      },
    });
    console.log(`  ✅ Registro local en users creado (ID: ${localUser.id.slice(0, 8)}…)`);
  }

  // ── 7. Crear/verificar vínculo user_tenants ──
  // Usamos localUser.id (PK de users), NO authUserId (supabase_id)
  const existingLink = await prisma.userTenant.findUnique({
    where: { userId_tenantId: { userId: localUser.id, tenantId: tenant.id } },
  });

  if (existingLink) {
    console.log(`  ℹ️  Vínculo user_tenants ya existe (rol: ${existingLink.role})`);
  } else {
    await prisma.userTenant.create({
      data: {
        userId: localUser.id,
        tenantId: tenant.id,
        role: "owner",
      },
    });
    console.log(`  ✅ Vínculo owner creado en user_tenants`);
  }

  // ── 8. Crear/verificar Super Admin ──
  const SUPER_ADMIN_EMAIL = "super@sendmestudio.cl";
  const SUPER_ADMIN_PASSWORD = "SuperAdmin2026!";

  let superAuthUserId: string | null = null;
  const existingSuperUser = await prisma.user.findUnique({
    where: { email: SUPER_ADMIN_EMAIL },
  });

  if (existingSuperUser) {
    console.log(`  ℹ️  Super Admin "${SUPER_ADMIN_EMAIL}" ya existe`);
  } else {
    // Buscar en Supabase Auth
    const { data: allUsers } = await supabase.auth.admin.listUsers();
    const existingAuthSuper = allUsers?.users.find(
      (u) => u.email === SUPER_ADMIN_EMAIL,
    );

    if (existingAuthSuper) {
      superAuthUserId = existingAuthSuper.id;
      console.log(`  ℹ️  Super Admin "${SUPER_ADMIN_EMAIL}" ya existe en Supabase Auth`);
    } else {
      console.log(`  🔐 Creando Super Admin "${SUPER_ADMIN_EMAIL}" en Supabase Auth...`);
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: SUPER_ADMIN_EMAIL,
          password: SUPER_ADMIN_PASSWORD,
          email_confirm: true,
          user_metadata: { name: "Super Admin SendMe Studio" },
          app_metadata: {
            is_super_admin: true,
            role: "super_admin",
          },
        });

      if (authError) {
        console.error(`  ❌ Error creando Super Admin: ${authError.message}`);
      } else if (authData?.user) {
        superAuthUserId = authData.user.id;
        console.log(`  ✅ Super Admin creado en Supabase Auth`);
      }
    }

    if (superAuthUserId) {
      await prisma.user.create({
        data: {
          supabaseId: superAuthUserId,
          email: SUPER_ADMIN_EMAIL,
          name: "Super Admin",
          isSuperAdmin: true,
          isActive: true,
        },
      });
      console.log(`  ✅ Registro local Super Admin creado`);
    }
  }

  // ── Resumen final ──
  console.log("\n" + "=".repeat(60));
  console.log("  🎉 Seed completado exitosamente!");
  console.log("=".repeat(60));
  console.log(`  Tenant:         ${TENANT_SLUG}`);
  console.log(`  Admin:          ${ADMIN_EMAIL}`);
  console.log(`  Password:       ${ADMIN_PASSWORD}`);
  console.log(`  Super Admin:    ${SUPER_ADMIN_EMAIL}`);
  console.log(`  Super Password: ${SUPER_ADMIN_PASSWORD}`);
  console.log(`  Rol:            owner (Maite Guerra)`);
  console.log(`  Plan:           premium`);
  console.log("─".repeat(60));
  console.log("  Próximo paso: npm run dev → login en /login");
  console.log("=".repeat(60));
}

main()
  .catch((e) => {
    console.error("❌ Seed falló:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
