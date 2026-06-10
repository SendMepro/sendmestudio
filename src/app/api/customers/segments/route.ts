import { NextResponse } from "next/server";
import { getCustomerSegments } from "../store";
import { requireTenantFromNativeRequest } from "@/lib/tenant-helper";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { ctx, error } = await requireTenantFromNativeRequest(request);
  if (error) return error;

  return NextResponse.json({
    ok: true,
    segments: await getCustomerSegments(ctx!.tenantId),
  });
}
