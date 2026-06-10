// ================================================================
// SendMeLogo.tsx — Componente de logo reutilizable para SendMe Studio
// Extraído del sidebar para mantener identidad visual consistente.
// Variantes: full | iconOnly | light/dark
// Tamaños: sm (22px), md (28px), lg (36px)
// ================================================================

"use client";

import React from "react";
import { Sparkles } from "lucide-react";

export type SendMeLogoVariant = "full" | "iconOnly";
export type SendMeLogoSize = "sm" | "md" | "lg";
export type SendMeLogoTheme = "light" | "dark";

interface SendMeLogoProps {
  variant?: SendMeLogoVariant;
  size?: SendMeLogoSize;
  theme?: SendMeLogoTheme;
  className?: string;
}

const iconSizes: Record<SendMeLogoSize, number> = {
  sm: 16,
  md: 20,
  lg: 28,
};

const iconWrapSizes: Record<SendMeLogoSize, number> = {
  sm: 18,
  md: 22,
  lg: 30,
};

const fontSize: Record<SendMeLogoSize, string> = {
  sm: "12px",
  md: "16px",
  lg: "22px",
};

const fontSizeStudio: Record<SendMeLogoSize, string> = {
  sm: "10px",
  md: "14px",
  lg: "20px",
};

export default function SendMeLogo({
  variant = "full",
  size = "md",
  theme = "dark",
  className,
}: SendMeLogoProps) {
  const iconSize = iconSizes[size];
  const wrap = iconWrapSizes[size];
  const fSize = fontSize[size];
  const fSizeStudio = fontSizeStudio[size];

  const iconColor = "#7c5cff";

  const colorSend = theme === "dark" ? "#6630c2" : "#7c3aed";
  const colorMe = theme === "dark" ? "#976ae1" : "#a78bfa";
  const colorStudio = theme === "dark" ? "#2f2f2f" : "#1a1a2e";

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: size === "sm" ? 6 : 10,
        fontFamily: "'Arimo', sans-serif",
        fontWeight: 800,
        letterSpacing: "-0.04em",
        lineHeight: 1.1,
        whiteSpace: "nowrap",
        userSelect: "none",
      }}
    >
      <span
        style={{
          width: wrap,
          height: wrap,
          flex: `0 0 ${wrap}px`,
          display: "grid",
          placeItems: "center",
          color: iconColor,
          marginTop: -1,
        }}
      >
        <Sparkles size={iconSize} strokeWidth={1.5} absoluteStrokeWidth />
      </span>

      {variant === "full" && (
        <span style={{ display: "inline-flex", alignItems: "baseline", gap: 0 }}>
          <span style={{ color: colorSend, fontSize: fSize }}>Send</span>
          <span style={{ color: colorMe, fontSize: fSize }}>Me</span>
          <span
            style={{
              color: colorStudio,
              fontSize: fSizeStudio,
              fontWeight: 700,
              marginLeft: 4,
              letterSpacing: "-0.01em",
            }}
          >
            Studio
          </span>
        </span>
      )}
    </span>
  );
}
