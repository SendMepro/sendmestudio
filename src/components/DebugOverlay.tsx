"use client";

/**
 * DebugOverlay — Deshabilitado permanentemente.
 * Este archivo se mantiene por compatibilidad, pero nunca renderiza nada.
 * El reemplazo funcional está en src/app/components/DebugOverlay.tsx
 * que solo se activa en desarrollo con NEXT_PUBLIC_DEBUG_OVERLAY=true.
 */
export function DebugOverlay() {
  return null;
}
