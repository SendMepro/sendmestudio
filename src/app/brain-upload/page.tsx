"use client";

import { type ChangeEvent, useEffect, useState } from "react";
import {
  Brain,
  CheckCircle2,
  FileText,
  Image,
  Lock,
  Mic,
  Music,
  Sparkles,
  Upload,
  Video,
  X,
  AlertTriangle,
  QrCode,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type TokenStatus = {
  valid: boolean;
  token?: string;
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
  record?: {
    originalName: string;
    uploadedAt: string;
  };
};

// ─── Constants ──────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = "image/*,.txt,.md,.pdf,audio/*,video/*,text/plain,text/markdown,application/pdf";
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

// ─── Component ──────────────────────────────────────────────────────────────

export default function BrainUploadPage() {
  const [tokenStatus, setTokenStatus] = useState<TokenStatus | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  // Validate token on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setTokenStatus({
        valid: false,
        error: "Este enlace expiró. Genera un nuevo QR desde Brain Admin.",
        expired: true,
      });
      setIsValidating(false);
      return;
    }

    fetch(`/api/brain-admin/qr-token?token=${encodeURIComponent(token)}`, {
      cache: "no-store",
    })
      .then(async (res) => {
        const data = await res.json();
        setTokenStatus(data);
        setIsValidating(false);
      })
      .catch(() => {
        setTokenStatus({
          valid: false,
          error: "Error de conexión. Intenta de nuevo.",
        });
        setIsValidating(false);
      });
  }, []);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    validateAndSetFile(file);
  };

  const validateAndSetFile = (file: File | null) => {
    setUploadError("");
    setUploadResult(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`El archivo es demasiado grande (máximo 50 MB).`);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0] ?? null;
    validateAndSetFile(file);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleUpload = async () => {
    if (!selectedFile || !tokenStatus?.token) return;

    setIsUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("sourceType", "qr-upload");
      formData.append("notes", `Subido desde celular — Código: ${tokenStatus.shortCode || ""}`);

      const response = await fetch("/api/brain-admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        setUploadResult(data);

        // Mark token as used
        await fetch("/api/brain-admin/qr-token", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: tokenStatus.token }),
        });
      } else {
        setUploadError(data.error || "Error al subir el archivo.");
      }
    } catch {
      setUploadError("Error de conexión. Intenta de nuevo.");
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

    if (type.startsWith("image/")) return <Image size={24} strokeWidth={1.6} />;
    if (type.startsWith("video/")) return <Video size={24} strokeWidth={1.6} />;
    if (type.startsWith("audio/")) return <Music size={24} strokeWidth={1.6} />;
    if (ext === "pdf") return <FileText size={24} strokeWidth={1.6} />;
    if (ext === "md") return <FileText size={24} strokeWidth={1.6} />;
    return <FileText size={24} strokeWidth={1.6} />;
  };

  // ─── Loading state ──────────────────────────────────────────────────────
  if (isValidating) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingCard}>
          <Brain size={32} strokeWidth={1.5} />
          <p style={styles.loadingText}>Validando acceso...</p>
        </div>
      </div>
    );
  }

  // ─── Invalid / expired token ────────────────────────────────────────────
  if (!tokenStatus?.valid) {
    return (
      <div style={styles.container}>
        <div style={styles.errorCard}>
          <div style={styles.errorIcon}>
            <AlertTriangle size={28} strokeWidth={1.6} />
          </div>
          <h1 style={styles.errorTitle}>Enlace expirado</h1>
          <p style={styles.errorMessage}>
            {tokenStatus?.error || "Este enlace expiró. Genera un nuevo QR desde Brain Admin."}
          </p>
          <div style={styles.errorHint}>
            <QrCode size={16} strokeWidth={1.7} />
            <span>Solicita un nuevo código QR en el panel de administración.</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── Success state ──────────────────────────────────────────────────────
  if (uploadResult?.ok) {
    return (
      <div style={styles.container}>
        <div style={styles.successCard}>
          <div style={styles.successIcon}>
            <CheckCircle2 size={40} strokeWidth={1.5} />
          </div>
          <h1 style={styles.successTitle}>Archivo subido correctamente</h1>
          <p style={styles.successMessage}>
            <strong>{uploadResult.record?.originalName}</strong> fue enviado al Brain del salón.
          </p>
          <button
            onClick={() => {
              setSelectedFile(null);
              setUploadResult(null);
              setUploadError("");
            }}
            style={styles.primaryButton}
            type="button"
          >
            Subir otro archivo
          </button>
        </div>
      </div>
    );
  }

  // ─── Main upload UI ─────────────────────────────────────────────────────
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <Brain size={24} strokeWidth={1.5} />
          <h1 style={styles.title}>Subir al Brain</h1>
          <p style={styles.subtitle}>
            Envía fotos, videos, audios o documentos directamente al sistema de aprendizaje del salón.
          </p>
        </div>

        {/* Token info */}
        <div style={styles.tokenInfo}>
          <Lock size={14} strokeWidth={1.8} />
          <span>Conexión segura · Cliente: {tokenStatus.clientSlug || "Cliente"}</span>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            ...styles.dropzone,
            ...(dragOver ? styles.dropzoneActive : {}),
            ...(selectedFile ? styles.dropzoneSelected : {}),
          }}
        >
          {selectedFile ? (
            <div style={styles.filePreview}>
              {getFileIcon(selectedFile)}
              <div style={styles.fileInfo}>
                <strong style={styles.fileName}>{selectedFile.name}</strong>
                <span style={styles.fileSize}>{formatFileSize(selectedFile.size)}</span>
              </div>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setUploadError("");
                }}
                style={styles.removeButton}
                type="button"
                title="Quitar archivo"
              >
                <X size={18} strokeWidth={1.8} />
              </button>
            </div>
          ) : (
            <label style={styles.dropzoneLabel}>
              <Upload size={32} strokeWidth={1.5} />
              <strong style={styles.dropzoneText}>Toca para seleccionar</strong>
              <span style={styles.dropzoneHint}>
                o arrastra un archivo aquí
              </span>
              <span style={styles.dropzoneFormats}>
                Imágenes · Videos · Audios · PDF · TXT · MD
              </span>
              <input
                accept={ACCEPTED_TYPES}
                onChange={handleFileChange}
                style={{ display: "none" }}
                type="file"
              />
            </label>
          )}
        </div>

        {/* Error */}
        {uploadError ? (
          <div style={styles.errorBox}>
            <AlertTriangle size={16} strokeWidth={1.7} />
            <span>{uploadError}</span>
          </div>
        ) : null}

        {/* Upload button */}
        <button
          disabled={!selectedFile || isUploading}
          onClick={handleUpload}
          style={{
            ...styles.primaryButton,
            ...(!selectedFile || isUploading ? styles.buttonDisabled : {}),
          }}
          type="button"
        >
          {isUploading ? (
            <>
              <span style={styles.spinner} />
              Subiendo...
            </>
          ) : (
            <>
              <Upload size={18} strokeWidth={1.7} />
              Subir al Brain
            </>
          )}
        </button>

        {/* Footer */}
        <div style={styles.footer}>
          <Sparkles size={14} strokeWidth={1.7} />
          <span>El Brain analizará el contenido y extraerá aprendizajes automáticamente.</span>
        </div>
      </div>
    </div>
  );
}

// ─── Inline styles (no CSS module needed for standalone mobile page) ─────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100dvh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    background: "linear-gradient(135deg, #f8f7fb 0%, #ffffff 42%, #efe9ff 100%)",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    background: "rgba(255,255,255,0.72)",
    backdropFilter: "blur(16px) saturate(1.1)",
    WebkitBackdropFilter: "blur(16px) saturate(1.1)",
    borderRadius: "24px",
    padding: "28px 24px",
    boxShadow: "0 12px 60px rgba(0,0,0,0.06)",
    border: "1px solid rgba(255,255,255,0.5)",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    textAlign: "center",
  },
  title: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 600,
    color: "rgba(20,18,28,0.92)",
    fontFamily: "'Outfit', sans-serif",
  },
  subtitle: {
    margin: 0,
    fontSize: "14px",
    color: "rgba(70,64,84,0.68)",
    lineHeight: 1.5,
  },
  tokenInfo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    fontSize: "12px",
    color: "rgba(90,84,105,0.5)",
    padding: "6px 12px",
    background: "rgba(124,92,255,0.06)",
    borderRadius: "20px",
  },
  dropzone: {
    border: "2px dashed rgba(124,92,255,0.2)",
    borderRadius: "16px",
    padding: "32px 16px",
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
    background: "rgba(124,92,255,0.03)",
  },
  dropzoneActive: {
    borderColor: "rgba(124,92,255,0.5)",
    background: "rgba(124,92,255,0.08)",
  },
  dropzoneSelected: {
    borderStyle: "solid",
    borderColor: "rgba(124,92,255,0.3)",
    background: "rgba(124,92,255,0.05)",
    padding: "16px",
  },
  dropzoneLabel: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    color: "rgba(124,92,255,0.7)",
  },
  dropzoneText: {
    fontSize: "16px",
    fontWeight: 600,
    color: "rgba(20,18,28,0.8)",
  },
  dropzoneHint: {
    fontSize: "13px",
    color: "rgba(70,64,84,0.5)",
  },
  dropzoneFormats: {
    fontSize: "11px",
    color: "rgba(90,84,105,0.4)",
    marginTop: "4px",
  },
  filePreview: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    color: "rgba(20,18,28,0.8)",
  },
  fileInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    textAlign: "left",
    minWidth: 0,
  },
  fileName: {
    fontSize: "14px",
    fontWeight: 600,
    color: "rgba(20,18,28,0.85)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  fileSize: {
    fontSize: "12px",
    color: "rgba(70,64,84,0.5)",
  },
  removeButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    border: "none",
    background: "rgba(0,0,0,0.05)",
    color: "rgba(70,64,84,0.5)",
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
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg, #7c5cff, #9b7dff)",
    color: "#fff",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity 0.2s ease",
    fontFamily: "'Inter', sans-serif",
  },
  buttonDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
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
    fontSize: "12px",
    color: "rgba(90,84,105,0.42)",
    textAlign: "center",
  },
  // Loading
  loadingCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    color: "rgba(124,92,255,0.7)",
  },
  loadingText: {
    fontSize: "15px",
    color: "rgba(70,64,84,0.6)",
    margin: 0,
  },
  // Error state
  errorCard: {
    width: "100%",
    maxWidth: "380px",
    background: "rgba(255,255,255,0.72)",
    backdropFilter: "blur(16px) saturate(1.1)",
    WebkitBackdropFilter: "blur(16px) saturate(1.1)",
    borderRadius: "24px",
    padding: "40px 24px",
    boxShadow: "0 12px 60px rgba(0,0,0,0.06)",
    border: "1px solid rgba(255,255,255,0.5)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    textAlign: "center",
  },
  errorIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(239,68,68,0.1)",
    color: "#dc2626",
  },
  errorTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 600,
    color: "rgba(20,18,28,0.92)",
    fontFamily: "'Outfit', sans-serif",
  },
  errorMessage: {
    margin: 0,
    fontSize: "14px",
    color: "rgba(70,64,84,0.68)",
    lineHeight: 1.5,
  },
  errorHint: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "rgba(90,84,105,0.5)",
    marginTop: "8px",
  },
  // Success state
  successCard: {
    width: "100%",
    maxWidth: "380px",
    background: "rgba(255,255,255,0.72)",
    backdropFilter: "blur(16px) saturate(1.1)",
    WebkitBackdropFilter: "blur(16px) saturate(1.1)",
    borderRadius: "24px",
    padding: "40px 24px",
    boxShadow: "0 12px 60px rgba(0,0,0,0.06)",
    border: "1px solid rgba(255,255,255,0.5)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    textAlign: "center",
  },
  successIcon: {
    color: "#16a34a",
  },
  successTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 600,
    color: "rgba(20,18,28,0.92)",
    fontFamily: "'Outfit', sans-serif",
  },
  successMessage: {
    margin: 0,
    fontSize: "14px",
    color: "rgba(70,64,84,0.68)",
    lineHeight: 1.5,
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
