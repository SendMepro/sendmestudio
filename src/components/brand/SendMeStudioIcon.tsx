// ================================================================
// SendMeStudioIcon.tsx — Componente que renderiza el icono oficial
// de SendMe Studio desde /img/icon_sendme_studio.png
// ================================================================

"use client";

import React, { CSSProperties } from "react";

export type SendMeIconSize = "sm" | "md" | "lg";

interface SendMeStudioIconProps {
  size?: SendMeIconSize;
  className?: string;
  /** className del CSS Module */
  style?: CSSProperties;
  /** inline style override */
  alt?: string;
}

const pixelSizes: Record<SendMeIconSize, number> = {
  sm: 32,
  md: 40,
  lg: 64,
};

export default function SendMeStudioIcon({
  size = "md",
  className,
  style,
  alt = "SendMe Studio",
}: SendMeStudioIconProps) {
  const px = pixelSizes[size];

  return (
    <img
      src="/img/icon_sendme_studio.png"
      alt={alt}
      width={px}
      height={px}
      className={className}
      style={{
        objectFit: "contain",
        borderRadius: 0,
        ...style,
      }}
    />
  );
}
