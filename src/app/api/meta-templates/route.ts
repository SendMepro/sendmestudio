import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type MetaTemplateStatus = "draft" | "submitted" | "approved" | "rejected";

type MetaWhatsAppTemplate = {
  id: string;
  campaignId: string;
  name: string;
  category: "marketing" | "utility";
  language: "es";
  body: string;
  variablesPreview: string[];
  status: MetaTemplateStatus;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
};

const templatesDir = path.join(process.cwd(), "data", "meta-templates");
const templatesFile = path.join(templatesDir, "templates.json");

async function readTemplates() {
  try {
    const content = await fs.readFile(templatesFile, "utf8");
    return JSON.parse(content) as MetaWhatsAppTemplate[];
  } catch {
    await fs.mkdir(templatesDir, { recursive: true });
    await fs.writeFile(templatesFile, JSON.stringify([], null, 2));
    return [];
  }
}

async function writeTemplates(templates: MetaWhatsAppTemplate[]) {
  await fs.mkdir(templatesDir, { recursive: true });
  await fs.writeFile(templatesFile, JSON.stringify(templates, null, 2));
}

function safeTemplateName(value: string) {
  const base = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_ ]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 48);

  return base || `template_${Date.now()}`;
}

function safeTemplateBody(value: string) {
  return value
    .replace(/[^\S\r\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function variablesFromBody(body: string) {
  return Array.from(new Set(body.match(/{{\s*[\w.]+\s*}}/g) ?? [])).map((variable) =>
    variable.replace(/\s+/g, "")
  );
}

export async function GET() {
  return NextResponse.json({ templates: await readTemplates() });
}

export async function POST(request: Request) {
  const body = await request.json();
  const now = new Date().toISOString();
  const templateBody = safeTemplateBody(String(body.body ?? ""));

  if (!templateBody) {
    return NextResponse.json({ ok: false, error: "Missing template body" }, { status: 400 });
  }

  const template: MetaWhatsAppTemplate = {
    id: `meta-template-${Date.now()}`,
    campaignId: String(body.campaignId ?? "campaign"),
    name: safeTemplateName(String(body.name ?? body.title ?? "salon_template")),
    category: body.category === "utility" ? "utility" : "marketing",
    language: "es",
    body: templateBody,
    variablesPreview: variablesFromBody(templateBody),
    status: "draft",
    rejectionReason: "",
    createdAt: now,
    updatedAt: now,
  };

  const templates = await readTemplates();
  await writeTemplates([template, ...templates]);

  return NextResponse.json({ ok: true, template }, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const id = String(body.id ?? "");
  const templates = await readTemplates();
  const existingTemplate = templates.find((template) => template.id === id);

  if (!existingTemplate) {
    return NextResponse.json({ ok: false, error: "Template not found" }, { status: 404 });
  }

  const nextTemplates = templates.map((template) =>
    template.id === id
      ? {
          ...template,
          name: body.name ? safeTemplateName(String(body.name)) : template.name,
          category: body.category === "utility" || body.category === "marketing" ? body.category : template.category,
          body: body.body ? safeTemplateBody(String(body.body)) : template.body,
          variablesPreview: body.body ? variablesFromBody(safeTemplateBody(String(body.body))) : template.variablesPreview,
          status:
            body.status === "submitted" ||
            body.status === "approved" ||
            body.status === "rejected" ||
            body.status === "draft"
              ? body.status
              : template.status,
          rejectionReason:
            body.status === "rejected" ? String(body.rejectionReason || "Requiere ajuste de contenido antes de reenviar.") : template.rejectionReason,
          updatedAt: new Date().toISOString(),
        }
      : template
  );

  await writeTemplates(nextTemplates);

  return NextResponse.json({ ok: true, template: nextTemplates.find((template) => template.id === id) });
}
