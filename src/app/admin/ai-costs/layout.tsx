// ================================================================
// admin/ai-costs/layout.tsx — Layout para AI Costs
// Sin AppShell ni sidebar, porque la página maneja su propio
// estado de gate (password) y renderiza full-screen.
// ================================================================

import { ReactNode } from "react";

export default function AICostsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
