import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { isBrainAdminAuthenticated } from "../auth";

export const dynamic = "force-dynamic";

const BRAIN_ROOT = path.join(process.cwd(), "data", "business-brain");

// ─── Blocked keywords (profanity, politics, sports, off-topic) ──────────────
const BLOCKED_WORDS = [
  // Profanity / inappropriate
  "puta", "puto", "weón", "weon", "ctm", "conchetumadre", "mierda",
  "carajo", "pendejo", "huevón", "huevon", "culiao", "chucha",
  "maricón", "maricon", "conchatumadre",
  // Politics
  "boric", "kast", "piñera", "matthei", "vamos chile", "apruebo",
  "rechazo", "constitución", "constitucion", "presidente",
  "diputado", "senador", "partido político", "partido politico",
  // Sports (off-topic)
  "colo colo", "colocolo", "universidad de chile", "la u",
  "cobreloa", "católica", "catolica", "fútbol", "futbol",
  "mundial", "copa américa", "copa america", "champions",
  // General off-topic
  "receta médica", "receta medica", "diagnóstico", "diagnostico",
  "enfermedad grave", "cirugía", "cirugia",
];

// ─── Business relevance keywords ────────────────────────────────────────────
const BUSINESS_KEYWORDS = [
  "cliente", "clienta", "servicio", "precio", "baño de color", "baño",
  "corte", "tinte", "mechas", "balayage", "keratina", "alisado",
  "cejas", "pestañas", "manicure", "pedicure", "uñas", "esmaltado",
  "tratamiento", "capilar", "cabello", "reserva", "agendar",
  "horario", "agenda", "turno", "cancelación", "cancelacion",
  "salón", "salon", "peluquería", "peluqueria", "estilista",
  "profesional", "maquillaje", "depilación", "depilacion",
  "reclamo", "queja", "sugerencia", "opinión", "opinion",
  "recomendación", "recomendacion", "referencia", "descuento",
  "promoción", "promocion", "pack", "combo", "oferta",
  "instagram", "whatsapp", "facebook", "reseña", "resena",
  "google", "mapas", "ubicación", "ubicacion", "dirección",
  "direccion", "teléfono", "telefono", "contacto", "atencion",
  "atención", "calidad", "resultado", "satisfecho", "conforme",
  "vuelve", "volver", "frecuente", "habitual", "nuevo",
  "aprendizaje", "error", "duda", "problema", "solución", "solucion",
  "mejora", "capacitación", "capacitacion", "técnica", "tecnica",
  "producto", "marca", "shampoo", "shampú", "acondicionador",
  "mascarilla", "aceite", "crema", "cera", "laca", "spray",
  "venta", "vender", "comprar", "pago", "transferencia",
  "efectivo", "débito", "debito", "crédito", "credito", "tarjeta",
  "boleta", "factura", "precio", "cobro", "valor", "costo",
  "presupuesto", "cotización", "cotizacion",
];

function containsAny(text: string, words: string[]): string | null {
  const lower = text.toLowerCase();
  for (const word of words) {
    if (lower.includes(word.toLowerCase())) {
      return word;
    }
  }
  return null;
}

function countBusinessKeywords(text: string): number {
  const lower = text.toLowerCase();
  return BUSINESS_KEYWORDS.filter((kw) => lower.includes(kw.toLowerCase())).length;
}

interface AuditResult {
  status: "approved" | "needs_edit" | "out_of_context" | "not_suitable";
  message: string;
}

function auditNoteText(text: string): AuditResult {
  const trimmed = text.trim();

  if (trimmed.length < 5) {
    return {
      status: "needs_edit",
      message: "La nota es demasiado corta. Escribe al menos una observación completa.",
    };
  }

  // Check for profanity first (highest priority rejection)
  const profanity = containsAny(trimmed, BLOCKED_WORDS);
  if (profanity) {
    return {
      status: "not_suitable",
      message: "El lenguaje no es apto para el Brain. Edita la nota antes de guardar.",
    };
  }

  // Check business relevance
  const keywordCount = countBusinessKeywords(trimmed);
  if (keywordCount === 0) {
    return {
      status: "out_of_context",
      message: "Esta nota no parece relacionada con el negocio. Revísala antes de guardar.",
    };
  }

  // Check if text is too generic (very few keywords relative to length)
  const wordCount = trimmed.split(/\s+/).length;
  if (wordCount > 20 && keywordCount < 2) {
    return {
      status: "needs_edit",
      message: "La nota tiene poca relación con el negocio. Agrega más contexto sobre clientes, servicios o aprendizajes del salón.",
    };
  }

  // Check for sensitive data patterns (RUT, phone, email)
  const rutPattern = /\b\d{1,2}\.\d{3}\.\d{3}[-][0-9kK]\b/;
  const phonePattern = /\b(\+?56)?9\d{8}\b/;
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;

  if (rutPattern.test(trimmed)) {
    return {
      status: "needs_edit",
      message: "La nota contiene un RUT. Elimina datos personales antes de guardar.",
    };
  }

  if (phonePattern.test(trimmed)) {
    return {
      status: "needs_edit",
      message: "La nota contiene un número de teléfono. Elimina datos personales antes de guardar.",
    };
  }

  if (emailPattern.test(trimmed)) {
    return {
      status: "needs_edit",
      message: "La nota contiene un correo electrónico. Elimina datos personales antes de guardar.",
    };
  }

  // All checks passed
  return {
    status: "approved",
    message: "Aprobada — la nota es relevante para el negocio y tiene el formato adecuado.",
  };
}

export async function POST(request: Request) {
  if (!(await isBrainAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { text, save } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "El texto de la nota es obligatorio." }, { status: 400 });
    }

    const audit = auditNoteText(text);

    // If save flag is true and note is approved, persist it
    if (save === true && audit.status === "approved") {
      const notesDir = path.join(BRAIN_ROOT, "notes");
      await fs.mkdir(notesDir, { recursive: true });

      const fileName = `note-${Date.now()}.md`;
      const filePath = path.join(notesDir, fileName);
      const content = [
        `# Nota del equipo`,
        ``,
        `**Fecha:** ${new Date().toLocaleString("es-CL", { timeZone: "America/Santiago" })}`,
        `**Estado:** Auditada y aprobada`,
        ``,
        `---`,
        ``,
        text.trim(),
        ``,
      ].join("\n");

      await fs.writeFile(filePath, content, "utf8");

      return NextResponse.json({
        ok: true,
        status: audit.status,
        message: "Nota guardada correctamente como aprendizaje del Brain.",
        file: fileName,
      });
    }

    // If save flag is true but note is not approved, reject
    if (save === true && audit.status !== "approved") {
      return NextResponse.json({
        ok: false,
        status: audit.status,
        error: audit.message,
      }, { status: 400 });
    }

    // Just audit (no save)
    return NextResponse.json({
      ok: true,
      status: audit.status,
      message: audit.message,
    });
  } catch (error) {
    console.error("[audit-note] Error:", error);
    return NextResponse.json({ error: "Error interno al procesar la nota." }, { status: 500 });
  }
}
