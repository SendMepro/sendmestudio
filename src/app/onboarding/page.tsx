// ================================================================
// /onboarding/page.tsx — Onboarding del Owner post-registro
// Muestra checklist de configuración, template aplicado y pasos.
// ================================================================

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import AppShell from "@/app/components/AppShell";
import OwnerOnboardingDashboard from "@/app/components/OwnerOnboardingDashboard";

export default function OnboardingPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Pequeño delay para que se carguen los datos del tenant
    const t = setTimeout(() => setReady(true), 500);
    return () => clearTimeout(t);
  }, []);

  if (!ready) {
    return (
      <AppShell>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
          <Loader2 size={24} className="spin" />
          <span style={{ marginLeft: 12, color: "var(--text-secondary)" }}>Preparando tu negocio...</span>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <OwnerOnboardingDashboard />
    </AppShell>
  );
}
