"use client";

import type { ReactNode } from "react";

type PageLayoutProps = {
  children: ReactNode;
  statusBar?: ReactNode;
  loading?: boolean;
  error?: string | null;
  loadingMessage?: string;
};

export default function PageLayout({ children, statusBar, loading, error, loadingMessage }: PageLayoutProps) {
  return (
    <div
      style={{
        padding: "24px 28px",
        height: "100vh",
        overflowY: "auto",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
      className="page-layout-scroll"
    >
      {statusBar && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
            fontSize: "10px",
            color: "var(--text-secondary)",
            marginBottom: "20px",
            padding: "10px 16px",
            background: "rgba(255, 255, 255, 0.5)",
            border: "1px solid rgba(197, 184, 229, 0.18)",
            borderRadius: "16px",
          }}
        >
          {statusBar}
        </div>
      )}

      {loading && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "60vh",
            color: "var(--text-muted)",
            fontSize: "13px",
            animation: "page-layout-pulse 2s ease-in-out infinite",
          }}
        >
          {loadingMessage || "Cargando…"}
        </div>
      )}

      {error && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "60vh",
            gap: "12px",
            color: "var(--text-muted)",
            fontSize: "13px",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.4 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && children}
    </div>
  );
}
