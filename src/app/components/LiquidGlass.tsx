"use client";

import React, { useEffect, useRef } from "react";

interface LiquidGlassProps {
  className?: string;
  children?: React.ReactNode;
  options?: {
    refraction?: number;
    bevelDepth?: number;
    bevelWidth?: number;
    frost?: number;
    specular?: boolean;
    magnify?: number;
  };
}

export default function LiquidGlass({ className, children, options }: LiquidGlassProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const targetEl = containerRef.current;
    if (typeof window === "undefined" || !targetEl) return;

    // Load html2canvas and bind it to window for liquidGL
    const initLiquidGL = async () => {
      try {
        const html2canvasModule = await import("html2canvas");
        (window as any).html2canvas = html2canvasModule.default || html2canvasModule;

        const liquidGLModule = await import("@/lib/liquidGL");
        const liquidGL = liquidGLModule.default;

        if (typeof liquidGL === "function") {
          liquidGL({
            target: targetEl,
            snapshot: "main", // Try to snapshot the main content or body
            resolution: 2,
            refraction: options?.refraction ?? 0.02,
            bevelDepth: options?.bevelDepth ?? 0.1,
            bevelWidth: options?.bevelWidth ?? 0.05,
            frost: options?.frost ?? 0,
            specular: options?.specular ?? true,
            magnify: options?.magnify ?? 1,
          });
        }
      } catch (err) {
        console.error("Failed to initialize LiquidGlass:", err);
      }
    };

    initLiquidGL();

    return () => {
      // Cleanup if necessary
      // Note: The original liquidGL creates a global renderer on window.__liquidGLRenderer__
      // We might want to clear it or the canvas if the app grows, but for now it's okay.
    };
  }, [options]);

  return (
    <div ref={containerRef} className={`${className || ""}`}>
      {children}
    </div>
  );
}
