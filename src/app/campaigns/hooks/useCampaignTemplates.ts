"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  type CampaignTemplate,
  type MetaTemplateStatus,
  defaultCampaignTemplates,
  deleteCampaignTemplate,
  loadCampaignTemplates,
  saveCampaignTemplate,
  submitTemplateToMeta,
  updateMetaTemplateStatus,
} from "../templateWorkflow";

export type NarrativeVersion = "luxury" | "instagram" | "whatsapp";
export type CampaignMode = "manual" | "ai";

const TARGET_OPTIONS = ["VIP Muses Selection", "Classic Guests"];

const POST_STYLE_OPTIONS = [
  { id: "luxury", label: "Tono lujo", version: "luxury" as const },
  { id: "instagram", label: "Instagram", version: "instagram" as const },
  { id: "whatsapp", label: "WhatsApp", version: "whatsapp" as const },
  { id: "regenerate", label: "Nueva idea", version: null },
];

function generateLuxuryNarrativePost({
  campaignTitle,
  targetAudience,
  version = "luxury",
  mode = "manual",
  salonName = "SendMe Studio",
}: {
  campaignTitle: string;
  targetAudience: string;
  version?: NarrativeVersion;
  mode?: CampaignMode;
  salonName?: string;
}) {
  const normalizedTitle = campaignTitle.trim() || "Ritual Balayage Lumiere";
  const title = normalizedTitle.toLowerCase();
  const isOlaplex = title.includes("olaplex");
  const isSunset = title.includes("sunset") || title.includes("cocktail");
  const isClassicAudience = targetAudience === "Classic Guests";
  const serviceHashtags = isOlaplex
    ? "#Olaplex #HealthyHair #LuxurySalon #HairCare #GlossHair"
    : isSunset
      ? "#HairStyling #EditorialHair #BeautyNight #LuxuryBeauty #SalonExperience"
      : "#BalayageLuxury #HairGlow #SalonAtelier #LuxuryHair #BeautyEditorial";
  const audienceLine = isClassicAudience
    ? "para quienes quieren sentirse más pulidas, frescas y seguras sin cambiar su esencia"
    : "para quienes buscan un resultado elegante, visible y cuidadosamente personalizado";
  const softTagline = isOlaplex
    ? "Belleza que dura más allá del salón."
    : isSunset
      ? "Un look pensado para acompañarte todos los días."
      : "Belleza que se nota, cuidado que permanece.";
  const brandSignoff = [softTagline, salonName].join("\n");

  if (mode === "manual") {
    return "";
  }

  if (version === "whatsapp") {
    if (isOlaplex) {
      return [
        "✨ A veces el cabello no necesita más color.",
        "Necesita volver a sentirse sano.",
        "",
        `${normalizedTitle} ayuda a recuperar brillo, suavidad y fuerza visible desde la primera sesión 🤍`,
        "",
        "Si quieres, te orientamos según el estado de tu cabello y el resultado que buscas 🌿",
        "",
        brandSignoff,
        "",
        "#Olaplex #HealthyHair #LuxurySalon #HairCare #GlossHair",
      ].join("\n");
    }

    if (isSunset) {
      return [
        `🥂 ${normalizedTitle}`,
        "",
        "Golden hour, ondas suaves y un look para una noche que merece sentirse especial ✨",
        "",
        "Si quieres, te ayudamos a elegir el styling ideal según tu plan y tu outfit 🤍",
        "",
        brandSignoff,
        "",
        "#HairStyling #EditorialHair #BeautyNight #LuxuryBeauty #SalonExperience",
      ].join("\n");
    }

    return [
      "✨ El rubio perfecto nunca se ve forzado.",
      "",
      `${normalizedTitle} es ideal si buscas dimensión, luz y movimiento natural sin perder sofisticación 🤍`,
      "",
      "Podemos orientarte según tu base, tu historial de color y el resultado que quieres lograr 💆‍♀️",
      "",
      "Escríbenos por WhatsApp y lo vemos juntas 🌿",
      "",
      brandSignoff,
      "",
      serviceHashtags,
    ].join("\n");
  }

  if (version === "instagram") {
    if (isOlaplex) {
      return [
        "✨ A veces el cabello no necesita más color.",
        "Necesita volver a sentirse sano.",
        "",
        `${normalizedTitle} ayuda a recuperar brillo, suavidad y fuerza visible desde la primera sesión 🤍`,
        "",
        "Una experiencia pensada para cabellos sensibilizados, opacos o procesados químicamente, con reparación profunda y acabado suave de efecto editorial 💫",
        "",
        "Porque un cabello saludable también se nota en cómo te sientes 💆‍♀️",
        "",
        "Consulta disponibilidad esta semana vía WhatsApp 🌿",
        "",
        brandSignoff,
        "",
        serviceHashtags,
      ].join("\n");
    }

    if (isSunset) {
      return [
        `🥂 ${normalizedTitle}`,
        "",
        "Golden hour, ondas suaves y un look pensado para noches que merecen verse increíbles ✨",
        "",
        "Una experiencia social beauty creada para quienes aman sentirse elegantes sin esfuerzo 🤍",
        "",
        "Peinado editorial, styling personalizado y acabado luminoso inspirado en atardeceres de verano ☁️",
        "",
        "Reserva tu espacio esta semana 💫",
        "",
        brandSignoff,
        "",
        serviceHashtags,
      ].join("\n");
    }

    return [
      "✨ El rubio perfecto nunca se ve forzado.",
      "",
      `${normalizedTitle} fue pensado ${audienceLine}.`,
      "",
      "Reflejos que no gritan. Brillo que aparece con la luz. Movimiento que se siente natural desde cualquier ángulo 🤍",
      "",
      "Cada detalle se trabaja de forma personalizada: iluminación, gloss signature y finalizado editorial para un resultado luminoso desde cualquier ángulo 💆‍♀️",
      "",
      "Ideal si quieres verte más fresca, elegante y natural esta temporada ✨",
      "",
      "Escríbenos por WhatsApp y te orientamos según tu cabello 🌿",
      "",
      brandSignoff,
      "",
      serviceHashtags,
    ].join("\n");
  }

  if (isOlaplex) {
    return [
      "✨ El brillo más bonito empieza cuando el cabello vuelve a sentirse fuerte.",
      "",
      `${normalizedTitle} es una pausa de reparación para cabellos que han vivido color, calor, sol o temporadas intensas 🤍`,
      "",
      "El ritual trabaja desde la fibra para devolver suavidad, cuerpo y ese acabado saludable que se nota incluso antes del styling 💫",
      "",
      "Una experiencia silenciosa, sensorial y profundamente restauradora 💆‍♀️",
      "",
      "Consulta disponibilidad y te guiamos según el estado de tu cabello 🌿",
      "",
      brandSignoff,
      "",
      serviceHashtags,
    ].join("\n");
  }

  return [
    "✨ Hay cambios que no necesitan explicar demasiado.",
    "",
    `${normalizedTitle} fue creado para revelar luz, movimiento y presencia sin que el resultado se sienta forzado.`,
    "",
    "Un look que se ve caro porque se siente natural: suave en la raíz, luminoso en el contorno y elegante en cada movimiento 🤍",
    "",
    "El ritual combina diagnóstico personalizado, trabajo de color por zonas, gloss signature y finalizado editorial 💆‍♀️",
    "",
    "Para quienes quieren verse más frescas, más seguras y más ellas mismas frente al espejo 🪞",
    "",
    "Escríbenos por WhatsApp y te orientamos según tu cabello 🌿",
    "",
    brandSignoff,
    "",
    serviceHashtags,
  ].join("\n");
}

function createTemplateDraft() {
  const timestamp = new Date().toISOString();

  return {
    id: `tpl-${Date.now()}`,
    title: "Nueva narrativa Salon",
    category: "Selection",
    body: "",
    targetAudience: "VIP Muses Selection",
    metaStatus: "draft",
    metaTemplateName: `salon_template_${Date.now()}`,
    language: "es",
    variables: {
      tone: "luxury",
      version: "luxury",
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  } satisfies CampaignTemplate;
}

const STATUS_LABELS: Record<MetaTemplateStatus, string> = {
  draft: "Borrador",
  pending_meta: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
  scheduled: "Programado",
  sent: "Enviado",
};

export function useCampaignTemplates(salonName: string) {
  const [templates, setTemplates] = useState<CampaignTemplate[]>(() => defaultCampaignTemplates());
  const [activeTemplateId, setActiveTemplateId] = useState<string>(() => defaultCampaignTemplates()[0]?.id ?? "");
  const [saveLabel, setSaveLabel] = useState("Guardar campaña");
  const [isSaveFlashing, setIsSaveFlashing] = useState(false);
  const [campaignMode, setCampaignMode] = useState<CampaignMode>("manual");
  const [postStyleIndex, setPostStyleIndex] = useState(1);

  const campaignEditorRef = useRef<HTMLTextAreaElement | null>(null);

  const activeTemplate = useMemo(
    () => templates.find((template) => template.id === activeTemplateId) ?? templates[0] ?? null,
    [activeTemplateId, templates]
  );

  const selectedVersion = (activeTemplate?.variables.version as NarrativeVersion | undefined) ?? "luxury";

  const currentEditorBody =
    activeTemplate?.body && activeTemplate.body.trim()
      ? activeTemplate.body
      : activeTemplate
        ? generateLuxuryNarrativePost({
            campaignTitle: activeTemplate.title,
            targetAudience: activeTemplate.targetAudience,
            version: selectedVersion,
            mode: "ai",
            salonName,
          })
        : "";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedTemplates = loadCampaignTemplates();
      setTemplates(storedTemplates);
      setActiveTemplateId((currentId) =>
        storedTemplates.some((template) => template.id === currentId)
          ? currentId
          : storedTemplates[0]?.id ?? ""
      );
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const persistTemplate = useCallback((nextTemplate: CampaignTemplate) => {
    const storedTemplates = saveCampaignTemplate(nextTemplate);
    setTemplates(storedTemplates);
    setActiveTemplateId(nextTemplate.id);
  }, []);

  const handleTemplateField = useCallback(
    <K extends keyof CampaignTemplate>(field: K, value: CampaignTemplate[K]) => {
      if (!activeTemplate) {
        return;
      }
      persistTemplate({
        ...activeTemplate,
        [field]: value,
        updatedAt: new Date().toISOString(),
      });
    },
    [activeTemplate, persistTemplate]
  );

  const commitHeroTitle = useCallback(
    (rawTitle: string) => {
      if (!activeTemplate) {
        return;
      }

      const nextTitle = rawTitle.trim();

      if (!nextTitle) {
        return;
      }

      if (nextTitle === activeTemplate.title && nextTitle === (activeTemplate.heroTitle ?? activeTemplate.title)) {
        return;
      }

      persistTemplate({
        ...activeTemplate,
        title: nextTitle,
        heroTitle: nextTitle,
        updatedAt: new Date().toISOString(),
      });
    },
    [activeTemplate, persistTemplate]
  );

  const handleSaveDraft = useCallback(() => {
    if (!activeTemplate) {
      return;
    }

    persistTemplate({
      ...activeTemplate,
      metaStatus: activeTemplate.metaStatus === "rejected" ? "draft" : activeTemplate.metaStatus,
      updatedAt: new Date().toISOString(),
    });

    setSaveLabel("Guardado");
    setIsSaveFlashing(false);
    window.requestAnimationFrame(() => setIsSaveFlashing(true));
    window.setTimeout(() => {
      setSaveLabel("Guardar campaña");
      setIsSaveFlashing(false);
    }, 1600);
  }, [activeTemplate, persistTemplate]);

  const handleGenerateNarrative = useCallback(
    (version: NarrativeVersion) => {
      if (!activeTemplate) {
        return;
      }

      setCampaignMode("ai");
      persistTemplate({
        ...activeTemplate,
        body: generateLuxuryNarrativePost({
          campaignTitle: activeTemplate.title,
          targetAudience: activeTemplate.targetAudience,
          version,
          mode: "ai",
          salonName,
        }),
        variables: {
          ...activeTemplate.variables,
          tone: version === "luxury" ? "luxury" : version,
          version,
        },
        updatedAt: new Date().toISOString(),
      });
    },
    [activeTemplate, persistTemplate, salonName]
  );

  const cycleNarrative = useCallback(() => {
    if (templates.length === 0) {
      return;
    }

    const currentIndex = templates.findIndex((template) => template.id === activeTemplateId);
    const nextTemplate = templates[(currentIndex + 1 + templates.length) % templates.length] ?? templates[0];
    setActiveTemplateId(nextTemplate.id);
  }, [templates, activeTemplateId]);

  const cycleTarget = useCallback(() => {
    if (!activeTemplate) {
      return;
    }

    const currentIndex = TARGET_OPTIONS.indexOf(activeTemplate.targetAudience);
    const nextTarget = TARGET_OPTIONS[(currentIndex + 1 + TARGET_OPTIONS.length) % TARGET_OPTIONS.length];
    handleTemplateField("targetAudience", nextTarget);
  }, [activeTemplate, handleTemplateField]);

  const cyclePostStyle = useCallback(() => {
    const nextIndex = (postStyleIndex + 1) % POST_STYLE_OPTIONS.length;
    const nextOption = POST_STYLE_OPTIONS[nextIndex];

    setPostStyleIndex(nextIndex);

    if (nextOption.version) {
      handleGenerateNarrative(nextOption.version);
      return;
    }

    handleGenerateNarrative(selectedVersion);
  }, [postStyleIndex, handleGenerateNarrative, selectedVersion]);

  const setCampaignModeClean = useCallback(
    (mode: CampaignMode) => {
      setCampaignMode(mode);

      if (!activeTemplate) {
        return;
      }

      if (mode === "ai") {
        handleTemplateField(
          "body",
          generateLuxuryNarrativePost({
            campaignTitle: activeTemplate.title,
            targetAudience: activeTemplate.targetAudience,
            version: selectedVersion,
            mode: "ai",
            salonName,
          })
        );
        return;
      }

      if (mode === "manual") {
        handleTemplateField("body", "");
      }
    },
    [activeTemplate, handleTemplateField, salonName, selectedVersion]
  );

  const handleCreateTemplate = useCallback(() => {
    const newTemplate = createTemplateDraft();
    const storedTemplates = saveCampaignTemplate(newTemplate);
    setTemplates(storedTemplates);
    setActiveTemplateId(newTemplate.id);
  }, []);

  const handleDeleteActiveTemplate = useCallback(() => {
    if (!activeTemplate) {
      return;
    }

    const nextTemplates = deleteCampaignTemplate(activeTemplate.id);
    setTemplates(nextTemplates);
    setActiveTemplateId(nextTemplates[0]?.id ?? "");
  }, [activeTemplate]);

  const selectTemplateById = useCallback((templateId: string) => {
    setActiveTemplateId(templateId);
  }, []);

  const submitTemplateAfterCompliance = useCallback(() => {
    if (!activeTemplate) {
      return;
    }

    const storedTemplates = submitTemplateToMeta({
      ...activeTemplate,
      updatedAt: new Date().toISOString(),
    });
    setTemplates(storedTemplates);
  }, [activeTemplate]);

  const handleMockApprove = useCallback(() => {
    if (!activeTemplate) {
      return;
    }

    const storedTemplates = updateMetaTemplateStatus(activeTemplate.id, "approved");
    setTemplates(storedTemplates);
  }, [activeTemplate]);

  return {
    templates,
    activeTemplate,
    activeTemplateId,
    setActiveTemplateId,
    saveLabel,
    isSaveFlashing,
    campaignMode,
    postStyleIndex,
    setPostStyleIndex,
    selectedVersion,
    currentEditorBody,
    campaignEditorRef,
    persistTemplate,
    handleTemplateField,
    commitHeroTitle,
    handleSaveDraft,
    handleGenerateNarrative,
    cycleNarrative,
    cycleTarget,
    cyclePostStyle,
    setCampaignModeClean,
    handleCreateTemplate,
    handleDeleteActiveTemplate,
    selectTemplateById,
    submitTemplateAfterCompliance,
    handleMockApprove,
    TARGET_OPTIONS,
    POST_STYLE_OPTIONS,
    STATUS_LABELS,
  };
}

// Re-export narrative generator for components that need it
export { generateLuxuryNarrativePost, createTemplateDraft };
