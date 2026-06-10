import type { Metadata } from "next";
import "./globals.css";
// G-1: Auto-activate SystemSupervisorAgent at app startup (server-side only)
import "../agents/system/startup";
import { AuthProvider } from "@/providers/AuthProvider";
import { TenantProvider } from "@/providers/TenantProvider";
import { DynamicFavicon } from "@/components/brand/DynamicFavicon";
import { DebugOverlay } from "@/components/DebugOverlay";

export const metadata: Metadata = {
  title: "SendMe Studio | Luxury Salon OS",
  description: "Premium editorial operating system for beauty studios",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-theme="light">
      <head>
        {/* Default favicon — DynamicFavicon (client component) will override it */}
        <link rel="icon" href="/favicon.ico" id="dynamic-favicon" />
        <link rel="apple-touch-icon" href="/favicon.ico" id="dynamic-apple-favicon" />
      </head>
      <body>
        <AuthProvider>
          <TenantProvider>
            <DynamicFavicon />
            <DebugOverlay />
            <div className="app-root">
              {children}
            </div>
          </TenantProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
