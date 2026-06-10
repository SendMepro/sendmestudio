"use client";

import { AlertCircle, PenSquare, ThumbsDown, ThumbsUp, X } from "lucide-react";
import styles from "../brain-admin.module.css";

type AuditResult = {
  status: "approved" | "needs_edit" | "out_of_context" | "not_suitable" | null;
  message: string;
};

type NotesModalProps = {
  isOpen: boolean;
  noteText: string;
  isAuditing: boolean;
  isSavingNote: boolean;
  auditResult: AuditResult;
  onNoteTextChange: (value: string) => void;
  onAudit: () => void;
  onSave: () => Promise<void>;
  onClose: () => void;
};

export function NotesModal({
  isOpen,
  noteText,
  isAuditing,
  isSavingNote,
  auditResult,
  onNoteTextChange,
  onAudit,
  onSave,
  onClose,
}: NotesModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalBackdrop} onMouseDown={onClose}>
      <section className={styles.notesModal} onMouseDown={(event) => event.stopPropagation()}>
        <button className={styles.closeModalButton} onClick={onClose} type="button">
          <X size={16} strokeWidth={1.8} />
        </button>
        <PenSquare size={20} strokeWidth={1.6} />
        <h2>Colaborar con notas</h2>
        <p className={styles.notesModalSub}>
          Escribe observaciones del día, errores, dudas frecuentes o aprendizajes del equipo.
        </p>
        <textarea
          className={styles.notesTextarea}
          onChange={(event) => onNoteTextChange(event.target.value)}
          placeholder="Ej: Hoy varias clientas preguntaron por baño de color y canas. Una clienta se confundió con el precio. Conviene preparar una respuesta más clara."
          value={noteText}
        />
        {auditResult.status ? (
          <div className={styles.auditResult} data-status={auditResult.status}>
            {auditResult.status === "approved" ? (
              <ThumbsUp size={16} strokeWidth={1.7} />
            ) : auditResult.status === "needs_edit" ? (
              <AlertCircle size={16} strokeWidth={1.7} />
            ) : (
              <ThumbsDown size={16} strokeWidth={1.7} />
            )}
            <span>{auditResult.message}</span>
          </div>
        ) : null}
        <div className={styles.notesModalActions}>
          <button
            className={styles.auditBtn}
            disabled={isAuditing || !noteText.trim()}
            onClick={onAudit}
            type="button"
          >
            {isAuditing ? "Auditando..." : "Auditar nota"}
          </button>
          <button
            className={styles.saveNoteBtn}
            disabled={isSavingNote || !noteText.trim() || auditResult.status !== "approved"}
            onClick={onSave}
            type="button"
          >
            {isSavingNote ? "Guardando..." : "Guardar aprendizaje"}
          </button>
        </div>
      </section>
    </div>
  );
}
