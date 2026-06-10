"use client";

import { useState } from "react";

type QRResult = {
  qrToken: string;
  qrCodeUrl: string;
  qrShortCode: string;
  qrLocalIP: string;
  qrPort: string;
  generateQRToken: () => Promise<void>;
  closeQRModal: () => void;
};

type QRCallbacks = {
  showToast: (message: string) => void;
  onQRModalOpen: () => void;
};

/**
 * Hook that encapsulates QR code generation for mobile uploads.
 *
 * Generates a session token via POST /api/brain-admin/qr-token,
 * constructs a QR code URL, and manages QR-related state.
 * Modal visibility (isQRModalOpen) stays in the page as UI state.
 */
export function useBrainAdminQR(callbacks: QRCallbacks): QRResult {
  const { showToast, onQRModalOpen } = callbacks;

  const [qrToken, setQrToken] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [qrShortCode, setQrShortCode] = useState("");
  const [qrLocalIP, setQrLocalIP] = useState("");
  const [qrPort, setQrPort] = useState("3000");

  const generateQRToken = async () => {
    try {
      const response = await fetch("/api/brain-admin/qr-token", {
        method: "POST",
        cache: "no-store",
      });
      const data = await response.json();

      if (response.ok && data.token) {
        setQrToken(data.token);
        setQrShortCode(data.shortCode || "");
        setQrLocalIP(data.localIP || "");
        setQrPort(data.port || "3000");
        // Si el API devolvió localhost, usar window.location.origin
        const ip =
          data.localIP &&
          data.localIP !== "localhost" &&
          data.localIP !== "127.0.0.1"
            ? data.localIP
            : typeof window !== "undefined"
              ? window.location.hostname
              : "localhost";
        setQrLocalIP(ip);
        setQrCodeUrl(
          data.uploadUrl ||
            `${window.location.origin}/mobile-upload?session=${data.token}`
        );
        onQRModalOpen();
      } else {
        showToast("Error al generar código QR");
      }
    } catch {
      showToast("Error de conexión al generar QR");
    }
  };

  const closeQRModal = () => {
    setQrToken("");
    setQrCodeUrl("");
    setQrShortCode("");
    setQrLocalIP("");
  };

  return {
    qrToken,
    qrCodeUrl,
    qrShortCode,
    qrLocalIP,
    qrPort,
    generateQRToken,
    closeQRModal,
  };
}
