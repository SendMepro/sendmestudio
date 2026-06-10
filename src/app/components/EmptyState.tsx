"use client";

import type { ElementType } from "react";

type EmptyStateProps = {
  icon?: ElementType;
  title: string;
  description?: string;
};

export default function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        gap: "12px",
        color: "var(--text-muted)",
        textAlign: "center",
      }}
    >
      {Icon && <Icon size={24} strokeWidth={1.5} style={{ opacity: 0.4 }} />}
      <span style={{ fontSize: "13px", fontWeight: 500 }}>{title}</span>
      {description && (
        <span style={{ fontSize: "11px", opacity: 0.7 }}>{description}</span>
      )}
    </div>
  );
}
