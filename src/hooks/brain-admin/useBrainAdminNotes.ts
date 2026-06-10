"use client";

import { useState } from "react";

type AuditResult = {
  status: "approved" | "needs_edit" | "out_of_context" | "not_suitable" | null;
  message: string;
};

type NotesResult = {
  noteText: string;
  auditResult: AuditResult;
  isAuditing: boolean;
  isSavingNote: boolean;
  auditNote: () => Promise<void>;
  saveNote: () => Promise<void>;
  openNotesModal: () => void;
  closeNotesModal: () => void;
  setNoteText: (value: string) => void;
};

type NotesCallbacks = {
  showToast: (message: string) => void;
  loadSummary: () => Promise<void>;
};

/**
 * Hook that encapsulates the notes/audit modal logic for Brain Admin.
 *
 * Manages note text, AI audit of the note, and saving as a learning entry.
 * Modal visibility (isNotesModalOpen) stays in the page as UI state.
 */
export function useBrainAdminNotes(callbacks: NotesCallbacks): NotesResult {
  const { showToast, loadSummary } = callbacks;

  const [noteText, setNoteText] = useState("");
  const [auditResult, setAuditResult] = useState<AuditResult>({
    status: null,
    message: "",
  });
  const [isAuditing, setIsAuditing] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);

  const auditNote = async () => {
    if (!noteText.trim()) {
      setAuditResult({
        status: null,
        message: "Escribe una nota antes de auditar.",
      });
      return;
    }

    setIsAuditing(true);
    setAuditResult({ status: null, message: "" });

    try {
      const response = await fetch("/api/brain-admin/audit-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: noteText.trim() }),
      });
      const data = await response.json();

      if (response.ok) {
        setAuditResult({
          status: data.status as AuditResult["status"],
          message: data.message,
        });
      } else {
        setAuditResult({
          status: "not_suitable",
          message: data.error || "No se pudo auditar la nota.",
        });
      }
    } catch {
      setAuditResult({
        status: "not_suitable",
        message: "Error de conexión al auditar la nota.",
      });
    } finally {
      setIsAuditing(false);
    }
  };

  const saveNote = async () => {
    if (!noteText.trim()) return;

    setIsSavingNote(true);
    try {
      const response = await fetch("/api/brain-admin/audit-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: noteText.trim(), save: true }),
      });
      const data = await response.json();

      if (response.ok && data.ok) {
        setNoteText("");
        setAuditResult({ status: null, message: "" });
        showToast("📝 Nota guardada como aprendizaje del Brain");
        await loadSummary();
      } else {
        setAuditResult({
          status: "needs_edit",
          message: data.error || "No se pudo guardar la nota.",
        });
      }
    } catch {
      setAuditResult({
        status: "needs_edit",
        message: "Error de conexión al guardar la nota.",
      });
    } finally {
      setIsSavingNote(false);
    }
  };

  const openNotesModal = () => {
    setAuditResult({ status: null, message: "" });
  };

  const closeNotesModal = () => {
    setNoteText("");
    setAuditResult({ status: null, message: "" });
  };

  return {
    noteText,
    auditResult,
    isAuditing,
    isSavingNote,
    auditNote,
    saveNote,
    openNotesModal,
    closeNotesModal,
    setNoteText,
  };
}
