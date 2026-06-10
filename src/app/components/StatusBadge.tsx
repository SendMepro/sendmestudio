"use client";

type StatusBadgeProps = {
  status: string;
  label?: string;
  color?: string;
  size?: "sm" | "md";
};

const STATUS_COLORS: Record<string, string> = {
  healthy: "#10B981",
  degraded: "#f59e0b",
  failed: "#e74c3c",
  unreachable: "#e74c3c",
  active: "#10B981",
  inactive: "#999",
  warning: "#f59e0b",
  critical: "#e74c3c",
};

export default function StatusBadge({ status, label, color, size = "sm" }: StatusBadgeProps) {
  const dotColor = color ?? STATUS_COLORS[status.toLowerCase()] ?? "#999";
  const displayLabel = label ?? status;
  const dotSize = size === "sm" ? "6px" : "8px";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        fontSize: "10px",
        color: "var(--text-secondary)",
      }}
    >
      <span
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: "50%",
          background: dotColor,
          boxShadow: `0 0 6px ${dotColor}`,
          display: "inline-block",
        }}
      />
      {displayLabel}
    </span>
  );
}
