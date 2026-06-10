"use client";

import { useMemo } from "react";
import type { KnowledgeBundle } from "../../api/knowledge/store";

const moduleWeights = [
  { key: "salonProfile" as const, label: "Perfil", weight: 15 },
  { key: "businessHours" as const, label: "Horarios", weight: 15 },
  { key: "services" as const, label: "Servicios", weight: 25 },
  { key: "stylists" as const, label: "Equipo", weight: 15 },
  { key: "faqs" as const, label: "FAQ", weight: 15 },
  { key: "aiRules" as const, label: "Reglas IA", weight: 15 },
];

function isMeaningful(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.length > 0 && value.some(isMeaningful);
  }

  if (value && typeof value === "object") {
    return Object.values(value).some(isMeaningful);
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  return value !== null && value !== undefined && value !== false;
}

function sectionCompletion(value: unknown) {
  if (!value || typeof value !== "object") {
    return 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? 1 : 0;
  }

  const values = Object.values(value);

  if (values.length === 0) {
    return 0;
  }

  return values.filter(isMeaningful).length / values.length;
}

function computeScore(knowledge: KnowledgeBundle | null) {
  if (!knowledge) {
    return 0;
  }

  return Math.round(
    moduleWeights.reduce((total, module) => {
      const value = knowledge[module.key];
      return total + module.weight * sectionCompletion(value);
    }, 0)
  );
}

export function useKnowledgeCompletion(knowledge: KnowledgeBundle | null) {
  const score = useMemo(() => computeScore(knowledge), [knowledge]);
  return { score, moduleWeights };
}

export { isMeaningful, sectionCompletion, computeScore };
