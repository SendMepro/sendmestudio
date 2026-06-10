"use client";

import { useState, useMemo, useEffect } from "react";
import type { CustomerProfile, AudienceSegment } from "./useCampaignAudience";

export type ComplianceAction = "launch" | "submit" | "info" | "meta-submit";
export type CampaignRisk = {
  level: "Low Risk" | "Medium Risk" | "High Risk";
  score: number;
  flags: string[];
};
export type TemplateHealthRecord = {
  id: string;
  templateId: string;
  action: ComplianceAction | "approved" | "rejected";
  riskLevel: CampaignRisk["level"];
  rejectionReason?: string;
  timestamp: string;
};
export type WhatsAppCampaignConversation = {
  phone: string;
  lastInboundAt?: string;
};

const TEMPLATE_HEALTH_KEY = "campaigns:template-health-history";
const PLATFORM_HEALTH_ACK_KEY = "campaigns:platform-health-acknowledged";
const WHATSAPP_SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000;

function timestampToMs(timestamp?: string) {
  if (!timestamp) return null;
  if (/^\d+$/.test(timestamp)) return Number(timestamp) * 1000;
  const parsed = Date.parse(timestamp);
  return Number.isNaN(parsed) ? null : parsed;
}

function isInsideServiceWindow(lastInboundAt?: string) {
  const lastInboundMs = timestampToMs(lastInboundAt);
  return Boolean(lastInboundMs && Date.now() - lastInboundMs < WHATSAPP_SERVICE_WINDOW_MS);
}

function normalizePhoneForWindow(phone: string) {
  return phone.replace(/\D/g, "");
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function readPlatformHealthAcknowledged(date = todayKey()) {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(PLATFORM_HEALTH_ACK_KEY) === date;
}

function writePlatformHealthAcknowledged(date = todayKey()) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PLATFORM_HEALTH_ACK_KEY, date);
}

function readTemplateHealthHistory(): TemplateHealthRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(TEMPLATE_HEALTH_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeTemplateHealthRecord(record: Omit<TemplateHealthRecord, "id" | "timestamp">) {
  if (typeof window === "undefined") return [];
  const history = readTemplateHealthHistory();
  const nextHistory = [
    { id: `template-health-${Date.now()}`, timestamp: new Date().toISOString(), ...record },
    ...history,
  ].slice(0, 80);
  window.localStorage.setItem(TEMPLATE_HEALTH_KEY, JSON.stringify(nextHistory));
  return nextHistory;
}

function hasCampaignConsent(customer: CustomerProfile) {
  return customer.consentWhatsapp === true;
}

export function analyzeCampaignRisk(body: string, selectedAudience: AudienceSegment[], customers: CustomerProfile[]): CampaignRisk {
  const text = body.toLowerCase();
  const emojiCount = [...body].filter((char) => /\p{Extended_Pictographic}/u.test(char)).length;
  const links = body.match(/https?:\/\/|www\./gi)?.length ?? 0;
  const invalidVariables = body.match(/{{\s*[a-zA-Z_][^}]*}}/g)?.length ?? 0;
  const contactsWithoutConsent = customers.filter((customer) => !hasCampaignConsent(customer)).length;
  const flags: string[] = [];
  let score = 8;

  if (/(últimos cupos|ultimos cupos|compra ya|solo hoy|urgente|imperdible|apúrate|apurate)/i.test(text)) {
    flags.push("aggressive urgency");
    score += 28;
  }
  if (/(garantizado|100% seguro|resultado perfecto|promesa)/i.test(text)) {
    flags.push("fake promises / overpromising");
    score += 20;
  }
  if (emojiCount > 8) { flags.push("too many emojis"); score += 16; }
  if (links > 1) { flags.push("suspicious links"); score += 14; }
  if (invalidVariables > 0) { flags.push("invalid variables"); score += 18; }
  if (contactsWithoutConsent > 0 && selectedAudience.some((s) => s.contacts > 0)) {
    flags.push("contacts without consent"); score += 22;
  }
  if (body.length > 950) { flags.push("suspicious formatting / long copy"); score += 12; }

  return {
    level: score >= 62 ? "High Risk" : score >= 32 ? "Medium Risk" : "Low Risk",
    score: Math.min(score, 100),
    flags: flags.length > 0 ? flags : ["editorial tone looks compliant"],
  };
}

export function useCampaignSafety(
  customers: CustomerProfile[],
  selectedAudience: AudienceSegment[],
  currentEditorBody: string,
  activeMetaTemplate: { id: string; status: string } | null,
) {
  const [whatsAppConversations, setWhatsAppConversations] = useState<WhatsAppCampaignConversation[]>([]);
  const [isSafetyGateOpen, setIsSafetyGateOpen] = useState(false);
  const [testContactPhone, setTestContactPhone] = useState("");
  const [safetyGateNote, setSafetyGateNote] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isPlatformHealthChecked, setIsPlatformHealthChecked] = useState(false);
  const [pendingComplianceAction, setPendingComplianceAction] = useState<ComplianceAction | null>(null);
  const [campaignGateModal, setCampaignGateModal] = useState<"audience" | "template" | "consent" | null>(null);
  const [, setTemplateHealthHistory] = useState<TemplateHealthRecord[]>([]);

  const consentSummary = useMemo(() => {
    const authorized = customers.filter(hasCampaignConsent);
    const pending = customers.filter((c) => !hasCampaignConsent(c));
    return { authorized, pending, authorizedCount: authorized.length, pendingCount: pending.length, excludedCount: pending.length };
  }, [customers]);

  const isSelectedMetaTemplateApproved = activeMetaTemplate?.status === "approved";

  const safetySummary = useMemo(() => {
    const conversationsByPhone = new Map(whatsAppConversations.map((c) => [normalizePhoneForWindow(c.phone), c]));
    const authorized = consentSummary.authorized;
    const outsideWindow = authorized.filter((c) => !isInsideServiceWindow(conversationsByPhone.get(normalizePhoneForWindow(c.phone))?.lastInboundAt));
    const insideWindow = authorized.length - outsideWindow.length;
    const templateBlocked = outsideWindow.length > 0 && !isSelectedMetaTemplateApproved;
    const exclusions = [
      ...consentSummary.pending.map((c) => ({ customerId: c.id, phone: c.phone, firstName: c.firstName, reason: "consentimiento_whatsapp_pendiente" })),
      ...(templateBlocked ? outsideWindow.map((c) => ({ customerId: c.id, phone: c.phone, firstName: c.firstName, reason: "fuera_de_24h_requiere_plantilla_meta_aprobada" })) : []),
    ];
    return {
      authorized: consentSummary.authorized, pendingConsent: consentSummary.pending,
      authorizedCount: authorized.length, pendingConsentCount: consentSummary.pendingCount,
      outsideWindow, outsideWindowCount: outsideWindow.length, insideWindowCount: insideWindow,
      requiresTemplateCount: outsideWindow.length, templateBlocked, exclusions, excludedCount: exclusions.length,
    };
  }, [consentSummary, isSelectedMetaTemplateApproved, whatsAppConversations]);

  const campaignRisk = useMemo(
    () => analyzeCampaignRisk(currentEditorBody, selectedAudience, customers),
    [currentEditorBody, customers, selectedAudience]
  );

  // Load WhatsApp conversations
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/whatsapp/messages?markSeen=false", { cache: "no-store" });
        const data = await res.json();
        setWhatsAppConversations(Array.isArray(data.conversations) ? data.conversations.map((c: WhatsAppCampaignConversation) => ({ phone: c.phone, lastInboundAt: c.lastInboundAt })) : []);
      } catch { setWhatsAppConversations([]); }
    };
    void load();
    const timer = window.setInterval(load, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  // Load template health history
  useEffect(() => {
    void (async () => setTemplateHealthHistory(readTemplateHealthHistory()))();
  }, []);

  // Daily platform health check
  useEffect(() => {
    void (async () => {
      if (!readPlatformHealthAcknowledged()) {
        setIsPlatformHealthChecked(false);
        setPendingComplianceAction("info");
      }
    })();
  }, []);

  return {
    consentSummary, safetySummary, campaignRisk,
    isSafetyGateOpen, setIsSafetyGateOpen,
    testContactPhone, setTestContactPhone,
    safetyGateNote, setSafetyGateNote,
    isSendingTest,
    isPlatformHealthChecked, setIsPlatformHealthChecked,
    pendingComplianceAction, setPendingComplianceAction,
    campaignGateModal, setCampaignGateModal,
    isSelectedMetaTemplateApproved,
    recordCampaignSafetyAction: (action: "launch_safety_review" | "test_send", extra: Record<string, unknown> = {}) => {
      void fetch("/api/campaign-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      }).catch(() => undefined);
    },
    submitTemplateHealthRecord: (templateId: string, action: ComplianceAction | "approved" | "rejected", riskLevel: CampaignRisk["level"]) => {
      setTemplateHealthHistory(writeTemplateHealthRecord({ templateId, action, riskLevel }));
    },
    handleComplianceOk: () => {
      writePlatformHealthAcknowledged();
      if (pendingComplianceAction === "info") {
        setPendingComplianceAction(null);
        return;
      }
      const action = pendingComplianceAction;
      setPendingComplianceAction(null);
      if (action === "meta-submit") {
        // caller must handle meta-submit after compliance
      }
    },
    closeComplianceModal: () => setPendingComplianceAction(null),
    handleLaunchCampaign: () => {
      if (customers.length === 0) { setCampaignGateModal("audience"); return; }
      setTestContactPhone(consentSummary.authorized[0]?.phone ?? "");
      setSafetyGateNote("");
      setIsSafetyGateOpen(true);
    },
    handleTestSend: async () => {
      if (!currentEditorBody.trim()) { setSafetyGateNote("El copy está vacío. Escribe un mensaje antes de enviar una prueba."); return; }
      const contact = safetySummary.authorized.find((c) => c.phone === testContactPhone);
      if (!contact) { setSafetyGateNote("Selecciona un contacto con consentimiento confirmado para enviar prueba."); return; }
      const conversation = whatsAppConversations.find((c) => normalizePhoneForWindow(c.phone) === normalizePhoneForWindow(contact.phone));
      if (!isInsideServiceWindow(conversation?.lastInboundAt) && !isSelectedMetaTemplateApproved) {
        setSafetyGateNote("Este contacto está fuera de 24h. Selecciona una plantilla Meta aprobada antes del test.");
        return;
      }
      setIsSendingTest(true);
      setSafetyGateNote("");
      try {
        const res = await fetch("/api/whatsapp/send", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: contact.phone, text: currentEditorBody }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          const detail = [data.statusCode ? `HTTP ${data.statusCode}` : "", data.metaError?.code ? `code ${data.metaError.code}` : "", data.metaError?.error_subcode ? `subcode ${data.metaError.error_subcode}` : "", data.metaError?.message || data.errorMessage || data.error || "No se pudo enviar la prueba."].filter(Boolean).join(" · ");
          throw new Error(`${detail}\nMeta response: ${JSON.stringify(data.metaResponse ?? data)}`);
        }
        setSafetyGateNote("Prueba enviada a un contacto autorizado. El envío masivo sigue desactivado.");
      } catch (error) {
        console.error("Campaign test send failed", error);
        setSafetyGateNote(error instanceof Error ? error.message : "No se pudo enviar la prueba.");
      } finally { setIsSendingTest(false); }
    },
  };
}
