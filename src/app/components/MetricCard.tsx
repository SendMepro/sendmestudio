"use client";

import type { ElementType } from "react";

type MetricCardProps = {
  value: string | number;
  label: string;
  icon?: ElementType;
  detail?: string;
  trend?: "up" | "down" | "neutral";
  color?: string;
  className?: string;
  style?: React.CSSProperties;
};

export default function MetricCard({
  value,
  label,
  icon: Icon,
  detail,
  color,
  className,
  style,
}: MetricCardProps) {
  return (
    <div
      className={className}
      style={{
        background: "linear-gradient(180deg, var(--surface-glass-strong), rgba(246, 239, 255, 0.78))",
        border: "1px solid var(--glass-border)",
        borderRadius: "var(--radius-lg)",
        padding: "20px 24px",
        boxShadow: "var(--glass-shadow)",
        backdropFilter: "var(--glass-backdrop)",
        ...style,
      }}
    >
      {Icon && (
        <div
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "12px",
            background: color ? `${color}12` : "rgba(124, 92, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "12px",
            color: color ?? "var(--primary)",
          }}
        >
          <Icon size={17} strokeWidth={1.5} />
        </div>
      )}
      <div
        style={{
          fontSize: "1.8rem",
          fontWeight: 300,
          letterSpacing: "-0.03em",
          lineHeight: 1,
          marginBottom: "4px",
          color: "var(--text)",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: "9.5px", color: "var(--text-muted)", fontWeight: 500 }}>
        {label}
      </div>
      {detail && (
        <div style={{ fontSize: "9px", color: "var(--text-secondary)", marginTop: "4px" }}>
          {detail}
        </div>
      )}
    </div>
  );
}
