// ================================================================
// scripts/diagnose-super-admin.ts
// Diagnóstico completo de autenticación Super Admin
// 1. Verificar si existe en Supabase Auth
// 2. Verificar si existe en public.users
// 3. Verificar is_super_admin
// 4. Crear/arreglar si es necesario
// ================================================================

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const EMAIL = "super@sendmestudio.cl";
const PASSWORD = "SuperAdmin2026!";

async function main() {
  console.log("========================================");
  console.log("DIAGNÓSTICO SUPER ADMIN");
  console.log("========================================\n");

  // ── 1. Inicializar Supabase Admin ──
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar en .env");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log("Conectado a Supabase Admin SDK\n");

  // ── 2. Buscar usuario en Supabase Auth ──
  console.log("── Buscando en Supabase Auth ──");
  const { data: userList, error: listError } = await supabase.auth.admin.listUsers({
    perPage: 100,
  });

  if (listError) {
    console.error("❌ Error listando usuarios:", listError.message);
    process.exit(1);
  }

  const authUser = userList.users.find((u) => u.email === EMAIL);

  if (!authUser) {
    console.log(`❌ Usuario ${EMAIL} NO existe en Supabase Auth.`);
    console.log("\n── CREANDO usuario en Supabase Auth ──");

    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      app_metadata: {
        is_super_admin: true,
        role: "super_admin",
      },
    });

    if (createError) {
      console.error("❌ Error creando usuario en Supabase Auth:", createError.message);
      process.exit(1);
    }

    console.log(`✅ Usuario creado en Supabase Auth:`);
    console.log(`   ID: ${newUser.user!.id}`);
    console.log(`   Email: ${newUser.user!.email}`);
    console.log(`   is_super_admin: ${newUser.user!.app_metadata?.is_super_admin}`);

    // Ahora buscar el usuario recién creado
    const updatedList = await supabase.auth.admin.listUsers();
    const createdUser = updatedList.data.users.find((u) => u.email === EMAIL);

    if (!createdUser) {
      console.error("❌ Error: usuario creado pero no encontrado en lista");
      process.exit(1);
    }

    // ── 3. Crear en public.users ──
    console.log("\n── Creando registro en public.users ──");
    const dbUser = await prisma.user.create({
      data: {
        supabaseId: createdUser.id,
        email: EMAIL,
        name: "Super Admin",
      },
    });

    console.log(`✅ Creado en public.users:`);
    console.log(`   ID: ${dbUser.id}`);
    console.log(`   supabaseId: ${dbUser.supabaseId}`);
    console.log(`   email: ${dbUser.email}`);

    // ── 4. Verificar app_metadata final ──
    console.log("\n── Verificando app_metadata final ──");
    const finalUser = await supabase.auth.admin.getUserById(createdUser.id);
    const meta = finalUser.data.user?.app_metadata;
    console.log(`   is_super_admin: ${meta?.is_super_admin}`);
    console.log(`   role: ${meta?.role}`);

    console.log("\n========================================");
    console.log("✅ SUPER ADMIN CREADO Y CONFIGURADO");
    console.log("========================================");
    console.log(`\nEmail:    ${EMAIL}`);
    console.log(`Password: ${PASSWORD}`);
    console.log(`User ID:  ${createdUser.id}`);
    console.log(`is_super_admin: true`);
    console.log(`\nPuede acceder a: /admin/*`);
  } else {
    console.log(`✅ Usuario ${EMAIL} EXISTE en Supabase Auth.`);
    console.log(`   ID: ${authUser.id}`);
    console.log(`   is_super_admin: ${authUser.app_metadata?.is_super_admin}`);
    console.log(`   role: ${authUser.app_metadata?.role}`);

    // Verificar si tiene is_super_admin
    if (authUser.app_metadata?.is_super_admin !== true) {
      console.log("\n── Actualizando app_metadata con is_super_admin=true ──");
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        authUser.id,
        {
          app_metadata: {
            is_super_admin: true,
            role: "super_admin",
          },
        },
      );

      if (updateError) {
        console.error("❌ Error actualizando app_metadata:", updateError.message);
      } else {
        console.log("✅ app_metadata actualizado: is_super_admin=true, role=super_admin");
      }
    }

    // ── 3. Verificar en public.users ──
    console.log("\n── Buscando en public.users ──");
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: authUser.id },
    });

    if (!dbUser) {
      console.log(`❌ No existe en public.users. CREANDO...`);
      const newDbUser = await prisma.user.create({
        data: {
          supabaseId: authUser.id,
          email: EMAIL,
          name: "Super Admin",
        },
      });
      console.log(`✅ Creado en public.users: ID=${newDbUser.id}`);
    } else {
      console.log(`✅ Existe en public.users:`);
      console.log(`   ID: ${dbUser.id}`);
      console.log(`   email: ${dbUser.email}`);
    }

    console.log("\n========================================");
    console.log("✅ SUPER ADMIN OK");
    console.log("========================================");
    console.log(`\nEmail:    ${EMAIL}`);
    console.log(`Password: ${PASSWORD}`);
    console.log(`User ID:  ${authUser.id}`);
    console.log(`is_super_admin: ${authUser.app_metadata?.is_super_admin}`);
  }

  // ── Verificar login real ──
  console.log("\n── Probando login real ──");
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  
  const { data: loginData, error: loginError } = await anonClient.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  });

  if (loginError) {
    console.error(`❌ Login falló: ${loginError.message}`);
  } else {
    console.log(`✅ Login exitoso`);
    console.log(`   User ID: ${loginData.user?.id}`);
    console.log(`   Email: ${loginData.user?.email}`);
    console.log(`   is_super_admin: ${loginData.user?.app_metadata?.is_super_admin}`);
  }

  console.log("\n========================================\n");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
