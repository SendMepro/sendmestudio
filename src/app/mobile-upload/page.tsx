"use client";

import { type ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  Brain,
  CheckCircle2,
  FileText,
  Image,
  Lock,
  Music,
  Sparkles,
  Upload,
  Video,
  X,
  AlertTriangle,
  QrCode,
  Camera,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────

type TokenStatus = {
  valid: boolean;
  session?: string;
  shortCode?: string;
  clientSlug?: string;
  maxFileSizeBytes?: number;
  expiresAt?: number;
  error?: string;
  expired?: boolean;
};

type UploadResult = {
  ok: boolean;
  error?: string;
  record?: { originalName: string; uploadedAt: string };
};

// ─── Constants ────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = "image/*,.txt,.md,.pdf,audio/*,video/*,text/plain,text/markdown,application/pdf";
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

// ─── Component ────────────────────────────────────────────────────────────

export default function MobileUploadPage() {
  const [sessionStatus, setSessionStatus] = useState<TokenStatus | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate session on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const session = params.get("session");

    if (!session) {
      setSessionStatus({ valid: false, error: "Enlace inválido. Escanea el QR nuevamente.", expired: true });
      setIsValidating(false);
      return;
    }

    // Use the same token validation endpoint
    fetch(`/api/brain-admin/qr-token?token=${encodeURIComponent(session)}`, { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        setSessionStatus({ ...data, session });
        setIsValidating(false);
      })
      .catch(() => {
        setSessionStatus({ valid: false, error: "Error de conexión. Intenta de nuevo." });
        setIsValidating(false);
      });
  }, []);

  // Countdown for redirect after success
  useEffect(() => {
    if (!uploadResult?.ok) return;
    setCountdown(8);
    const t = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(t);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [uploadResult]);

  const validateAndAddFile = useCallback((file: File | null) => {
    setUploadError("");
    setUploadResult(null);
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`El archivo es demasiado grande (máximo 50 MB).`);
      return;
    }
    setFiles((prev) => [...prev, file!]);
  }, []);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList) return;
    for (let i = 0; i < fileList.length; i++) {
      validateAndAddFile(fileList[i]);
    }
    event.target.value = "";
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    for (let i = 0; i < event.dataTransfer.files.length; i++) {
      validateAndAddFile(event.dataTransfer.files[i]);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadAll = async () => {
    if (!files.length || !sessionStatus?.session) return;
    setIsUploading(true);
    setUploadError("");

    try {
      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append("file", files[i]);
        formData.append("sourceType", "mobile-upload");
        formData.append("notes", `Subido desde celular — Código: ${sessionStatus.shortCode || ""}`);

        const response = await fetch("/api/brain-admin/upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.error || `Error al subir ${files[i].name}`);
        }
      }

      // Mark token as used after all uploads
      await fetch("/api/brain-admin/qr-token", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: sessionStatus.session }),
      });

      setUploadResult({ ok: true });
      setFiles([]);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Error de conexión.");
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (file: File) => {
    const type = file.type;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (type.startsWith("image/")) return <Image size={22} strokeWidth={1.6} />;
    if (type.startsWith("video/")) return <Video size={22} strokeWidth={1.6} />;
    if (type.startsWith("audio/")) return <Music size={22} strokeWidth={1.6} />;
    return <FileText size={22} strokeWidth={1.6} />;
  };

  // ─── Loading ──────────────────────────────────────────────────────────
  if (isValidating) {
    return (
      <div style={s.container}>
        <div style={s.centerBox}>
          <Brain size={28} strokeWidth={1.5} style={{ color: "rgba(124,92,255,0.5)" }} />
          <p style={s.loadingText}>Conectando con Atelier Studio...</p>
        </div>
      </div>
    );
  }

  // ─── Invalid ──────────────────────────────────────────────────────────
  if (!sessionStatus?.valid) {
    return (
      <div style={s.container}>
        <div style={s.errorCard}>
          <div style={{ ...s.circleIcon, background: "rgba(239,68,68,0.1)", color: "#dc2626" }}>
            <AlertTriangle size={24} strokeWidth={1.6} />
          </div>
          <h1 style={s.title}>Enlace expirado</h1>
          <p style={s.sub}>
            {sessionStatus?.error || "Este enlace ya no es válido."}
          </p>
          <div style={s.hintRow}>
            <QrCode size={14} strokeWidth={1.7} />
            <span>Solicita un nuevo código QR en el panel de administración.</span>
          </div>
          <div style={s.brandFooter}>
            <Sparkles size={12} strokeWidth={1.7} />
            <span>Atelier Studio</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── Success ──────────────────────────────────────────────────────────
  if (uploadResult?.ok) {
    const fileCount = uploadResult.record ? 1 : files.length;
    return (
      <div style={s.container}>
        <div style={s.successCard}>
          <div style={s.successGlow}>
            <div style={{ ...s.circleIcon, background: "rgba(22,163,74,0.1)", color: "#16a34a" }}>
              <CheckCircle2 size={32} strokeWidth={1.5} />
            </div>
          </div>
          <h1 style={s.title}>Enviado al Brain</h1>
          <p style={s.sub}>
            {fileCount} archivo{fileCount !== 1 ? "s" : ""} recibido{fileCount !== 1 ? "s" : ""} correctamente.
          </p>
          <p style={s.successNote}>
            El Brain está procesando y extrayendo aprendizajes.
          </p>
          {countdown !== null && countdown > 0 ? (
            <p style={s.countdownText}>Volviendo al inicio en {countdown}s...</p>
          ) : null}
          <button
            onClick={() => {
              setUploadResult(null);
              setFiles([]);
              setUploadError("");
            }}
            style={s.primaryButton}
            type="button"
          >
            Subir más archivos
          </button>
          <div style={s.brandFooter}>
            <Sparkles size={12} strokeWidth={1.7} />
            <span>Atelier Studio</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main UI ──────────────────────────────────────────────────────────
  return (
    <div style={s.container}>
      <div style={s.card}>
        {/* Header */}
        <div style={s.header}>
          <div style={s.brandChip}>
            <Sparkles size={12} strokeWidth={1.7} />
            <span>Atelier Studio</span>
          </div>
          <h1 style={s.title}>Subir al Brain</h1>
          <p style={s.sub}>
            Fotos, videos, audios o documentos para el sistema de aprendizaje del salón.
          </p>
        </div>

        {/* Secure badge */}
        <div style={s.secureBadge}>
          <Lock size={12} strokeWidth={1.8} />
          <span>Conexión local segura · {sessionStatus.clientSlug || "Salon"}</span>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            ...s.dropzone,
            ...(dragOver ? s.dropzoneActive : {}),
            ...(files.length > 0 ? s.dropzoneSelected : {}),
          }}
        >
          <input
            ref={fileInputRef}
            accept={ACCEPTED_TYPES}
            onChange={handleFileChange}
            style={{ display: "none" }}
            type="file"
            multiple
          />
          {files.length > 0 ? (
            <div style={s.fileList}>
              {files.map((file, index) => (
                <div key={index} style={s.fileRow}>
                  {getFileIcon(file)}
                  <div style={s.fileInfo}>
                    <strong style={s.fileName}>{file.name}</strong>
                    <span style={s.fileSize}>{formatFileSize(file.size)}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                    style={s.removeBtn}
                    type="button"
                  >
                    <X size={16} strokeWidth={1.8} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={s.dropzoneBody}>
              <Camera size={28} strokeWidth={1.5} style={{ color: "rgba(124,92,255,0.4)" }} />
              <strong style={s.dropzoneTitle}>Toca para seleccionar</strong>
              <span style={s.dropzoneHint}>o arrastra archivos aquí</span>
              <span style={s.dropzoneFormats}>Imágenes · Videos · Audios · PDF</span>
            </div>
          )}
        </div>

        {/* Error */}
        {uploadError ? (
          <div style={s.errorBox}>
            <AlertTriangle size={14} strokeWidth={1.7} />
            <span>{uploadError}</span>
          </div>
        ) : null}

        {/* Upload button */}
        <button
          disabled={files.length === 0 || isUploading}
          onClick={handleUploadAll}
          style={{
            ...s.primaryButton,
            ...(files.length === 0 || isUploading ? s.buttonDisabled : {}),
            ...(files.length > 0 && !isUploading ? s.buttonGlow : {}),
          }}
          type="button"
        >
          {isUploading ? (
            <>
              <span style={s.spinner} />
              Enviando {files.length > 1 ? `${files.length} archivos` : "archivo"}...
            </>
          ) : (
            <>
              <Upload size={18} strokeWidth={1.7} />
              Enviar al Brain
            </>
          )}
        </button>

        {/* Footer */}
        <div style={s.footer}>
          <Brain size={12} strokeWidth={1.7} />
          <span>El Brain analizará el contenido automáticamente.</span>
        </div>
      </div>
    </div>
  );
}

// ─── Inline styles ────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100dvh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    background: "linear-gradient(135deg, #f8f7fb 0%, #ffffff 42%, #efe9ff 100%)",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  centerBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  loadingText: {
    fontSize: "14px",
    color: "rgba(70,64,84,0.5)",
    margin: 0,
  },
  card: {
    width: "100%",
    maxWidth: "400px",
    background: "rgba(255,255,255,0.75)",
    backdropFilter: "blur(20px) saturate(1.1)",
    WebkitBackdropFilter: "blur(20px) saturate(1.1)",
    borderRadius: "28px",
    padding: "24px 20px",
    boxShadow: "0 8px 40px rgba(0,0,0,0.05)",
    border: "1px solid rgba(255,255,255,0.6)",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    textAlign: "center",
  },
  brandChip: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "11px",
    fontWeight: 600,
    color: "rgba(124,92,255,0.7)",
    padding: "4px 12px",
    borderRadius: "20px",
    background: "rgba(124,92,255,0.08)",
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
  },
  title: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 600,
    color: "rgba(20,18,28,0.92)",
    fontFamily: "'Outfit', sans-serif",
  },
  sub: {
    margin: 0,
    fontSize: "13px",
    color: "rgba(70,64,84,0.6)",
    lineHeight: 1.5,
  },
  secureBadge: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
    fontSize: "11px",
    color: "rgba(90,84,105,0.45)",
    padding: "5px 12px",
    background: "rgba(124,92,255,0.05)",
    borderRadius: "20px",
  },
  dropzone: {
    border: "2px dashed rgba(124,92,255,0.18)",
    borderRadius: "18px",
    padding: "24px 12px",
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.22s ease",
    background: "rgba(124,92,255,0.03)",
    minHeight: "100px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  dropzoneActive: {
    borderColor: "rgba(124,92,255,0.5)",
    background: "rgba(124,92,255,0.08)",
  },
  dropzoneSelected: {
    borderStyle: "solid",
    borderColor: "rgba(124,92,255,0.25)",
    background: "rgba(124,92,255,0.04)",
    padding: "12px",
  },
  dropzoneBody: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
  },
  dropzoneTitle: {
    fontSize: "15px",
    fontWeight: 600,
    color: "rgba(20,18,28,0.75)",
  },
  dropzoneHint: {
    fontSize: "12px",
    color: "rgba(70,64,84,0.5)",
  },
  dropzoneFormats: {
    fontSize: "10px",
    color: "rgba(90,84,105,0.38)",
    marginTop: "2px",
  },
  fileList: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  fileRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "rgba(20,18,28,0.8)",
  },
  fileInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "1px",
    textAlign: "left",
    minWidth: 0,
  },
  fileName: {
    fontSize: "13px",
    fontWeight: 600,
    color: "rgba(20,18,28,0.85)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  fileSize: {
    fontSize: "11px",
    color: "rgba(70,64,84,0.48)",
  },
  removeBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    border: "none",
    background: "rgba(0,0,0,0.04)",
    color: "rgba(70,64,84,0.45)",
    cursor: "pointer",
    flexShrink: 0,
  },
  primaryButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%",
    padding: "14px 24px",
    borderRadius: "16px",
    border: "none",
    background: "linear-gradient(135deg, #7c5cff, #9b7dff)",
    color: "#fff",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontFamily: "'Inter', sans-serif",
  },
  buttonDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },
  buttonGlow: {
    boxShadow: "0 4px 20px rgba(124,92,255,0.25)",
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 14px",
    borderRadius: "12px",
    background: "rgba(239,68,68,0.08)",
    color: "#dc2626",
    fontSize: "13px",
  },
  footer: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    justifyContent: "center",
    fontSize: "11px",
    color: "rgba(90,84,105,0.4)",
    textAlign: "center",
  },
  brandFooter: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "11px",
    color: "rgba(90,84,105,0.35)",
    marginTop: "8px",
    letterSpacing: "0.04em",
  },
  hintRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
    color: "rgba(90,84,105,0.48)",
    marginTop: "4px",
    textAlign: "center" as const,
  },
  // Error state
  errorCard: {
    width: "100%",
    maxWidth: "360px",
    background: "rgba(255,255,255,0.75)",
    backdropFilter: "blur(20px) saturate(1.1)",
    WebkitBackdropFilter: "blur(20px) saturate(1.1)",
    borderRadius: "28px",
    padding: "36px 24px",
    boxShadow: "0 8px 40px rgba(0,0,0,0.05)",
    border: "1px solid rgba(255,255,255,0.6)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    textAlign: "center",
  },
  successCard: {
    width: "100%",
    maxWidth: "360px",
    background: "rgba(255,255,255,0.75)",
    backdropFilter: "blur(20px) saturate(1.1)",
    WebkitBackdropFilter: "blur(20px) saturate(1.1)",
    borderRadius: "28px",
    padding: "36px 24px",
    boxShadow: "0 8px 40px rgba(0,0,0,0.05)",
    border: "1px solid rgba(255,255,255,0.6)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    textAlign: "center",
  },
  successGlow: {
    animation: "none",
  },
  circleIcon: {
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  successNote: {
    margin: 0,
    fontSize: "13px",
    color: "rgba(70,64,84,0.55)",
    lineHeight: 1.5,
  },
  countdownText: {
    margin: 0,
    fontSize: "11px",
    color: "rgba(90,84,105,0.4)",
  },
  spinner: {
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin 0.6s linear infinite",
  },
};
