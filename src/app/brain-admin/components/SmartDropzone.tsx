"use client";

import { FileText, Mic, PenSquare, QrCode, Trash2, Upload } from "lucide-react";
import styles from "../brain-admin.module.css";

interface SmartDropzoneProps {
  selectedFile: File | null;
  isUploading: boolean;
  uploadStatus: string;
  uploadLog: string[];
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  onClearFile: () => void;
  onVoiceClick: () => void;
  onNotesClick: () => void;
  onQRClick: () => void;
}

export function SmartDropzone({
  selectedFile,
  isUploading,
  uploadStatus,
  uploadLog,
  onFileChange,
  onUpload,
  onClearFile,
  onVoiceClick,
  onNotesClick,
  onQRClick,
}: SmartDropzoneProps) {
  return (
    <article className={styles.smartDropzone}>
        <div className={styles.cardHeader}>
          <div>
            <span>Nueva fuente de aprendizaje</span>
            <h2>Nuevo aprendizaje</h2>
          </div>
          <Upload size={18} strokeWidth={1.7} />
        </div>
        <p className={styles.dropzoneHint}>
          El Brain detecta automáticamente el formato: imágenes, audios, PDFs, textos, markdown.
          También puedes grabar una nota de voz.
        </p>
        <div className={styles.fileDropWrapper}>
          <label className={`${styles.fileDrop} ${styles.fileDropScanning}`}>
            <FileText size={18} strokeWidth={1.7} />
            <strong>{selectedFile?.name ?? "Seleccionar archivo"}</strong>
            <span>WhatsApp screenshots · imágenes · audios · PDFs · textos · markdown</span>
            <input
              accept="image/*,.txt,.md,.pdf,.csv,.json,audio/*,text/plain,text/markdown,application/pdf"
              onChange={onFileChange}
              type="file"
            />
          </label>
          {selectedFile ? (
            <button
              className={styles.clearFileBtn}
              onClick={onClearFile}
              type="button"
              title="Eliminar archivo seleccionado"
            >
              <Trash2 size={14} strokeWidth={1.8} />
            </button>
          ) : null}
        </div>
        <div className={styles.dropzoneActions}>
          <button disabled={isUploading} onClick={onUpload} type="button">
            {isUploading ? "Procesando..." : "Alimentar al Brain"}
          </button>
          <button
            className={styles.voiceBtn}
            onClick={onVoiceClick}
            type="button"
          >
            <Mic size={16} strokeWidth={1.7} />
            Nota de voz
          </button>
          <button
            className={styles.voiceBtn}
            onClick={onNotesClick}
            type="button"
          >
            <PenSquare size={16} strokeWidth={1.7} />
            Colaborar con notas
          </button>
          <button
            className={styles.voiceBtn}
            onClick={onQRClick}
            type="button"
          >
            <QrCode size={16} strokeWidth={1.7} />
            Subir desde celular
          </button>
        </div>
        {uploadStatus ? <p className={styles.status}>{uploadStatus}</p> : null}
        {uploadLog.length > 0 ? (
          <div className={styles.uploadLog}>
            {uploadLog.map((line, index) => (
              <span key={index} className={styles.uploadLogLine}>{line}</span>
            ))}
          </div>
        ) : null}
      </article>
  );
}
