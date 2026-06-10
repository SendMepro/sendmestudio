// ================================================================
// scripts/check-super-admin.ts
// Diagnostica y corrige el estado de super_admin en DB.
// ================================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "super@sendmestudio.cl";

  console.log("=== Diagnóstico Super Admin ===");
  console.log("Buscando usuario por email:", email);

  // 1. Buscar por email
  const userByEmail = await prisma.user.findUnique({
    where: { email },
  });

  if (userByEmail) {
    console.log("\n✅ Usuario encontrado por email:");
    console.log("  id:", userByEmail.id);
    console.log("  supabaseId:", userByEmail.supabaseId);
    console.log("  email:", userByEmail.email);
    console.log("  isSuperAdmin:", userByEmail.isSuperAdmin);
    console.log("  isActive:", userByEmail.isActive);

    // 2. Si isSuperAdmin es false, corregirlo
    if (!userByEmail.isSuperAdmin) {
      console.log("\n⚠️  isSuperAdmin es FALSE. Corrigiendo...");
      await prisma.user.update({
        where: { id: userByEmail.id },
        data: { isSuperAdmin: true },
      });
      console.log("✅ isSuperAdmin actualizado a TRUE");
    } else {
      console.log("\n✅ isSuperAdmin ya está en TRUE");
    }
  } else {
    console.log("\n❌ Usuario NO encontrado por email");
  }

  // 3. Verificar todos los super admins existentes
  const allSupers = await prisma.user.findMany({
    where: { isSuperAdmin: true },
  });
  console.log("\n=== Super Admins en DB ===");
  if (allSupers.length === 0) {
    console.log("❌ No hay super admins en DB");
  } else {
    for (const s of allSupers) {
      console.log(`  - ${s.email} (id: ${s.id}, supabaseId: ${s.supabaseId})`);
    }
  }

  // 4. Buscar por supabaseId si el usuario tiene uno
  if (userByEmail?.supabaseId) {
    console.log("\n=== Verificando por supabaseId ===");
    const userBySupabaseId = await prisma.user.findUnique({
      where: { supabaseId: userByEmail.supabaseId },
    });
    if (userBySupabaseId) {
      console.log("✅ Búsqueda por supabaseId funciona:");
      console.log("  isSuperAdmin:", userBySupabaseId.isSuperAdmin);
    } else {
      console.log("❌ No se encontró por supabaseId (inconsistencia)");
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
