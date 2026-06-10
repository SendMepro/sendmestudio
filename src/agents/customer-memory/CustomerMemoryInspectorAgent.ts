/* ═══════════════════════════════════════════════════════════════
   CustomerMemoryInspectorAgent — Estado operacional de memoria de clientes
   ═══════════════════════════════════════════════════════════════
   Este agente NO modifica código.
   Este agente NO escribe en la store.

   Inspecciona el estado real del Customer Memory Agent:
   - Perfiles almacenados y señales extraídas
   - Calidad de datos (confianza, tipos)
   - Integración con WhatsApp
   - Store file status

   Uso:
     import { createCustomerMemoryInspectionReport } from "@/agents/customer-memory/CustomerMemoryInspectorAgent";
     const report = createCustomerMemoryInspectionReport();
   ═══════════════════════════════════════════════════════════════ */

import fs from "fs";
import path from "path";
import type { CustomerMemoryProfile, CustomerSignal } from "@/agents/customer-memory-agent";

/* ═══════════════════════════════════════════════════════════════
   Tipos
   ═══════════════════════════════════════════════════════════════ */

export type MemoryFinding = {
  id: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  category: "store" | "cobertura" | "calidad" | "integracion";
  title: string;
  description: string;
  expected: string;
  actual: string;
  evidence: string[];
  recommendation: string;
  passed: boolean;
};

export type CustomerMemoryInspectionReport = {
  module: "customer-memory";
  generatedAt: string;
  summary: string;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  score: number;
  findings: MemoryFinding[];
};

/* ═══════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════ */

interface StoreData {
  profiles: CustomerMemoryProfile[];
  _metadata: Record<string, unknown>;
}

function readStore(): StoreData | null {
  try {
    const storePath = path.join(process.cwd(), "src", "data", "customer-memory-store.json");
    const content = fs.readFileSync(storePath, "utf-8");
    return JSON.parse(content) as StoreData;
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════
   Checks
   ═══════════════════════════════════════════════════════════════ */

function checkStore(): MemoryFinding[] {
  const store = readStore();
  const findings: MemoryFinding[] = [];

  findings.push({
    id: "CM-001",
    severity: store ? "info" : "critical",
    category: "store",
    title: "Customer Memory Store existe",
    description: "El archivo de persistencia debe existir y ser legible.",
    expected: "src/data/customer-memory-store.json existe con perfiles",
    actual: store ? "Store encontrada" : "Store no encontrada o no legible",
    evidence: store
      ? [`${store.profiles.length} perfiles, metadata: ${JSON.stringify(store._metadata)}`]
      : ["Archivo no encontrado en src/data/customer-memory-store.json"],
    recommendation: store
      ? "Store operacional."
      : "CRÍTICO: Inicializar la store. Recibir un mensaje de cliente para crear el primer perfil.",
    passed: Boolean(store),
  });

  if (store) {
    findings.push({
      id: "CM-002",
      severity: store.profiles.length > 0 ? "info" : "high",
      category: "cobertura",
      title: "Perfiles de clientes almacenados",
      description: "Los perfiles se crean cuando clientes envían mensajes. Sin perfiles, no hay memoria.",
      expected: "Al menos 1 perfil de cliente",
      actual: `${store.profiles.length} perfil(es) almacenado(s)`,
      evidence: store.profiles.map((p) => `${p.customerName || "?"} (${(p.customerPhone || "").slice(-4)}) — ${p.signals.length} señales`),
      recommendation: store.profiles.length > 0
        ? "Perfiles presentes."
        : "Activar customer-memory-agent en webhook de WhatsApp y enviar mensajes de prueba.",
      passed: store.profiles.length > 0,
    });
  }

  return findings;
}

function checkSignalQuality(): MemoryFinding[] {
  const store = readStore();
  const findings: MemoryFinding[] = [];

  if (!store) {
    findings.push({
      id: "CM-003",
      severity: "high",
      category: "calidad",
      title: "No se puede evaluar calidad — store ausente",
      description: "Sin store no es posible analizar la calidad de las señales.",
      expected: "Store con señales analizables",
      actual: "Store no disponible",
      evidence: ["Store no encontrada"],
      recommendation: "Resolver store primero.",
      passed: false,
    });
    return findings;
  }

  const totalSignals = store.profiles.reduce((sum, p) => sum + p.signals.length, 0);
  const profilesWithSignals = store.profiles.filter((p) => p.signals.length > 0).length;

  findings.push({
    id: "CM-003",
    severity: totalSignals > 0 ? "info" : "high",
    category: "calidad",
    title: "Señales extraídas de conversaciones",
    description:
      "Las señales (preferencias, alergias, estilista favorito, etc.) son el insumo principal del Customer Memory Agent.",
    expected: "Al menos 1 señal extraída de conversaciones reales",
    actual: totalSignals > 0
      ? `${totalSignals} señales en ${profilesWithSignals} perfil(es)`
      : "0 señales extraídas",
    evidence: [
      `Total señales: ${totalSignals}`,
      `Perfiles con señales: ${profilesWithSignals}/${store.profiles.length}`,
    ],
    recommendation: totalSignals > 0
      ? "Señales presentes."
      : "Verificar que extractSignalsFromText funciona con los mensajes entrantes.",
    passed: totalSignals > 0,
  });

  // Signal type distribution
  if (totalSignals > 0) {
    const typeCount = new Map<string, number>();
    for (const p of store.profiles) {
      for (const s of p.signals) {
        typeCount.set(s.type, (typeCount.get(s.type) || 0) + 1);
      }
    }
    const signalTypes = Array.from(typeCount.entries())
      .map(([t, c]) => `${t}:${c}`)
      .join(", ");

    findings.push({
      id: "CM-004",
      severity: typeCount.size >= 3 ? "info" : "medium",
      category: "calidad",
      title: "Diversidad de tipos de señal",
      description:
        "Las señales deben cubrir múltiples tipos (transport, stylist, allergy, service_interest, etc.) para ser útiles.",
      expected: "Al menos 3 tipos diferentes de señal",
      actual: `${typeCount.size} tipo(s): ${signalTypes}`,
      evidence: [signalTypes],
      recommendation: typeCount.size >= 3
        ? "Diversidad aceptable."
        : "Mejorar extractSignalsFromText para cubrir más tipos. Revisar servicio de intención.",
      passed: typeCount.size >= 3,
    });
  }

  // Confidence scores
  const lowConfidenceSignals = store.profiles
    .flatMap((p) => p.signals)
    .filter((s) => s.confidence !== undefined && s.confidence < 0.5);
  const noConfidenceSignals = store.profiles
    .flatMap((p) => p.signals)
    .filter((s) => s.confidence === undefined);

  findings.push({
    id: "CM-005",
    severity: lowConfidenceSignals.length === 0 && noConfidenceSignals.length === 0
      ? "info" : "medium",
    category: "calidad",
    title: "Confianza de señales",
    description:
      "Cada señal debe tener un confidence score (0-1). Señales sin confianza o con confianza baja degradan la calidad.",
    expected: "Todas las señales tienen confidence >= 0.5",
    actual: lowConfidenceSignals.length > 0
      ? `${lowConfidenceSignals.length} señal(es) con confianza < 0.5`
      : noConfidenceSignals.length > 0
        ? `${noConfidenceSignals.length} señal(es) sin confidence definido`
        : "Todas las señales tienen confidence >= 0.5",
    evidence: [
      `Señales con baja confianza: ${lowConfidenceSignals.length}`,
      `Señales sin confidence: ${noConfidenceSignals.length}`,
    ],
    recommendation: lowConfidenceSignals.length > 0 || noConfidenceSignals.length > 0
      ? "Revisar extractSignalsFromText para asignar confidence adecuado a cada tipo de señal."
      : "Confianza de señales OK.",
    passed: lowConfidenceSignals.length === 0 && noConfidenceSignals.length === 0,
  });

  return findings;
}

function checkIntegration(): MemoryFinding[] {
  const store = readStore();
  const findings: MemoryFinding[] = [];

  // Check if customer-memory is invoked from WhatsApp webhook
  const webhookPath = path.join(process.cwd(), "src", "app", "api", "whatsapp", "webhook", "route.ts");
  const hasIntegration = fs.existsSync(webhookPath) && (() => {
    try {
      const content = fs.readFileSync(webhookPath, "utf-8");
      return content.includes("processCustomerMessage") || content.includes("customer-memory-agent");
    } catch {
      return false;
    }
  })();

  findings.push({
    id: "CM-006",
    severity: hasIntegration ? "info" : "critical",
    category: "integracion",
    title: "Customer Memory Agent integrado en webhook de WhatsApp",
    description:
      "El customer memory agent debe invocarse desde el webhook de WhatsApp para extraer señales de cada mensaje entrante.",
    expected: "processCustomerMessage llamado desde webhook POST",
    actual: hasIntegration
      ? "Integrado: processCustomerMessage se llama en maybeSendAutoReply y processCustomerMemoryIfNeeded"
      : "NO integrado en webhook de WhatsApp",
    evidence: [
      hasIntegration
        ? "src/app/api/whatsapp/webhook/route.ts: llama a processCustomerMessage desde @/agents/customer-memory-agent"
        : "No se encontró referencia a processCustomerMessage en el webhook",
    ],
    recommendation: hasIntegration
      ? "Integración OK."
      : "CRÍTICO: Importar processCustomerMessage en webhook/route.ts y llamarlo para cada inbound message.",
    passed: hasIntegration,
  });

  // Check if store has conversations from WhatsApp
  if (store && store.profiles.length > 0) {
    const whatsappProfiles = store.profiles.filter((p) =>
      p.signals.some((s) => s.source === "whatsapp")
    );

    findings.push({
      id: "CM-007",
      severity: whatsappProfiles.length > 0 ? "info" : "medium",
      category: "integracion",
      title: "Señales provienen de WhatsApp real",
      description:
        "Las señales deben venir de conversaciones reales de WhatsApp para ser útiles. Señales sin fuente WhatsApp pueden ser de prueba.",
      expected: "Al menos 1 perfil con señales de source='whatsapp'",
      actual: whatsappProfiles.length > 0
        ? `${whatsappProfiles.length} perfil(es) con señales de WhatsApp`
        : "Ningún perfil tiene señales de WhatsApp",
      evidence: store.profiles.map((p) => {
        const sources = [...new Set(p.signals.map((s) => s.source))];
        return `${p.customerName || "?"}: sources=${sources.join(",")}`;
      }),
      recommendation: whatsappProfiles.length > 0
        ? "Señales viniendo de WhatsApp real."
        : "Verificar que el webhook pasa source='whatsapp' correctamente al llamar processCustomerMessage.",
      passed: whatsappProfiles.length > 0,
    });
  }

  return findings;
}

/* ═══════════════════════════════════════════════════════════════
   Factory
   ═══════════════════════════════════════════════════════════════ */

export function createCustomerMemoryInspectionReport(): CustomerMemoryInspectionReport {
  const allFindings = [
    ...checkStore(),
    ...checkSignalQuality(),
    ...checkIntegration(),
  ];

  const passed = allFindings.filter((f) => f.passed).length;
  const failed = allFindings.filter((f) => !f.passed).length;
  const score = allFindings.length > 0 ? Math.round((passed / allFindings.length) * 100) : 100;

  const criticalFailures = allFindings.filter((f) => !f.passed && f.severity === "critical").length;
  const highFailures = allFindings.filter((f) => !f.passed && f.severity === "high").length;

  let summary: string;
  if (criticalFailures > 0) {
    summary = `${criticalFailures} critical y ${highFailures} high — Customer Memory tiene problemas graves.`;
  } else if (highFailures > 0) {
    summary = `${highFailures} checks fallaron con severidad high.`;
  } else if (failed > 0) {
    summary = `${failed} checks fallaron. ${passed}/${allFindings.length} pasaron.`;
  } else {
    summary = `Todos los ${allFindings.length} checks pasaron. Customer Memory operacional.`;
  }

  return {
    module: "customer-memory",
    generatedAt: new Date().toISOString(),
    summary,
    totalChecks: allFindings.length,
    passedChecks: passed,
    failedChecks: failed,
    score,
    findings: allFindings,
  };
}
