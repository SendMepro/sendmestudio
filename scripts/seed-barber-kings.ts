// ================================================================
// scripts/seed-barber-kings.ts — Crear tenant de prueba Barber Kings
// Crea un segundo tenant con datos de prueba para verificar aislamiento.
// Idempotente: si ya existe, salta sin errores.
// Ejecutar: npx tsx scripts/seed-barber-kings.ts
// ================================================================

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Cargar entorno
const prismaEnvPath = path.join(process.cwd(), "prisma", ".env");
const localEnvPath = path.join(process.cwd(), ".env.local");

if (fs.existsSync(prismaEnvPath)) {
  dotenv.config({ path: prismaEnvPath });
  dotenv.config({ path: localEnvPath });
} else {
  dotenv.config({ path: localEnvPath });
}

const prisma = new PrismaClient();
const TENANT_SLUG = "barber-kings";
const BARBER_EMAIL = "admin@barberkings.cl";
const BARBER_PASSWORD = "Barber2026!";

async function main() {
  console.log("🌱 Seed Barber Kings: Iniciando...\n");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Faltan variables de entorno Supabase.");
    process.exit(1);
  }

  // ── 1. Crear/verificar tenant ──
  let tenant = await prisma.tenant.findUnique({ where: { slug: TENANT_SLUG } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        slug: TENANT_SLUG,
        businessName: "Barber Kings Studio",
        businessType: "barberia",
        ownerName: "Carlos Muñoz",
        ownerEmail: BARBER_EMAIL,
        ownerPhone: "+56912345678",
        primaryColor: "#1a1a2e",
        secondaryColor: "#c9a84c",
        timezone: "America/Santiago",
        language: "es",
        isActive: true,
        licenseStatus: "active",
        licenseExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
    console.log(`  ✅ Tenant "${tenant.businessName}" creado`);
  } else {
    console.log(`  ℹ️  Tenant "${TENANT_SLUG}" ya existe`);
  }

  // ── 2. Crear BusinessSettings ──
  const existingBs = await prisma.businessSettings.findUnique({
    where: { tenantId: tenant.id },
  });
  if (!existingBs) {
    await prisma.businessSettings.create({
      data: {
        tenantId: tenant.id,
        businessHours: {
          weeklyHours: [
            { day: "Monday", open: "09:00", close: "20:00", closed: false },
            { day: "Tuesday", open: "09:00", close: "20:00", closed: false },
            { day: "Wednesday", open: "09:00", close: "20:00", closed: false },
            { day: "Thursday", open: "09:00", close: "20:00", closed: false },
            { day: "Friday", open: "09:00", close: "20:00", closed: false },
            { day: "Saturday", open: "10:00", close: "18:00", closed: false },
            { day: "Sunday", open: "", close: "", closed: true },
          ],
          lunchBreak: "14:00-15:00",
          lastAcceptedTime: "18:30",
          minimumBufferMinutes: 15,
          latePolicy: "Se conserva la reserva con 10 minutos de tolerancia.",
        },
        services: [
          {
            id: "corte-caballero",
            name: "Corte Caballero",
            category: "Corte",
            description: "Corte personalizado con máquina y tijera, incluye lavado y styling.",
            priceFrom: 15000,
            priceTo: 25000,
            durationMinutes: 45,
          },
          {
            id: "corte-infantil",
            name: "Corte Infantil",
            category: "Corte",
            description: "Corte para niños hasta 12 años.",
            priceFrom: 10000,
            priceTo: 15000,
            durationMinutes: 30,
          },
          {
            id: "arreglo-barba",
            name: "Arreglo de Barba",
            category: "Barba",
            description: "Perfilado de barba con máquina y tijera, incluye toalla caliente.",
            priceFrom: 8000,
            priceTo: 12000,
            durationMinutes: 25,
          },
          {
            id: "corte-barba-combo",
            name: "Corte + Barba Combo",
            category: "Combo",
            description: "Corte de cabello + arreglo de barba completo.",
            priceFrom: 22000,
            priceTo: 35000,
            durationMinutes: 60,
          },
        ],
        stylists: [
          {
            id: "carlos",
            name: "Carlos",
            role: "Barbero Senior",
            specialties: ["Corte", "Barba", "Degradado"],
            active: true,
            color: "#1a1a2e",
          },
          {
            id: "pedro",
            name: "Pedro",
            role: "Barbero",
            specialties: ["Corte", "Barba"],
            active: true,
            color: "#c9a84c",
          },
        ],
        brandTone: "Profesional, masculino, directo y confiable.",
        shortDescription: "Barbería moderna con estilo clásico.",
        mainPromise: "Cortes precisos, barbas impecables, estilo imparable.",
      },
    });
    console.log(`  ✅ BusinessSettings creados para Barber Kings`);
  } else {
    console.log(`  ℹ️  BusinessSettings ya existen`);
  }

  // ── 3. Crear AI Settings ──
  const existingAi = await prisma.aiSettings.findUnique({
    where: { tenantId: tenant.id },
  });
  if (!existingAi) {
    await prisma.aiSettings.create({
      data: {
        tenantId: tenant.id,
        autoReplyEnabled: true,
        aiMode: "automatic",
        aiRules: [
          { rule: "always_book", description: "Siempre intentar agendar si el cliente muestra interés" },
          { rule: "confirm_before", description: "Confirmar disponibilidad antes de agendar" },
        ],
        monthlyAiRequests: 0,
        monthlyAiBudget: 50000,
      },
    });
    console.log(`  ✅ AI Settings creados`);
  }

  // ── 4. Crear Customers de prueba ──
  const testCustomers = [
    { phone: "56911111111", displayName: "Juan Pérez", firstName: "Juan", tags: ["vip", "corte"], lifecycleStage: "active" },
    { phone: "56922222222", displayName: "Diego González", firstName: "Diego", tags: ["barba"], lifecycleStage: "active" },
    { phone: "56933333333", displayName: "Andrés Silva", firstName: "Andrés", tags: ["nuevo"], lifecycleStage: "new" },
    { phone: "56944444444", displayName: "Matías Rojas", firstName: "Matías", tags: ["vip", "combo"], lifecycleStage: "active" },
    { phone: "56955555555", displayName: "Felipe Soto", firstName: "Felipe", tags: ["inactivo"], lifecycleStage: "dormant" },
  ];

  let customerCount = 0;
  for (const c of testCustomers) {
    const existing = await prisma.customer.findUnique({
      where: { tenantId_phone: { tenantId: tenant.id, phone: c.phone } },
    });
    if (!existing) {
      await prisma.customer.create({
        data: {
          tenantId: tenant.id,
          ...c,
          tags: c.tags,
          interests: [],
          requestedServices: [],
          favoriteServices: [],
          uploadedAssets: [],
          campaignEligible: true,
          consentWhatsapp: true,
          notes: "",
          lifecycleStage: c.lifecycleStage,
          serviceHistory: [],
        },
      });
      customerCount++;
    }
  }
  console.log(`  ✅ ${customerCount} clientes creados`);

  // ── 5. Crear Appointments de prueba ──
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const tomorrowStr = new Date(today.getTime() + 86400000).toISOString().split("T")[0];

  const testAppointments = [
    { customerName: "Juan Pérez", customerPhone: "56911111111", service: "Corte Caballero", stylist: "Carlos", date: todayStr, time: "10:00", durationMinutes: 45, status: "confirmed" },
    { customerName: "Diego González", customerPhone: "56922222222", service: "Arreglo de Barba", stylist: "Pedro", date: todayStr, time: "11:30", durationMinutes: 25, status: "confirmed" },
    { customerName: "Andrés Silva", customerPhone: "56933333333", service: "Corte + Barba Combo", stylist: "Carlos", date: tomorrowStr, time: "15:00", durationMinutes: 60, status: "pending" },
    { customerName: "Matías Rojas", customerPhone: "56944444444", service: "Corte Caballero", stylist: "Pedro", date: tomorrowStr, time: "16:30", durationMinutes: 45, status: "confirmed" },
  ];

  let appointmentCount = 0;
  for (const a of testAppointments) {
    await prisma.appointment.create({
      data: {
        tenantId: tenant.id,
        ...a,
        source: "manual",
        endTime: computeEndTime(a.time, a.durationMinutes),
      },
    });
    appointmentCount++;
  }
  console.log(`  ✅ ${appointmentCount} citas creadas`);

  // ── 6. Crear Campaign de prueba ──
  const existingCamp = await prisma.campaign.findFirst({
    where: { tenantId: tenant.id, name: "Reactiva tu estilo" },
  });
  if (!existingCamp) {
    await prisma.campaign.create({
      data: {
        tenantId: tenant.id,
        name: "Reactiva tu estilo",
        type: "reactivacion",
        status: "draft",
        description: "Campaña de reactivación para clientes que no visitan hace 60+ días",
        targetCount: 2,
        estimatedMessages: 4,
      },
    });
    console.log(`  ✅ Campaña de prueba creada`);
  }

  // ── 7. Crear Knowledge Items ──
  const existingKi = await prisma.knowledgeItem.findFirst({
    where: { tenantId: tenant.id, section: "salonProfile" },
  });
  if (!existingKi) {
    await prisma.knowledgeItem.create({
      data: {
        tenantId: tenant.id,
        section: "salonProfile",
        data: {
          salonName: "Barber Kings Studio",
          address: "Av. Principal 123",
          city: "Santiago",
          phone: "+56912345678",
          brandTone: "Profesional, masculino, directo y confiable.",
          salonType: "Barbería",
          shortDescription: "Barbería moderna con estilo clásico.",
          mainPromise: "Cortes precisos, barbas impecables, estilo imparable.",
        },
      },
    });

    await prisma.knowledgeItem.create({
      data: {
        tenantId: tenant.id,
        section: "services",
        data: [
          { id: "corte-caballero", name: "Corte Caballero", priceFrom: 15000, durationMinutes: 45 },
          { id: "arreglo-barba", name: "Arreglo de Barba", priceFrom: 8000, durationMinutes: 25 },
          { id: "corte-barba-combo", name: "Corte + Barba Combo", priceFrom: 22000, durationMinutes: 60 },
        ],
      },
    });
    console.log(`  ✅ Knowledge Items creados`);
  }

  // ── 8. Crear usuario en Supabase Auth ──
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let authUserId: string | null = null;
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingAuthUser = existingUsers?.users.find(
    (u) => u.email === BARBER_EMAIL,
  );

  if (existingAuthUser) {
    authUserId = existingAuthUser.id;
    console.log(`  ℹ️  Usuario "${BARBER_EMAIL}" ya existe en Supabase Auth`);
  } else {
    console.log(`  🔐 Creando usuario "${BARBER_EMAIL}" en Supabase Auth...`);
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: BARBER_EMAIL,
        password: BARBER_PASSWORD,
        email_confirm: true,
        user_metadata: {
          business_name: "Barber Kings Studio",
          owner_name: "Carlos Muñoz",
        },
        app_metadata: {
          tenant_id: tenant.id,
          role: "owner",
          business_name: "Barber Kings Studio",
          slug: TENANT_SLUG,
        },
      });

    if (authError) {
      console.error(`  ❌ Error creando usuario: ${authError.message}`);
    } else if (authData?.user) {
      authUserId = authData.user.id;
      console.log(`  ✅ Usuario creado en Supabase Auth`);
    }
  }

  // ── 9. Crear registro en public.users ──
  if (authUserId) {
    let localUser = await prisma.user.findUnique({
      where: { email: BARBER_EMAIL },
    });

    if (localUser) {
      console.log(`  ℹ️  Registro local en users ya existe`);
      if (localUser.supabaseId !== authUserId) {
        await prisma.user.update({
          where: { email: BARBER_EMAIL },
          data: { supabaseId: authUserId },
        });
      }
    } else {
      localUser = await prisma.user.create({
        data: {
          supabaseId: authUserId,
          email: BARBER_EMAIL,
          name: "Carlos Muñoz",
        },
      });
      console.log(`  ✅ Registro local en users creado`);
    }

    // ── 10. Crear vínculo user_tenants ──
    const existingLink = await prisma.userTenant.findUnique({
      where: { userId_tenantId: { userId: localUser.id, tenantId: tenant.id } },
    });

    if (!existingLink) {
      await prisma.userTenant.create({
        data: {
          userId: localUser.id,
          tenantId: tenant.id,
          role: "owner",
        },
      });
      console.log(`  ✅ Vínculo owner creado en user_tenants`);
    }
  }

  // ── Resumen ──
  const counts = await Promise.all([
    prisma.customer.count({ where: { tenantId: tenant.id } }),
    prisma.appointment.count({ where: { tenantId: tenant.id } }),
    prisma.campaign.count({ where: { tenantId: tenant.id } }),
    prisma.knowledgeItem.count({ where: { tenantId: tenant.id } }),
  ]);

  console.log("\n" + "=".repeat(60));
  console.log("  🎉 Seed Barber Kings completado!");
  console.log("=".repeat(60));
  console.log(`  Tenant:         ${TENANT_SLUG}`);
  console.log(`  Admin:          ${BARBER_EMAIL}`);
  console.log(`  Password:       ${BARBER_PASSWORD}`);
  console.log("─".repeat(60));
  console.log(`  Clientes:       ${counts[0]}`);
  console.log(`  Citas:          ${counts[1]}`);
  console.log(`  Campañas:       ${counts[2]}`);
  console.log(`  Knowledge:      ${counts[3]}`);
  console.log("=".repeat(60));
}

function computeEndTime(startTime: string, durationMinutes: number): string {
  const [h, m] = startTime.split(":").map(Number);
  const total = h * 60 + m + (durationMinutes || 60);
  const endH = Math.floor(total / 60);
  const endM = total % 60;
  return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
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
