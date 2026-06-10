// ================================================================
// scripts/seed-demo-credentials.ts — Credenciales demo por tenant
// Crea/actualiza usuarios demo con roles y tenants claros.
// Idempotente: si ya existen, actualiza passwords y metadatos.
// Ejecutar: npx tsx scripts/seed-demo-credentials.ts
// ================================================================

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// ── Cargar entorno ──
const prismaEnvPath = path.join(process.cwd(), "prisma", ".env");
const localEnvPath = path.join(process.cwd(), ".env.local");

if (fs.existsSync(prismaEnvPath)) {
  dotenv.config({ path: prismaEnvPath });
  dotenv.config({ path: localEnvPath });
} else {
  dotenv.config({ path: localEnvPath });
}

const prisma = new PrismaClient();

// ── Definición de credenciales demo ──
interface DemoUser {
  label: string;
  email: string;
  password: string;
  role: "super_admin" | "owner" | "admin" | "staff" | "platform_admin";
  tenantSlug?: string;
  name: string;
  isSuperAdmin?: boolean;
}

const DEMO_USERS: DemoUser[] = [
  // ── Super Admin (plataforma, sin tenant) ──
  {
    label: "Super Admin Plataforma",
    email: "super@sendmestudio.cl",
    password: "SuperAdmin2026!",
    role: "super_admin",
    name: "Super Admin",
    isSuperAdmin: true,
  },
  // ── Platform Admin (admin de plataforma, sin tenant) ──
  {
    label: "Platform Admin",
    email: "admin.platform@sendmestudio.cl",
    password: "PlatformAdmin2026!",
    role: "platform_admin",
    name: "Platform Admin",
    isSuperAdmin: true,
  },
  // ── Maite Guerra Beauty Studio ──
  {
    label: "Owner Maite Guerra",
    email: "owner.maiteguerra@sendmestudio.cl",
    password: "MaiteOwner2026!",
    role: "owner",
    tenantSlug: "maite-guerra",
    name: "Maite Guerra",
  },
  {
    label: "Admin Maite Guerra",
    email: "admin.maiteguerra@sendmestudio.cl",
    password: "MaiteAdmin2026!",
    role: "admin",
    tenantSlug: "maite-guerra",
    name: "Admin Maite Guerra",
  },
  // ── Barber Kings Studio ──
  {
    label: "Owner Barber Kings",
    email: "owner.barberkings@sendmestudio.cl",
    password: "BarberOwner2026!",
    role: "owner",
    tenantSlug: "barber-kings",
    name: "Carlos Muñoz",
  },
  {
    label: "Admin Barber Kings",
    email: "admin.barberkings@sendmestudio.cl",
    password: "BarberAdmin2026!",
    role: "admin",
    tenantSlug: "barber-kings",
    name: "Admin Barber Kings",
  },
];

// ── Helpers ──

async function upsertSupabaseUser(
  supabase: any,
  email: string,
  password: string,
  userMetadata: Record<string, any>,
  appMetadata: Record<string, any>,
): Promise<string> {
  // Buscar si ya existe en Supabase Auth
  const { data: allUsers } = await supabase.auth.admin.listUsers();
  const existing = allUsers?.users.find((u: any) => u.email === email);

  if (existing) {
    // Actualizar password si cambió
    console.log(`  ℹ️  "${email}" ya existe en Supabase Auth`);
    await supabase.auth.admin.updateUserById(existing.id, {
      password,
      user_metadata: userMetadata,
      app_metadata: appMetadata,
    });
    console.log(`  🔄  Password/metadata actualizados`);
    return existing.id;
  }

  // Crear nuevo
  console.log(`  🔐  Creando "${email}" en Supabase Auth...`);
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: userMetadata,
    app_metadata: appMetadata,
  });

  if (error) {
    console.error(`  ❌  Error creando "${email}": ${error.message}`);
    throw error;
  }
  console.log(`  ✅  Creado en Supabase Auth`);
  return data!.user.id;
}

async function upsertLocalUser(supabaseId: string, email: string, name: string, isSuperAdmin: boolean) {
  let user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    // Actualizar si es necesario
    const updates: any = {};
    if (user.supabaseId !== supabaseId) updates.supabaseId = supabaseId;
    if (user.name !== name) updates.name = name;
    if (user.isSuperAdmin !== isSuperAdmin) updates.isSuperAdmin = isSuperAdmin;
    if (Object.keys(updates).length > 0) {
      await prisma.user.update({ where: { email }, data: updates });
      console.log(`  🔄  Registro local actualizado: ${JSON.stringify(updates)}`);
    } else {
      console.log(`  ℹ️  Registro local OK (ID: ${user.id.slice(0, 8)}…)`);
    }
    return user;
  }

  user = await prisma.user.create({
    data: { supabaseId, email, name, isSuperAdmin },
  });
  console.log(`  ✅  Registro local creado (ID: ${user.id.slice(0, 8)}…)`);
  return user;
}

async function upsertUserTenant(userId: string, tenantId: string, role: string) {
  const existing = await prisma.userTenant.findUnique({
    where: { userId_tenantId: { userId, tenantId } },
  });

  if (existing) {
    if (existing.role !== role) {
      await prisma.userTenant.update({
        where: { userId_tenantId: { userId, tenantId } },
        data: { role },
      });
      console.log(`  🔄  Rol actualizado: ${existing.role} → ${role}`);
    } else {
      console.log(`  ℹ️  Vínculo ya existe (rol: ${role})`);
    }
    return;
  }

  await prisma.userTenant.create({
    data: { userId, tenantId, role },
  });
  console.log(`  ✅  Vínculo creado (rol: ${role})`);
}

async function getTenantId(slug: string): Promise<string | null> {
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) {
    console.error(`  ❌  Tenant "${slug}" no encontrado. Ejecuta seed.ts o seed-barber-kings.ts primero.`);
    return null;
  }
  return tenant.id;
}

// ── Main ──

async function main() {
  console.log("🌱 Seed Demo Credentials: Iniciando...\n");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Faltan variables de entorno Supabase.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let created = 0;
  let skipped = 0;

  for (const du of DEMO_USERS) {
    console.log(`\n── ${du.label} ──`);
    console.log(`   Email: ${du.email}`);

    try {
      const appMetadata: Record<string, any> = {
        role: du.role,
        is_super_admin: du.isSuperAdmin || false,
      };
      const userMetadata: Record<string, any> = {
        name: du.name,
      };

      if (du.tenantSlug) {
        appMetadata.tenant_slug = du.tenantSlug;
        appMetadata.business_name = du.tenantSlug === "maite-guerra"
          ? "Maite Guerra Beauty Studio"
          : "Barber Kings Studio";
      }

      // 1. Supabase Auth
      const supabaseId = await upsertSupabaseUser(
        supabase, du.email, du.password,
        userMetadata, appMetadata,
      );

      // 2. Local user
      const localUser = await upsertLocalUser(
        supabaseId, du.email, du.name,
        du.isSuperAdmin || false,
      );

      // 3. UserTenant (solo si tiene tenant)
      if (du.tenantSlug && du.role !== "super_admin") {
        const tenantId = await getTenantId(du.tenantSlug);
        if (tenantId) {
          await upsertUserTenant(localUser.id, tenantId, du.role);
        }
      }

      created++;
    } catch (err) {
      console.error(`  ❌  Falló: ${du.email}`, err);
      skipped++;
    }
  }

  // ── Marcar usuario legacy admin@sendmestudio.cl ──
  console.log(`\n── Legacy: admin@sendmestudio.cl ──`);
  const legacyUser = await prisma.user.findUnique({ where: { email: "admin@sendmestudio.cl" } });
  if (legacyUser) {
    // Dejar existente pero renombrar para que no sea la credencial principal
    if (!legacyUser.name?.toLowerCase().includes("legacy")) {
      await prisma.user.update({
        where: { email: "admin@sendmestudio.cl" },
        data: { name: "Maite Guerra (Legacy)" },
      });
      console.log(`  ℹ️  Marcado como legacy`);
    } else {
      console.log(`  ℹ️  Ya está marcado como legacy`);
    }
  } else {
    console.log(`  ℹ️  No existe (nada que hacer)`);
  }

  // ── Resumen ──
  console.log("\n" + "=".repeat(70));
  console.log("  🎉 Seed Demo Credentials completado!");
  console.log("=".repeat(70));
  console.log(`  Usuarios procesados: ${created}`);
  console.log(`  Errores/saltados:    ${skipped}`);
  console.log("");
  console.log("  Credenciales activas:");
  console.log("  ─────────────────────────────────────────────────────────────");
  console.log("  SUPER ADMIN PLATAFORMA (sin tenant):");
  console.log("    super@sendmestudio.cl / SuperAdmin2026!");
  console.log("    → Ruta: /admin");
  console.log("");
  console.log("  PLATFORM ADMIN (sin tenant):");
  console.log("    admin.platform@sendmestudio.cl / PlatformAdmin2026!");
  console.log("    → Ruta: /admin");
  console.log("");
  console.log("  MAITE GUERRA BEAUTY STUDIO:");
  console.log("    Owner:   owner.maiteguerra@sendmestudio.cl / MaiteOwner2026!");
  console.log("    Admin:   admin.maiteguerra@sendmestudio.cl / MaiteAdmin2026!");
  console.log("    → Ruta: / (home tenant)");
  console.log("");
  console.log("  BARBER KINGS STUDIO:");
  console.log("    Owner:   owner.barberkings@sendmestudio.cl / BarberOwner2026!");
  console.log("    Admin:   admin.barberkings@sendmestudio.cl / BarberAdmin2026!");
  console.log("    → Ruta: / (home tenant)");
  console.log("");
  console.log("  LEGACY (no usar como principal):");
  console.log("    admin@sendmestudio.cl / Admin2026! — reemplazado por owner.maiteguerra@sendmestudio.cl");
  console.log("=".repeat(70));
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
