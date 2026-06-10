// ================================================================
// api/admin/tenants/upload-branding/route.ts
// Sube archivos de branding (logo, banner, favicon) durante creación
// de tenant. Guarda temporalmente en pending-tenants/{userId}/branding/
// y retorna la URL pública.
// POST multipart/form-data { file, type }
// Solo Super Admin puede usar este endpoint.
// ================================================================

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getAuthUser } from "@/lib/admin-helper";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/x-icon"];

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  if (!user.isSuperAdmin) {
    return NextResponse.json({ error: "Solo Super Admin puede subir branding." }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null;
    // Optional: if tenantId already exists, use it; otherwise use pending path
    const tenantId = formData.get("tenantId") as string | null;

    if (!file || !type) {
      return NextResponse.json({ error: "Se requiere file y type." }, { status: 400 });
    }

    if (!["logo", "banner", "favicon"].includes(type)) {
      return NextResponse.json({ error: "type debe ser logo, banner o favicon." }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo de archivo no soportado: ${file.type}. Usa PNG, JPEG, WebP o SVG.` },
        { status: 400 },
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "El archivo es demasiado grande. Máximo 5MB." },
        { status: 400 },
      );
    }

    // Get file buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Determine path: if tenantId exists, use tenant path; otherwise use pending path
    const ext = file.name.split(".").pop() || "png";
    const fileName = `${type}-${randomUUID()}.${ext}`;
    const basePath = tenantId
      ? `${tenantId}/branding/${fileName}`
      : `pending/${user.id}/branding/${fileName}`;

    // Upload to Supabase Storage
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        },
      },
    );

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("branding")
      .upload(basePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("[admin/upload-branding] Supabase storage error:", uploadError);
      return NextResponse.json({ error: `Error al subir: ${uploadError.message}` }, { status: 500 });
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("branding")
      .getPublicUrl(basePath);

    const publicUrl = publicUrlData.publicUrl;

    return NextResponse.json({ ok: true, url: publicUrl, type, path: basePath });
  } catch (err: any) {
    console.error("[admin/upload-branding] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
