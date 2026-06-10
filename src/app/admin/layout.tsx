// ================================================================
// admin/layout.tsx — Layout para páginas Admin
// Envuelve la mayoría de las páginas /admin en AppShell.
// Las rutas que no necesitan sidebar (como ai-costs con su gate)
// se renderizan sin AppShell.
// ================================================================

"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AppShell from "@/app/components/AppShell";
import { useAuthContext } from "@/providers/AuthProvider";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isSuperAdmin, isLoading } = useAuthContext();
  const [gateChecked, setGateChecked] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!isSuperAdmin) {
      console.log("[admin/layout] No super admin → redirigiendo a /");
      router.replace("/");
    } else {
      setGateChecked(true);
    }
  }, [isLoading, isSuperAdmin, router]);

  // Rutas que se renderizan sin sidebar ni AppShell
  const fullscreenRoutes = ["/admin/ai-costs"];
  const isFullscreen = fullscreenRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"));

  if (isLoading || !gateChecked) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          color: "rgba(20, 18, 28, 0.5)",
          fontFamily: "system-ui, sans-serif",
          fontSize: 14,
        }}
      >
        Cargando...
      </div>
    );
  }

  if (isFullscreen) {
    return <>{children}</>;
  }

  return <AppShell>{children}</AppShell>;
}
