// ================================================================
// api/admin/plans/route.ts — Plans listing for Super Admin
// GET /api/admin/plans → list all subscription plans
// ================================================================

import { NextResponse, type NextRequest } from "next/server";
import { requireSuperAdmin } from "@/lib/admin-helper";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { user, error } = await requireSuperAdmin(request);
  if (error) return error;

  try {
    const plans = await prisma.plan.findMany({
      orderBy: { monthlyPriceClp: "asc" },
    });

    // If no plans in DB, return fallback
    if (plans.length === 0) {
      console.warn("[admin/plans] No plans in DB, returning fallback");
      return NextResponse.json({
        plans: [
          { id: "basic", name: "Basic", monthlyPriceClp: 29000 },
          { id: "pro", name: "Pro", monthlyPriceClp: 59000 },
          { id: "premium", name: "Premium", monthlyPriceClp: 99000 },
        ],
        fallback: true,
      });
    }

    return NextResponse.json({ plans });
  } catch (err: any) {
    console.error("[admin/plans] GET error, returning fallback:", err.message);
    // Fallback on error too
    return NextResponse.json({
      plans: [
        { id: "basic", name: "Basic", monthlyPriceClp: 29000 },
        { id: "pro", name: "Pro", monthlyPriceClp: 59000 },
        { id: "premium", name: "Premium", monthlyPriceClp: 99000 },
      ],
      fallback: true,
    });
  }
}
