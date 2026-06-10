// ================================================================
// api/auth/session/route.ts — Resuelve sesión con tenantId desde DB
// GET /api/auth/session → { ok, session: { ... } }
// Única fuente de verdad para el estado de sesión del frontend.
// ================================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        ok: true,
        session: {
          isAuthenticated: false,
          email: null,
          userId: null,
          isSuperAdmin: false,
          is_super_admin: false,
          role: null,
          tenantId: null,
          tenantSlug: null,
          businessName: null,
        },
      });
    }

    let userId: string | null = null;
    let isSuperAdmin: boolean = false;
    let tenantId: string | null = null;
    let tenantSlug: string | null = null;
    let businessName: string | null = null;
    let role: string | null = null;

    // ── Resolve desde DB ──
    try {
      const dbUser = await prisma.user.findUnique({
        where: { supabaseId: user.id },
        select: { id: true, isSuperAdmin: true },
      });

      let dbUserId = dbUser?.id;

      // Fallback por email
      if (!dbUser && user.email) {
        console.log("[api/auth/session] ⚠️ No user by supabaseId, trying email:", user.email);
        const emailUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true, isSuperAdmin: true },
        });
        if (emailUser) {
          console.log("[api/auth/session] ✅ Found by email:", emailUser.id);
          isSuperAdmin = emailUser.isSuperAdmin === true;
          dbUserId = emailUser.id;
        }
      } else if (dbUser) {
        isSuperAdmin = dbUser.isSuperAdmin === true;
        dbUserId = dbUser.id;
      }

      if (dbUserId) {
        userId = dbUserId;

        // Buscar tenant + role
        const userTenant = await prisma.userTenant.findFirst({
          where: { userId: dbUserId },
          select: {
            tenantId: true,
            role: true,
            tenant: {
              select: { slug: true, businessName: true },
            },
          },
          orderBy: { createdAt: "asc" },
        });

        if (userTenant) {
          tenantId = userTenant.tenantId;
          role = userTenant.role;
          tenantSlug = userTenant.tenant?.slug ?? null;
          businessName = userTenant.tenant?.businessName ?? null;

          console.log("[api/auth/session] ✅ Resolved tenant from DB:");
          console.log("  supabaseUserId:", user.id);
          console.log("  email:", user.email);
          console.log("  publicUserId:", dbUserId);
          console.log("  tenantId:", tenantId);
          console.log("  tenantSlug:", tenantSlug);
          console.log("  businessName:", businessName);
          console.log("  role:", role);
        } else {
          console.log("[api/auth/session] ✅ User found, no tenant assigned. isSuperAdmin:", isSuperAdmin);
        }
      }
    } catch (err) {
      console.error("[api/auth/session] DB error:", err);
    }

    return NextResponse.json({
      ok: true,
      session: {
        isAuthenticated: true,
        email: user.email ?? null,
        userId,
        isSuperAdmin,
        is_super_admin: isSuperAdmin,
        role,
        tenantId,
        tenantSlug,
        businessName,
      },
    });
  } catch (err) {
    console.error("[api/auth/session] Fatal error:", err);
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}
