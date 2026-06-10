import { NextResponse } from "next/server";
import { getCustomerByPhone, readCustomers } from "./store";
import { requireTenantFromNativeRequest } from "@/lib/tenant-helper";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { ctx, error } = await requireTenantFromNativeRequest(request);
  if (error) return error;
  const tenantId = ctx!.tenantId;

  const url = new URL(request.url);
  const phone = url.searchParams.get("phone");

  if (phone) {
    return NextResponse.json({
      ok: true,
      customer: await getCustomerByPhone(phone, tenantId),
    });
  }

  return NextResponse.json({
    ok: true,
    customers: await readCustomers(tenantId),
  });
}
