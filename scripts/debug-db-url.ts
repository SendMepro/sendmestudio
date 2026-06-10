// ================================================================
// debug-db-url.ts — Diagnóstico de DATABASE_URL / DIRECT_URL
// Uso: npx tsx scripts/debug-db-url.ts
// Muestra cada componente de la connection string sin exponer passwords.
// ================================================================

import * as fs from "fs";
import * as path from "path";

// 1. Cargar entorno igual que Prisma: prisma/.env -> .env.local
const prismaEnvPath = path.join(process.cwd(), "prisma", ".env");
const localEnvPath = path.join(process.cwd(), ".env.local");

let loadedFrom = "ninguno";

if (fs.existsSync(prismaEnvPath)) {
  const contents = fs.readFileSync(prismaEnvPath, "utf-8");
  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        // Strip surrounding quotes
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
  loadedFrom = "prisma/.env";
} else if (fs.existsSync(localEnvPath)) {
  const contents = fs.readFileSync(localEnvPath, "utf-8");
  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
  loadedFrom = ".env.local";
}

console.log("=".repeat(70));
console.log("  DIAGNÓSTICO DATABASE_URL");
console.log("=".repeat(70));
console.log(`  Cargado desde: ${loadedFrom}`);
console.log();

// 2. Analizar cada URL
function analyzeUrl(label: string, url: string | undefined) {
  console.log(`\n── ${label} ──`);
  if (!url) {
    console.log("  ❌ No definida");
    return;
  }

  // Parse manual para evitar que el parser nativo falle con formatos inválidos
  console.log(`  RAW length: ${url.length}`);
  console.log(`  RAW (masked): ${maskPassword(url)}`);

  // Verificar caracteres problemáticos
  const problematic = findProblematicChars(url);
  if (problematic.length > 0) {
    console.log(`  ⚠️  Caracteres sospechosos encontrados: [${problematic.join(", ")}]`);
  }

  // Parse básico
  try {
    const u = new URL(url);
    console.log(`  Protocolo:    ${u.protocol}`);
    console.log(`  Username:     ${u.username}`);
    console.log(`  Password len: ${u.password.length} chars`);
    console.log(`  Hostname:     ${u.hostname}`);
    console.log(`  Port:         ${u.port || "(default)"}`);
    console.log(`  Pathname:     ${u.pathname}`);
    console.log(`  Search:       ${u.search || "(none)"}`);

    if (!u.port) {
      console.log(`  ❌ ERROR: No hay puerto explícito. Prisma necesita puerto.`);
    } else if (isNaN(parseInt(u.port))) {
      console.log(`  ❌ ERROR: Puerto "${u.port}" no es número válido → P1013`);
    } else {
      console.log(`  ✅ Puerto OK: ${u.port}`);
    }
  } catch (e: any) {
    console.log(`  ❌ ERROR PARSING: ${e.message}`);
    console.log(`     Posible causa: password contiene caracteres no escapados`);
    console.log(`     Sugerencia: URL-encode manual de la password o usar Supabase connection string original`);
  }
}

analyzeUrl("DATABASE_URL", process.env.DATABASE_URL);
analyzeUrl("DIRECT_URL", process.env.DIRECT_URL);

// 3. Diagnóstico de causa raíz
console.log("\n" + "=".repeat(70));
console.log("  🧠 POSIBLES CAUSAS");
console.log("=".repeat(70));

const dbUrl = process.env.DATABASE_URL || "";
const dirUrl = process.env.DIRECT_URL || "";

// Check 1: password contiene @ no escapado
const passMatch = dbUrl.match(/\/\/([^:]+):([^@]+)@/);
if (passMatch) {
  const password = passMatch[2];
  if (password.includes("@")) {
    console.log(`  ❌ El password contiene '@' sin escapar en DATABASE_URL`);
    console.log(`     Reemplaza '@' por '%40' en el password`);
  }
  if (password.includes(":")) {
    console.log(`  ❌ El password contiene ':' sin escapar en DATABASE_URL`);
    console.log(`     Reemplaza ':' por '%3A' en el password`);
  }
}

// Check 2: formato general
const validFormat = /^postgresql:\/\/[^:]+:[^@]+@[^:]+:\d+\//;
if (!validFormat.test(dbUrl)) {
  console.log(`  ❌ Formato general inválido`);
  console.log(`     Se espera: postgresql://user:password@host:port/database`);
} else {
  console.log(`  ✅ Formato general OK`);
}

// Check 3: verificar que prisma/.env existe y es igual
if (fs.existsSync(prismaEnvPath)) {
  const prismaContent = fs.readFileSync(prismaEnvPath, "utf-8");
  const prismaHasUrl = prismaContent.includes("DATABASE_URL");
  const prismaHasDirect = prismaContent.includes("DIRECT_URL");
  console.log(`  📄 prisma/.env: DATABASE_URL=${prismaHasUrl ? "✅ presente" : "❌ ausente"}, DIRECT_URL=${prismaHasDirect ? "✅ presente" : "❌ ausente"}`);
} else {
  console.log(`  ❌ prisma/.env no existe`);
}

// Check 4: .env.local tiene las URLs
if (fs.existsSync(localEnvPath)) {
  const localContent = fs.readFileSync(localEnvPath, "utf-8");
  const localHasUrl = localContent.includes("DATABASE_URL");
  const localHasDirect = localContent.includes("DIRECT_URL");
  console.log(`  📄 .env.local: DATABASE_URL=${localHasUrl ? "✅ presente" : "❌ ausente"}, DIRECT_URL=${localHasDirect ? "✅ presente" : "❌ ausente"}`);
}

console.log("\n" + "=".repeat(70));
console.log("  ✅ SUGERENCIA FINAL");
console.log("=".repeat(70));
console.log(`  Si el problema es password mal escapado:`);
console.log(`  1. Ve a https://supabase.com/dashboard/project/peyujymnlntxqygrhqlw/settings/database`);
console.log(`  2. En "Connection string", copia la URI completa.`);
console.log(`  3. La password RAW viene ahí. ÚSALA directamente en ambos .env`);
console.log(`  4. Reemplaza en .env.local y prisma/.env`);

function maskPassword(url: string): string {
  return url.replace(/\/\/([^:]+):([^@]+)@/, (_, user, pass) => {
    return `//${user}:${"*".repeat(pass.length > 4 ? pass.length - 4 : pass.length)}${pass.slice(-4)}@`;
  });
}

function findProblematicChars(url: string): string[] {
  const found: string[] = [];
  // Check chars after :password part
  const atIdx = url.lastIndexOf("@");
  const colonAfterProtocol = url.indexOf("://");
  if (colonAfterProtocol >= 0 && atIdx > colonAfterProtocol) {
    const userinfo = url.slice(colonAfterProtocol + 3, atIdx);
    if (userinfo.includes("%")) found.push("%XX escapes in userinfo — can confuse URL parser");
  }
  // Check raw chars that should be encoded in password
  const passPart = url.match(/\/\/([^:]+):([^@]+)@/);
  if (passPart) {
    const pw = passPart[2];
    if (pw.includes("@")) found.push("@ sin escapar en password");
    if (pw.includes(":")) found.push(": sin escapar en password");
    if (pw.includes("/")) found.push("/ sin escapar en password");
    if (pw.includes("#")) found.push("# sin escapar en password");
    if (pw.includes("?")) found.push("? sin escapar en password");
    if (pw.includes(" ")) found.push("espacio en password");
  }
  return found;
}
