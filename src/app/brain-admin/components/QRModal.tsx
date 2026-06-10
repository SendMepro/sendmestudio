"use client";

import { Brain, CheckCircle2, QrCode, RefreshCw, Smartphone, Wifi, X } from "lucide-react";
import styles from "../brain-admin.module.css";

type Summary = {
  uploadedConversations: number;
  workEntries?: { id: string; filename: string; serviceType: string; quality: number; style: string; campaignPotential: boolean; isFeatured: boolean; uploadedAt: string; folder: string }[];
};

type QRModalProps = {
  isOpen: boolean;
  qrCodeUrl: string;
  qrShortCode: string;
  qrLocalIP: string;
  qrPort: string;
  incomingUpload: { fileName: string } | null;
  summary: Summary;
  onRegenerate: () => void;
  onClose: () => void;
};

export function QRModal({
  isOpen,
  qrCodeUrl,
  qrShortCode,
  qrLocalIP,
  qrPort,
  incomingUpload,
  summary,
  onRegenerate,
  onClose,
}: QRModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalBackdrop} onMouseDown={onClose}>
      <section className={styles.qrModal} onMouseDown={(event) => event.stopPropagation()}>
        <button className={styles.closeModalButton} onClick={onClose} type="button">
          <X size={16} strokeWidth={1.8} />
        </button>
        <div className={styles.qrModalHeader}>
          <div className={styles.qrModalIcon}>
            <QrCode size={22} strokeWidth={1.6} />
          </div>
          <h2>Subir desde celular</h2>
          <p className={styles.qrModalSub}>
            Escanea el código QR con tu teléfono para enviar archivos directamente al Brain.
          </p>
        </div>

        {/* Incoming upload notification */}
        {incomingUpload ? (
          <div className={styles.incomingUploadBanner}>
            <div className={styles.incomingGlow} />
            <div className={styles.incomingContent}>
              <CheckCircle2 size={18} strokeWidth={1.8} />
              <div>
                <strong>Nuevo aprendizaje recibido</strong>
                <span>{incomingUpload.fileName}</span>
              </div>
            </div>
          </div>
        ) : null}

        <div className={styles.qrCodeContainer} data-glow={incomingUpload ? "true" : "false"}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="QR Code para subir archivos al Brain"
            className={styles.qrCodeImage}
            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrCodeUrl)}`}
          />
        </div>

        <div className={styles.qrShortCode}>
          <span>Código:</span>
          <strong>{qrShortCode}</strong>
        </div>

        <div className={styles.qrNetworkInfo}>
          <Wifi size={12} strokeWidth={1.8} />
          <span>Misma WiFi requerida</span>
          <span className={styles.qrNetworkIp}>{qrLocalIP}:{qrPort}</span>
        </div>

        {summary.uploadedConversations > 0 ? (
          <div className={styles.qrMetricsRow}>
            <div className={styles.qrMetric}>
              <Brain size={14} strokeWidth={1.7} />
              <span>{summary.uploadedConversations} aprendizajes</span>
            </div>
            <div className={styles.qrMetric}>
              <Smartphone size={14} strokeWidth={1.7} />
              <span>{summary.workEntries?.length ?? 0} trabajos</span>
            </div>
          </div>
        ) : null}

        <p className={styles.qrExpiryNote}>
          El enlace expira en 15 minutos. PC y teléfono deben estar en la misma red WiFi.
        </p>

        <div className={styles.qrActions}>
          <button className={styles.qrRefreshBtn} onClick={onRegenerate} type="button">
            <RefreshCw size={14} strokeWidth={1.8} />
            Regenerar QR
          </button>
          <button className={styles.qrCloseBtn} onClick={onClose} type="button">
            Listo
          </button>
        </div>
      </section>
    </div>
  );
}
