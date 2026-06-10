// ================================================================
// scripts/seed-whatsapp-mapping.ts
// Seed WhatsAppTenantMapping for multi-tenant webhook resolution.
// Run: npx tsx scripts/seed-whatsapp-mapping.ts
// ================================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Seed WhatsAppTenantMapping ===\n");

  // ── 1) Maite Guerra ────────────────────────────────────────
  const maiteTenant = await prisma.tenant.findUnique({
    where: { slug: "maite-guerra" },
    select: { id: true, businessName: true },
  });

  if (!maiteTenant) {
    console.error("❌ Tenant 'maite-guerra' not found in database.");
    console.error("   Ensure tenants are seeded before running this script.");
    process.exit(1);
  }

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const businessPhone = process.env.WHATSAPP_TEST_RECIPIENT;
  const waBusinessId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (!phoneNumberId || !accessToken) {
    console.error("❌ Missing required env vars: WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN");
    process.exit(1);
  }

  console.log(`📌 Tenant: ${maiteTenant.businessName} (${maiteTenant.id})`);
  console.log(`   phoneNumberId: ${phoneNumberId}`);
  console.log(`   businessPhone: ${businessPhone ?? "(none)"}`);
  console.log(`   waBusinessId: ${waBusinessId ?? "(none)"}`);

  const maiteMapping = await prisma.whatsAppTenantMapping.upsert({
    where: { phoneNumberId },
    update: {
      tenantId: maiteTenant.id,
      ...(businessPhone ? { businessPhone } : {}),
      ...(waBusinessId ? { waBusinessId } : {}),
      accessToken,
      ...(verifyToken ? { webhookSecret: verifyToken } : {}),
      isActive: true,
    },
    create: {
      tenantId: maiteTenant.id,
      phoneNumberId,
      businessPhone: businessPhone ?? undefined,
      waBusinessId: waBusinessId ?? undefined,
      accessToken,
      webhookSecret: verifyToken ?? undefined,
      isActive: true,
    },
  });

  console.log(`✅ Maite Guerra mapping: ${maiteMapping.id} (${maiteMapping.isActive ? "active" : "inactive"})`);

  // ── 2) Barber Kings (placeholder, optional) ────────────────
  const barberPhoneNumberId = process.env.BARBER_WHATSAPP_PHONE_NUMBER_ID;
  const barberBusinessPhone = process.env.BARBER_WHATSAPP_BUSINESS_PHONE;
  const barberWaBusinessId = process.env.BARBER_WHATSAPP_BUSINESS_ACCOUNT_ID;
  const barberToken = process.env.BARBER_WHATSAPP_TOKEN;

  if (!barberPhoneNumberId || !barberToken) {
    console.log("\n⚠️  Barber Kings env vars not found (BARBER_WHATSAPP_*). Skipping.");
    console.log("   Define these in .env when Barber Kings WhatsApp is ready:");
    console.log("     BARBER_WHATSAPP_PHONE_NUMBER_ID");
    console.log("     BARBER_WHATSAPP_BUSINESS_PHONE");
    console.log("     BARBER_WHATSAPP_BUSINESS_ACCOUNT_ID");
    console.log("     BARBER_WHATSAPP_TOKEN");
  } else {
    const barberTenant = await prisma.tenant.findUnique({
      where: { slug: "barber-kings" },
      select: { id: true, businessName: true },
    });

    if (!barberTenant) {
      console.warn("\n⚠️  Tenant 'barber-kings' not found. Skipping Barber Kings mapping.");
    } else {
      console.log(`\n📌 Tenant: ${barberTenant.businessName} (${barberTenant.id})`);
      console.log(`   phoneNumberId: ${barberPhoneNumberId}`);
      console.log(`   businessPhone: ${barberBusinessPhone ?? "(none)"}`);
      console.log(`   waBusinessId: ${barberWaBusinessId ?? "(none)"}`);

      const barberMapping = await prisma.whatsAppTenantMapping.upsert({
        where: { phoneNumberId: barberPhoneNumberId },
        update: {
          tenantId: barberTenant.id,
          ...(barberBusinessPhone ? { businessPhone: barberBusinessPhone } : {}),
          ...(barberWaBusinessId ? { waBusinessId: barberWaBusinessId } : {}),
          accessToken: barberToken,
          isActive: true,
        },
        create: {
          tenantId: barberTenant.id,
          phoneNumberId: barberPhoneNumberId,
          businessPhone: barberBusinessPhone ?? undefined,
          waBusinessId: barberWaBusinessId ?? undefined,
          accessToken: barberToken,
          isActive: true,
        },
      });

      console.log(`✅ Barber Kings mapping: ${barberMapping.id} (${barberMapping.isActive ? "active" : "inactive"})`);
    }
  }

  // ── 3) Summary ─────────────────────────────────────────────
  console.log("\n=== Final State ===");
  const allMappings = await prisma.whatsAppTenantMapping.findMany({
    include: { tenant: { select: { businessName: true, slug: true } } },
  });

  if (allMappings.length === 0) {
    console.log("No mappings found.");
  } else {
    for (const m of allMappings) {
      console.log(`  • ${m.tenant?.businessName ?? "(unknown)"}`);
      console.log(`    tenantId:       ${m.tenantId}`);
      console.log(`    phoneNumberId:  ${m.phoneNumberId}`);
      console.log(`    businessPhone:  ${m.businessPhone ?? "-"}`);
      console.log(`    waBusinessId:   ${m.waBusinessId ?? "-"}`);
      console.log(`    isActive:       ${m.isActive}`);
      console.log(`    accessToken:    ${m.accessToken ? `${m.accessToken.slice(0, 20)}...` : "(none)"}`);
      console.log();
    }
  }

  console.log(`Total mappings: ${allMappings.length}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
