// ================================================================
// test-whatsapp-send.js
// ================================================================
// Test de envío WhatsApp real.
// Lee credenciales de .env.local, envía mensaje de prueba.
//
// Uso:
//   node scripts/test-whatsapp-send.js
//   node scripts/test-whatsapp-send.js +569XXXXXXXX  (número opcional)
//
// NO expone token completo en consola.
// NO requiere dependencias externas.
// ================================================================

const https = require("https");
const fs = require("fs");
const path = require("path");

// ── Leer .env.local ──────────────────────────────────────────────

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env.local");
  const envPathAlt = path.join(__dirname, "..", ".env");
  let content;
  try {
    content = fs.readFileSync(envPath, "utf8");
  } catch {
    try {
      content = fs.readFileSync(envPathAlt, "utf8");
    } catch {
      console.error("ERROR: No se encontró .env.local ni .env");
      process.exit(1);
    }
  }

  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    // Remove surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

// ── Meta API send ────────────────────────────────────────────────

function sendMessage(accessToken, phoneNumberId, to, message) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: message },
    });

    const options = {
      hostname: "graph.facebook.com",
      path: `/v25.0/${phoneNumberId}/messages`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = { raw: data };
        }

        resolve({
          status: res.statusCode,
          statusText: res.statusMessage,
          data: parsed,
        });
      });
    });

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

// ── Main ─────────────────────────────────────────────────────────

async function main() {
  console.log("");
  console.log("=== WhatsApp Send Test ===");
  console.log("");

  const env = loadEnv();
  const operationalMode = env.WHATSAPP_OPERATIONAL_MODE || "(auto)";

  // ── Verificar modo operacional ────────────────────────────────
  if (operationalMode !== "production") {
    console.log("⚠️  WHATSAPP_OPERATIONAL_MODE:", operationalMode);
    console.log("");
    console.log("WhatsApp está en modo local/meta_disabled.");
    console.log("No se enviará mensaje real a Meta.");
    console.log("");
    console.log("Para forzar envío real (solo si Meta está activo):");
    console.log("  WHATSAPP_OPERATIONAL_MODE=production node scripts/test-whatsapp-send.js +569XXXXXXXX");
    console.log("");
    console.log("Detalles del modo actual:");
    console.log("  - Modo:", operationalMode);
    console.log("  - Meta API: DESHABILITADO");
    console.log("  - Envío real: BLOQUEADO");
    console.log("  - Pruebas reales: blocked_by_environment");
    console.log("");
    console.log("Acciones recomendadas en local mode:");
    console.log("  1. Validar código sin enviar (webhook, sender, concierge, store).");
    console.log("  2. Mantener autoReply=false.");
    console.log("  3. Campaigns: dry-run (handleSendDemo) solo.");
    console.log("  4. Cuando Meta esté activo: renovar token, WHATSAPP_OPERATIONAL_MODE=production.");
    process.exit(0);
  }

  const accessToken = env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID;
  const businessAccountId = env.WHATSAPP_BUSINESS_ACCOUNT_ID || "(no configurado)";

  // Validar credenciales
  const errors = [];
  if (!accessToken) errors.push("WHATSAPP_ACCESS_TOKEN no definido");
  if (!phoneNumberId) errors.push("WHATSAPP_PHONE_NUMBER_ID no definido");

  if (errors.length > 0) {
    console.error("ERRORES de configuración:");
    for (const e of errors) console.error("  -", e);
    console.error("");
    console.error("Verificar .env.local:");
    console.error("  WHATSAPP_ACCESS_TOKEN   definido:", Boolean(accessToken));
    console.error("  WHATSAPP_PHONE_NUMBER_ID definido:", Boolean(phoneNumberId));
    console.error("  WHATSAPP_BUSINESS_ACCOUNT_ID definido:", Boolean(env.WHATSAPP_BUSINESS_ACCOUNT_ID));
    process.exit(1);
  }

  // Mostrar solo prefijo del token
  const tokenPreview = accessToken.slice(0, 8) + "..." + accessToken.slice(-4);
  console.log("Credenciales:");
  console.log("  WHATSAPP_ACCESS_TOKEN   :", tokenPreview, `(${accessToken.length} chars)`);
  console.log("  WHATSAPP_PHONE_NUMBER_ID:", phoneNumberId);
  console.log("  WHATSAPP_BUSINESS_ACCOUNT_ID:", businessAccountId);
  console.log("");

  // Número destino
  const to = process.argv[2];
  if (!to) {
    console.error("USO: node scripts/test-whatsapp-send.js +569XXXXXXXX");
    console.error("");
    console.error("Ejemplo:");
    console.error("  node scripts/test-whatsapp-send.js +56920103822");
    process.exit(1);
  }

  const message = "Prueba SendMe Studio WhatsApp OK " + new Date().toISOString().slice(0, 19).replace("T", " ");

  console.log("Enviando mensaje de prueba...");
  console.log("  Para:", to);
  console.log("  Mensaje:", message);
  console.log("");

  const result = await sendMessage(accessToken, phoneNumberId, to, message);

  console.log("Meta API response:");
  console.log("  Status:", result.status, result.statusText);

  if (result.status === 200 || result.status === 201) {
    const msgId =
      result.data?.messages?.[0]?.id || "(no messageId)";
    console.log("  ✅ MENSAJE ENVIADO EXITOSAMENTE");
    console.log("  waMessageId:", msgId);
    console.log("");
    console.log("Siguiente paso: Verificar en la store local:");
    console.log("  node -e \"var j=require('./data/whatsapp-store.json'); var m=j.messages.findLast(function(m){return m.waMessageId==='"+msgId+"'}); console.log(JSON.stringify(m,null,2))\"");
    process.exit(0);
  }

  // ── Error handling ──
  const error = result.data?.error || {};
  const errorCode = error.code || "?";
  const errorMessage = error.message || result.data?.raw || "Error desconocido";

  console.log("  ❌ ERROR:", errorMessage);

  if (result.status === 401 || errorCode === 190 || errorCode === "190") {
    console.log("");
    console.log("═══════════════════════════════════════════════════");
    console.log("  TOKEN EXPIRADO");
    console.log("═══════════════════════════════════════════════════");
    console.log("");
    console.log("  Causa: El token WHATSAPP_ACCESS_TOKEN ha expirado o es inválido.");
    console.log("  Código Meta:", errorCode, "-", error.type || "");
    console.log("");
    console.log("  Solución:");
    console.log("    1. Ir a Meta Business Settings → Users → System Users");
    console.log("    2. Crear System User con rol Admin (si no existe)");
    console.log("    3. Generar token con permisos:");
    console.log("       - whatsapp_business_messaging");
    console.log("       - whatsapp_business_management");
    console.log("    4. Copiar token a .env.local: WHATSAPP_ACCESS_TOKEN=<nuevo_token>");
    console.log("    5. NO usar Graph API Explorer (genera tokens temporales)");
    console.log("    6. Ejecutar de nuevo: node scripts/test-whatsapp-send.js " + to);
    console.log("");
  } else if (result.status === 400) {
    console.log("");
    console.log("  Posibles causas:");
    console.log("  - Número destino no es válido o no tiene WhatsApp");
    console.log("  - El número destino no ha optado en 24h");
    console.log("  - Payload incorrecto");
    console.log("  Detalle completo guardado en variable result.data");
  }

  process.exit(1);
}

main().catch((err) => {
  console.error("Error inesperado:", err.message);
  process.exit(1);
});
