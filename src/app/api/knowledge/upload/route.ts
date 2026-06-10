// ================================================================
// api/knowledge/upload/route.ts — Upload de documentos a Knowledge
// POST multipart/form-data { file, section, tags }
// Tipos: PDF, DOCX, TXT
// ================================================================

import { NextResponse, type NextRequest } from "next/server";
import { requireTenant, requireTenantFromNativeRequest } from "@/lib/tenant-helper";
import { createServerClient } from "@supabase/ssr";
import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIMES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/msword",
];

const ALLOWED_EXTENSIONS = ["pdf", "docx", "doc", "txt"];

export async function POST(request: NextRequest) {
  const { ctx, error } = await requireTenant(request);
  if (error) return error;
  const tenantId = ctx!.tenantId;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const sectionName = (formData.get("section") as string) || "documents";
    const tagsRaw = (formData.get("tags") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "Se requiere un archivo." }, { status: 400 });
    }

    // Validate file extension
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `Tipo de archivo no soportado. Permitidos: ${ALLOWED_EXTENSIONS.join(", ")}` },
        { status: 400 },
      );
    }

    // Validate MIME
    if (!ALLOWED_MIMES.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo MIME no soportado: ${file.type}` },
        { status: 400 },
      );
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "El archivo es demasiado grande. Máximo 10MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Supabase Storage (knowledge bucket)
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

    const filePath = `${tenantId}/knowledge/${randomUUID()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("knowledge")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      // If bucket doesn't exist, try to create it
      if (uploadError.message?.includes("bucket")) {
        // Store directly in DB as knowledge item with base64 for now
        const content = ext === "txt" ? buffer.toString("utf-8") : `[Documento: ${file.name}]`;
        const tags = tagsRaw.split(",").map((t: string) => t.trim()).filter(Boolean);

        const item = await prisma.knowledgeItem.create({
          data: {
            tenantId,
            section: sectionName,
            key: file.name,
            data: {
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
              content: content.substring(0, 10000),
              tags,
              uploadedAt: new Date().toISOString(),
              isDocument: true,
            },
            sortOrder: 0,
          },
        });

        // Also create a File record
        await prisma.file.create({
          data: {
            tenantId,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            url: `data:${file.type};base64,${buffer.toString("base64")}`,
            category: "document",
            uploadedBy: ctx?.user?.id ?? "unknown",
          },
        });

        return NextResponse.json({
          ok: true,
          item,
          storage: "inline",
          message: "Documento guardado en base de datos. Para mejor rendimiento, configura el bucket 'knowledge' en Supabase Storage.",
        });
      }

      console.error("[knowledge/upload] Storage error:", uploadError);
      return NextResponse.json({ error: `Error al subir: ${uploadError.message}` }, { status: 500 });
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("knowledge")
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    // Store as knowledge item
    const tags = tagsRaw.split(",").map((t: string) => t.trim()).filter(Boolean);
    const item = await prisma.knowledgeItem.create({
      data: {
        tenantId,
        section: sectionName,
        key: file.name,
        data: {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          url: publicUrl,
          tags,
          uploadedAt: new Date().toISOString(),
          isDocument: true,
        },
        sortOrder: 0,
      },
    });

    // Create File record
    await prisma.file.create({
      data: {
        tenantId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        url: publicUrl,
        category: "document",
        uploadedBy: ctx?.user?.id ?? "unknown",
      },
    });

    return NextResponse.json({ ok: true, item, url: publicUrl, storage: "supabase" });
  } catch (err: any) {
    console.error("[knowledge/upload] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
