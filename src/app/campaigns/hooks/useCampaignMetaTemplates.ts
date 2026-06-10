"use client";

import { useState, useCallback, useEffect } from "react";
import type { CampaignTemplate } from "../templateWorkflow";

export type MetaWhatsAppTemplate = {
  id: string;
  campaignId: string;
  name: string;
  category: "marketing" | "utility";
  language: "es";
  body: string;
  variablesPreview: string[];
  status: "draft" | "submitted" | "approved" | "rejected";
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
};

export const META_TEMPLATE_STATUS_LABELS: Record<MetaWhatsAppTemplate["status"], string> = {
  draft: "Borrador",
  submitted: "Enviado",
  approved: "Aprobado",
  rejected: "Rechazado",
};

export function useCampaignMetaTemplates(currentEditorBody: string) {
  const [metaTemplates, setMetaTemplates] = useState<MetaWhatsAppTemplate[]>([]);
  const [activeMetaTemplateId, setActiveMetaTemplateId] = useState("");

  const activeMetaTemplate =
    metaTemplates.find((t) => t.id === activeMetaTemplateId) ?? metaTemplates[0] ?? null;

  const loadMetaTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/meta-templates");
      const data = await res.json();
      setMetaTemplates(Array.isArray(data.templates) ? data.templates : []);
    } catch {
      setMetaTemplates([]);
    }
  }, []);

  useEffect(() => {
    void loadMetaTemplates();
  }, [loadMetaTemplates]);

  const createMetaTemplateFromCampaign = useCallback(async (activeTemplate: CampaignTemplate | null) => {
    if (!activeTemplate) return;
    const body = currentEditorBody.trim();
    if (!body) return;

    const res = await fetch("/api/meta-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaignId: activeTemplate.id,
        name: activeTemplate.title,
        title: activeTemplate.title,
        category: "marketing",
        body,
      }),
    });
    const data = await res.json();
    if (data.template) {
      setMetaTemplates((prev) => [data.template, ...prev]);
      setActiveMetaTemplateId(data.template.id);
    }
  }, [currentEditorBody]);

  const updateStatus = useCallback(async (
    templateId: string,
    status: MetaWhatsAppTemplate["status"],
    rejectionReason?: string
  ) => {
    const res = await fetch("/api/meta-templates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: templateId, status, rejectionReason }),
    });
    const data = await res.json();
    if (data.template) {
      setMetaTemplates((prev) => prev.map((t) => (t.id === data.template.id ? data.template : t)));
      setActiveMetaTemplateId(data.template.id);
    }
  }, []);

  const updateDraft = useCallback(async (
    templateId: string,
    updates: Partial<Pick<MetaWhatsAppTemplate, "name" | "category" | "body">>
  ) => {
    const res = await fetch("/api/meta-templates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: templateId, ...updates, status: "draft" }),
    });
    const data = await res.json();
    if (data.template) {
      setMetaTemplates((prev) => prev.map((t) => (t.id === data.template.id ? data.template : t)));
      setActiveMetaTemplateId(data.template.id);
    }
  }, []);

  return {
    metaTemplates,
    setMetaTemplates,
    activeMetaTemplateId,
    setActiveMetaTemplateId,
    activeMetaTemplate,
    loadMetaTemplates,
    createMetaTemplateFromCampaign,
    updateMetaTemplateStatus: updateStatus,
    updateMetaTemplateDraft: updateDraft,
  };
}
