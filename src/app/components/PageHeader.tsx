"use client";

import type { ElementType, ReactNode } from "react";

type PageHeaderProps = {
  icon: ElementType;
  title: string;
  kicker?: string;
  children?: ReactNode;
};

export default function PageHeader({ icon: Icon, title, kicker, children }: PageHeaderProps) {
  return (
    <header style={{ marginBottom: "24px" }}>
      {kicker && (
        <span
          style={{
            fontSize: "0.65rem",
            fontWeight: 700,
            letterSpacing: "2.5px",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            display: "block",
            marginBottom: "6px",
          }}
        >
          {kicker}
        </span>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #7c5cff, #9b7dff)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon size={20} strokeWidth={1.5} style={{ color: "#fff" }} />
          </div>
          <h1
            style={{
              fontSize: "1.4rem",
              fontWeight: 500,
              letterSpacing: "-0.03em",
              color: "var(--text)",
              margin: 0,
            }}
          >
            {title}
          </h1>
        </div>
        {children && <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>{children}</div>}
      </div>
    </header>
  );
}
