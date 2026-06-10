"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import type { ChangeEvent } from "react";

export type CustomerProfile = {
  id: string;
  phone: string;
  firstName: string;
  tags: string[];
  requestedServices: string[];
  lastVisit: string | null;
  uploadedAssets: string[];
  campaignEligible: boolean;
  consentWhatsapp?: boolean;
  lifecycleStage: string;
};

export type AudienceSegment = {
  id: string;
  label: string;
  contacts: number;
  warmScore: number;
  engagement: number;
  affinity: string;
};

const AUDIENCE_SEGMENTS: AudienceSegment[] = [
  { id: "vip-blondes", label: "VIP rubias", contacts: 1248, warmScore: 94, engagement: 71, affinity: "Lujo" },
  { id: "balayage-interest", label: "Interés balayage", contacts: 876, warmScore: 88, engagement: 64, affinity: "Editorial" },
  { id: "inactive-clients", label: "Inactivas", contacts: 542, warmScore: 46, engagement: 31, affinity: "Cálido" },
  { id: "new-leads", label: "Nuevas", contacts: 318, warmScore: 68, engagement: 44, affinity: "Descubrimiento" },
  { id: "sent-image-no-booking", label: "Foto sin reserva", contacts: 137, warmScore: 82, engagement: 58, affinity: "Caliente" },
  { id: "high-spending", label: "Alto gasto", contacts: 214, warmScore: 91, engagement: 73, affinity: "VIP" },
  { id: "last-visit-60", label: "Última visita > 60 días", contacts: 389, warmScore: 52, engagement: 37, affinity: "Reactivación" },
  { id: "warm-leads", label: "Leads cálidos", contacts: 621, warmScore: 79, engagement: 55, affinity: "Cálido" },
  { id: "existing-clients", label: "Clientas actuales", contacts: 1588, warmScore: 74, engagement: 62, affinity: "Confianza" },
  { id: "color-clients", label: "Clientas color", contacts: 706, warmScore: 86, engagement: 67, affinity: "Color" },
  { id: "hair-repair", label: "Interés reparación", contacts: 453, warmScore: 81, engagement: 59, affinity: "Cuidado" },
];

function hasCampaignConsent(customer: CustomerProfile) {
  return customer.consentWhatsapp === true;
}

export function buildAudienceSegments(customers: CustomerProfile[]): AudienceSegment[] {
  if (customers.length === 0) {
    return AUDIENCE_SEGMENTS;
  }

  const eligible = customers.filter(hasCampaignConsent);
  const hasTag = (customer: CustomerProfile, tag: string) => customer.tags.includes(tag);
  const hasService = (customer: CustomerProfile, service: string) =>
    customer.requestedServices.includes(service) || customer.tags.includes(`${service}-interest`);
  const olderThan60 = new Date();
  olderThan60.setDate(olderThan60.getDate() - 60);
  const count = (filter: (customer: CustomerProfile) => boolean) => eligible.filter(filter).length;
  const total = eligible.length;

  return [
    { id: "vip-blondes", label: "VIP rubias", contacts: count((customer) => hasTag(customer, "vip") && (hasService(customer, "balayage") || hasService(customer, "color"))), warmScore: 94, engagement: 71, affinity: "Lujo" },
    { id: "balayage-interest", label: "Interés balayage", contacts: count((customer) => hasService(customer, "balayage")), warmScore: 88, engagement: 64, affinity: "Editorial" },
    { id: "inactive-clients", label: "Inactivas", contacts: count((customer) => Boolean(customer.lastVisit) && new Date(customer.lastVisit as string) < olderThan60), warmScore: 46, engagement: 31, affinity: "Cálido" },
    { id: "new-leads", label: "Nuevas", contacts: count((customer) => customer.lifecycleStage === "new" || customer.lifecycleStage === "imported"), warmScore: 68, engagement: 44, affinity: "Descubrimiento" },
    { id: "sent-image-no-booking", label: "Foto sin reserva", contacts: count((customer) => customer.uploadedAssets.length > 0 && !customer.lastVisit), warmScore: 82, engagement: 58, affinity: "Caliente" },
    { id: "high-spending", label: "Alto gasto", contacts: count((customer) => hasTag(customer, "vip") || hasTag(customer, "high-spending")), warmScore: 91, engagement: 73, affinity: "VIP" },
    { id: "last-visit-60", label: "Última visita > 60 días", contacts: count((customer) => Boolean(customer.lastVisit) && new Date(customer.lastVisit as string) < olderThan60), warmScore: 52, engagement: 37, affinity: "Reactivación" },
    { id: "warm-leads", label: "Leads cálidos", contacts: count((customer) => hasTag(customer, "lead-hot") || hasTag(customer, "warm") || customer.requestedServices.length > 0), warmScore: 79, engagement: 55, affinity: "Cálido" },
    { id: "existing-clients", label: "Clientas actuales", contacts: total, warmScore: 74, engagement: 62, affinity: "Confianza" },
    { id: "color-clients", label: "Clientas color", contacts: count((customer) => hasService(customer, "color") || hasService(customer, "balayage")), warmScore: 86, engagement: 67, affinity: "Color" },
    { id: "hair-repair", label: "Interés reparación", contacts: count((customer) => hasService(customer, "olaplex") || hasService(customer, "hidratacion") || hasService(customer, "hidratación") || hasService(customer, "hair repair")), warmScore: 81, engagement: 59, affinity: "Cuidado" },
  ];
}

export function consentSummaryFor(customers: CustomerProfile[]) {
  const authorized = customers.filter(hasCampaignConsent);
  const pending = customers.filter((customer) => !hasCampaignConsent(customer));

  return {
    authorized,
    pending,
    authorizedCount: authorized.length,
    pendingCount: pending.length,
    excludedCount: pending.length,
  };
}

export function useCampaignAudience() {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [selectedAudienceIds] = useState<string[]>(["vip-blondes", "balayage-interest"]);
  const [contactsImportSummary, setContactsImportSummary] = useState("Aún no hay contactos importados");
  const [isImportingContacts, setIsImportingContacts] = useState(false);
  const contactsImportInputRef = useRef<HTMLInputElement | null>(null);

  const audienceSegments = useMemo(() => buildAudienceSegments(customers), [customers]);
  const selectedAudience = useMemo(
    () => audienceSegments.filter((segment) => selectedAudienceIds.includes(segment.id)),
    [audienceSegments, selectedAudienceIds]
  );
  const audienceTotal = selectedAudience.reduce((total, segment) => total + segment.contacts, 0);
  const consentSummary = useMemo(() => consentSummaryFor(customers), [customers]);

  const loadCampaignCustomers = useCallback(async () => {
    try {
      const response = await fetch("/api/customers");
      const data = await response.json();
      const nextCustomers = Array.isArray(data.customers) ? data.customers : [];
      setCustomers(nextCustomers);
      setContactsImportSummary(`${nextCustomers.length.toLocaleString()} contactos disponibles`);
    } catch {
      setCustomers([]);
    }
  }, []);

  useEffect(() => {
    const loadInitialCustomers = async () => {
      await loadCampaignCustomers();
    };

    void loadInitialCustomers();
  }, [loadCampaignCustomers]);

  const handleContactsImport = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setIsImportingContacts(true);

    try {
      const response = await fetch("/api/customers/import", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Import failed");
      }

      setCustomers(Array.isArray(data.customers) ? data.customers : []);
      setContactsImportSummary(
        `${Number(data.imported ?? 0).toLocaleString()} importados · ${Number(data.total ?? 0).toLocaleString()} total`
      );
    } catch (error) {
      console.error("Contacts import failed", error);
      setContactsImportSummary("Importación fallida · revisa columnas CSV/XLSX");
    } finally {
      setIsImportingContacts(false);
      event.target.value = "";
    }
  }, []);

  const handleWspContactsImport = useCallback(async () => {
    setIsImportingContacts(true);

    try {
      const response = await fetch("/api/customers/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "wsp" }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Import failed");
      }

      setCustomers(Array.isArray(data.customers) ? data.customers : []);
      setContactsImportSummary(
        `${Number(data.imported ?? 0).toLocaleString()} importados desde /wsp · ${Number(data.total ?? 0).toLocaleString()} total`
      );
    } catch (error) {
      console.error("WSP contacts import failed", error);
      setContactsImportSummary("No se encontraron CSV/XLSX válidos en /wsp");
    } finally {
      setIsImportingContacts(false);
    }
  }, []);

  return {
    customers,
    setCustomers,
    selectedAudienceIds,
    audienceSegments,
    selectedAudience,
    audienceTotal,
    consentSummary,
    contactsImportSummary,
    isImportingContacts,
    contactsImportInputRef,
    loadCampaignCustomers,
    handleContactsImport,
    handleWspContactsImport,
  };
}
