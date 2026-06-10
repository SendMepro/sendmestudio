"use client";

import { useMemo } from "react";
import type { CampaignTemplate } from "../templateWorkflow";

export type CampaignKpis = {
  audience: string;
  delivered: number;
  read: number;
  replies: number;
  bookings: number;
  bookingIntent: number;
  topSegment: string;
  bestTime: string;
  tone: string;
  reachQuality: string;
  insight: string;
};

type CampaignVisual = {
  heroImage: string;
  thumbnail: string;
};

const campaignVisuals = [
  {
    matcher: "balayage",
    heroImage: "/img/campaign-balayage-lumiere.png",
    thumbnail: "/img/campaign-balayage-lumiere.png",
  },
  {
    matcher: "lumiere",
    heroImage: "/img/campaign-balayage-lumiere.png",
    thumbnail: "/img/campaign-balayage-lumiere.png",
  },
  {
    matcher: "olaplex",
    heroImage: "/img/campaign-olaplex-vips.png",
    thumbnail: "/img/campaign-olaplex-vips.png",
  },
  {
    matcher: "sunset",
    heroImage:
      "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&q=80&w=1600",
    thumbnail:
      "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&q=80&w=160&h=160",
  },
  {
    matcher: "cocktail",
    heroImage:
      "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=1600",
    thumbnail:
      "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=160&h=160",
  },
];

const fallbackCampaignHeroImage =
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=1600";
const fallbackCampaignThumbnail =
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=160&h=160";

export function campaignKpisFor(template: CampaignTemplate | null): CampaignKpis {
  const title = template?.title.toLowerCase() ?? "";

  if (title.includes("olaplex")) {
    return {
      audience: "842",
      delivered: 94,
      read: 76,
      replies: 31,
      bookings: 18,
      bookingIntent: 42,
      topSegment: "VIP reparación",
      bestTime: "17:30 - 19:30",
      tone: "Lujo cálido",
      reachQuality: "Caliente",
      insight: "Las clientas con historial de color responden mejor a mensajes de reparación y brillo saludable.",
    };
  }

  if (title.includes("sunset") || title.includes("cocktail")) {
    return {
      audience: "613",
      delivered: 89,
      read: 68,
      replies: 24,
      bookings: 9,
      bookingIntent: 29,
      topSegment: "Clientas clásicas",
      bestTime: "18:00 - 20:00",
      tone: "Editorial social",
      reachQuality: "Cálida",
      insight: "Las campañas enviadas entre 18:00 y 20:00 muestran mejor interacción para experiencias sociales.",
    };
  }

  return {
    audience: "1,248",
    delivered: 92,
    read: 71,
    replies: 28,
    bookings: 14,
    bookingIntent: 36,
    topSegment: "VIP rubias",
    bestTime: "18:00 - 20:00",
    tone: "Editorial lujo",
    reachQuality: "Caliente",
    insight: "Las clientas VIP responden mejor al tono editorial cálido con CTA suave.",
  };
}

export function visualForCampaign(template: CampaignTemplate | null): CampaignVisual {
  if (!template) {
    return {
      heroImage: fallbackCampaignHeroImage,
      thumbnail: fallbackCampaignThumbnail,
    };
  }

  const searchableText = [
    template.title,
    template.heroTitle,
    template.category,
    template.targetAudience,
    template.metaTemplateName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const matchedVisual = campaignVisuals.find((item) => searchableText.includes(item.matcher));

  return {
    heroImage: template.heroImage || template.thumbnail || matchedVisual?.heroImage || fallbackCampaignHeroImage,
    thumbnail: template.thumbnail || template.heroImage || matchedVisual?.thumbnail || fallbackCampaignThumbnail,
  };
}

export function subtitleForCampaign(template: CampaignTemplate | null) {
  if (!template) {
    return "Editor de campaña";
  }

  if (template.heroSubtitle) {
    return template.heroSubtitle;
  }

  if (template.category.toLowerCase() === "selection") {
    return "Selección narrativa";
  }

  if (template.category.toLowerCase() === "social") {
    return `${formatTargetAudience(template.targetAudience)} social`;
  }

  return template.targetAudience ? formatTargetAudience(template.targetAudience) : `Campaña ${template.category}`;
}

export function formatTargetAudience(targetAudience: string) {
  return targetAudience
    .replace("VIP Muses Selection", "Selección VIP")
    .replace("Classic Guests", "Clientas clásicas")
    .replace(" Selection", "");
}

export function formatTemplateCategory(category: string) {
  return category
    .replace("Selection", "Selección")
    .replace("Social", "Social")
    .replace("Campaign", "Campaña");
}

export function initialsForCampaign(title: string) {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

export function useCampaignVisuals(template: CampaignTemplate | null) {
  const visual = useMemo(() => visualForCampaign(template), [template]);
  const heroTitle = template?.heroTitle || template?.title || "Narrativa de campaña";
  const heroSubtitle = useMemo(() => subtitleForCampaign(template), [template]);
  const campaignKpis = useMemo(() => campaignKpisFor(template), [template]);

  return {
    heroImage: visual.heroImage,
    heroThumbnail: visual.thumbnail,
    heroTitle,
    heroSubtitle,
    campaignKpis,
  };
}
