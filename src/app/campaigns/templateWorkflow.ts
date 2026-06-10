export type MetaTemplateStatus =
  | "draft"
  | "pending_meta"
  | "approved"
  | "rejected"
  | "scheduled"
  | "sent";

export type CampaignTemplate = {
  id: string;
  title: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: string;
  thumbnail?: string;
  category: string;
  body: string;
  targetAudience: string;
  metaStatus: MetaTemplateStatus;
  metaTemplateName: string;
  language: string;
  variables: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string;
};

const STORAGE_KEY = "campaigns:meta-templates";

const defaultTemplates: CampaignTemplate[] = [
  {
    id: "tpl-balayage-dior",
    title: "Ritual Balayage Lumiere",
    heroTitle: "Ritual Balayage Lumiere",
    heroSubtitle: "✨ Demo editable — campaña de ejemplo",
    heroImage: "/img/campaign-balayage-lumiere.png",
    thumbnail: "/img/campaign-balayage-lumiere.png",
    category: "Selection",
    body: `Hola {{nombre}} ✨

Este mes abrimos cupos limitados para nuestro Ritual Balayage Lumiere, ideal para iluminar tu cabello con un resultado natural, elegante y de bajo mantenimiento.

Reserva tu evaluación y recibe una asesoría personalizada con nuestro equipo.

¿Te gustaría que revisemos horarios disponibles para esta semana?

CTA: Reservar evaluación`,
    targetAudience: "VIP Muses Selection",
    metaStatus: "approved",
    metaTemplateName: "ritual_balayage_lumiere",
    language: "es",
    variables: {
      tone: "luxury",
      version: "whatsapp",
      instagram: `✨ Ritual Balayage Lumiere ✨

Ilumina tu cabello con un resultado natural, sofisticado y diseñado especialmente para ti.

Nuestro equipo te acompaña con una evaluación personalizada para lograr un look elegante, saludable y de bajo mantenimiento.

Agenda tu evaluación esta semana y vive una experiencia premium en el salón.

#Balayage #HairSalon #BeautyExperience #CambioDeLook #CabelloSaludable`,
      metaBody: `Hola {{1}} ✨ Este mes tenemos cupos limitados para nuestro Ritual Balayage Lumiere. Reserva tu evaluación personalizada y descubre el tono ideal para ti.

Cupos limitados sujetos a disponibilidad.`,
    },
    createdAt: "2026-05-21T10:00:00.000Z",
    updatedAt: "2026-05-21T10:00:00.000Z",
  },
  {
    id: "tpl-olaplex-vip",
    title: "Ritual Olaplex VIPs",
    heroTitle: "Ritual Olaplex VIPs",
    heroSubtitle: "VIP Muses Selection",
    heroImage: "/img/campaign-olaplex-vips.png",
    thumbnail: "/img/campaign-olaplex-vips.png",
    category: "VIP",
    body: "",
    targetAudience: "VIP Muses Selection",
    metaStatus: "draft",
    metaTemplateName: "olaplex_vip_ritual",
    language: "es",
    variables: {
      tone: "luxury",
      version: "instagram",
    },
    createdAt: "2026-05-21T10:05:00.000Z",
    updatedAt: "2026-05-21T10:05:00.000Z",
  },
  {
    id: "tpl-sunset-social",
    title: "Sunset Cocktails & Hair",
    heroTitle: "Sunset Cocktails & Hair",
    heroSubtitle: "Classic Guests Social",
    category: "Social",
    body: "",
    targetAudience: "Classic Guests",
    metaStatus: "rejected",
    metaTemplateName: "sunset_cocktails_hair",
    language: "es",
    variables: {
      tone: "instagram",
      version: "whatsapp",
    },
    createdAt: "2026-05-21T10:10:00.000Z",
    updatedAt: "2026-05-21T10:10:00.000Z",
    rejectionReason: "Meta requiere una propuesta con consentimiento promocional mas explicito.",
  },
];

export function defaultCampaignTemplates() {
  return defaultTemplates.map((template) => ({ ...template }));
}

function canUseStorage() {
  return typeof window !== "undefined";
}

function hydrateTemplateVisuals(template: CampaignTemplate) {
  const defaultTemplate = defaultTemplates.find((item) => item.id === template.id);

  if (!defaultTemplate) {
    return template;
  }

  return {
    ...template,
    title:
      template.id === "tpl-olaplex-vip" && template.title === "Ritual Olaplex VIP"
        ? defaultTemplate.title
        : template.title,
    heroTitle: template.heroTitle ?? defaultTemplate.heroTitle,
    heroSubtitle: template.heroSubtitle ?? defaultTemplate.heroSubtitle,
    heroImage: template.heroImage ?? defaultTemplate.heroImage,
    thumbnail: template.thumbnail ?? defaultTemplate.thumbnail,
  };
}

function readTemplates() {
  if (!canUseStorage()) {
    return defaultTemplates;
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultTemplates));
    return defaultTemplates;
  }

  try {
    const parsedTemplates = JSON.parse(saved) as CampaignTemplate[];
    const hydratedTemplates = parsedTemplates.map(hydrateTemplateVisuals);

    if (JSON.stringify(parsedTemplates) !== JSON.stringify(hydratedTemplates)) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(hydratedTemplates));
    }

    return hydratedTemplates;
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultTemplates));
    return defaultTemplates;
  }
}

function writeTemplates(templates: CampaignTemplate[]) {
  if (!canUseStorage()) {
    return templates;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  return templates;
}

export function loadCampaignTemplates() {
  return readTemplates();
}

export function saveCampaignTemplate(template: CampaignTemplate) {
  const templates = readTemplates();
  const nextTemplates = templates.some((item) => item.id === template.id)
    ? templates.map((item) => (item.id === template.id ? template : item))
    : [template, ...templates];

  return writeTemplates(nextTemplates);
}

export function deleteCampaignTemplate(templateId: string) {
  const templates = readTemplates();
  return writeTemplates(templates.filter((template) => template.id !== templateId));
}

export function updateMetaTemplateStatus(
  templateId: string,
  status: MetaTemplateStatus,
  rejectionReason?: string
) {
  const templates = readTemplates();
  const nextTemplates = templates.map((template) =>
    template.id === templateId
      ? {
          ...template,
          metaStatus: status,
          rejectionReason,
          updatedAt: new Date().toISOString(),
        }
      : template
  );

  return writeTemplates(nextTemplates);
}

export function submitTemplateToMeta(template: CampaignTemplate) {
  return updateMetaTemplateStatus(template.id, "pending_meta");
}
