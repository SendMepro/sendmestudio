"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { KnowledgeBundle } from "../../api/knowledge/store";

type SaveState = "Cargando" | "Guardando" | "Guardado" | "Invalid JSON";

export function useKnowledgeBundle() {
  const [knowledge, setKnowledge] = useState<KnowledgeBundle | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("Cargando");
  const didLoadRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);

  /* ---- Load on mount ---- */
  useEffect(() => {
    let cancelled = false;

    const loadKnowledge = async () => {
      const response = await fetch("/api/knowledge");
      const data = await response.json();

      if (!cancelled) {
        setKnowledge(data.knowledge);
        setSaveState("Guardado");
        didLoadRef.current = true;
      }
    };

    void loadKnowledge();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ---- Auto-save with 650ms debounce ---- */
  useEffect(() => {
    if (!didLoadRef.current || !knowledge) {
      return;
    }

    setSaveState("Guardando");

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(async () => {
      await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ knowledge }),
      });
      setSaveState("Guardado");
    }, 650);
  }, [knowledge]);

  /* ---- Update helpers ---- */

  const updateSection = useCallback(
    <T extends keyof KnowledgeBundle>(section: T, value: KnowledgeBundle[T]) => {
      setKnowledge((current) => (current ? { ...current, [section]: value } : current));
    },
    []
  );

  const updateProfile = useCallback(
    (field: keyof KnowledgeBundle["salonProfile"], value: string) => {
      setKnowledge((current) => {
        if (!current) return current;
        return {
          ...current,
          salonProfile: { ...current.salonProfile, [field]: value },
        };
      });
    },
    []
  );

  const updateService = useCallback(
    (index: number, patch: Partial<KnowledgeBundle["services"][number]>) => {
      setKnowledge((current) => {
        if (!current) return current;
        return {
          ...current,
          services: current.services.map((service, serviceIndex) =>
            serviceIndex === index ? { ...service, ...patch } : service
          ),
        };
      });
    },
    []
  );

  const updateStylist = useCallback(
    (index: number, patch: Partial<KnowledgeBundle["stylists"][number]>) => {
      setKnowledge((current) => {
        if (!current) return current;
        return {
          ...current,
          stylists: current.stylists.map((stylist, stylistIndex) =>
            stylistIndex === index ? { ...stylist, ...patch } : stylist
          ),
        };
      });
    },
    []
  );

  const updateFaq = useCallback(
    (index: number, patch: Partial<KnowledgeBundle["faqs"][number]>) => {
      setKnowledge((current) => {
        if (!current) return current;
        return {
          ...current,
          faqs: current.faqs.map((faq, faqIndex) =>
            faqIndex === index ? { ...faq, ...patch } : faq
          ),
        };
      });
    },
    []
  );

  const setSaveStateExternally = useCallback((state: SaveState) => {
    setSaveState(state);
  }, []);

  return {
    knowledge,
    saveState,
    updateSection,
    updateProfile,
    updateService,
    updateStylist,
    updateFaq,
    setSaveState: setSaveStateExternally,
  };
}
