"use client";

import { type ChangeEvent, useState } from "react";

type LearnedToday = {
  title: string;
  signals: string[];
  emotions: string[];
  insights: string[];
};

type SignalEntry = {
  id: string;
  category: string;
  title: string;
  impact: number;
  status: string;
  createdAt: string;
  source: string;
};

type FileUploadResult = {
  selectedFile: File | null;
  uploadStatus: string;
  isUploading: boolean;
  uploadLog: string[];
  notes: string;
  learnedToday: LearnedToday | null;
  newSignals: SignalEntry[];
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleUpload: () => Promise<void>;
  handleClearFile: () => void;
  setNotes: (value: string) => void;
  setUploadStatus: (value: string) => void;
};

type FileUploadCallbacks = {
  onUploadSuccess: (data: {
    summary: unknown;
    learnedToday?: LearnedToday | null;
    newSignals?: unknown[];
  }) => Promise<void>;
  loadStorageStats: () => Promise<void>;
  showToast: (message: string) => void;
};

/**
 * Hook that encapsulates file selection, upload, and processing logic
 * for the Brain Admin upload dropzone.
 */
export function useBrainAdminFileUpload(
  callbacks: FileUploadCallbacks
): FileUploadResult {
  const { onUploadSuccess, loadStorageStats, showToast } = callbacks;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadLog, setUploadLog] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [learnedToday, setLearnedToday] = useState<LearnedToday | null>(null);
  const [newSignals, setNewSignals] = useState<SignalEntry[]>([]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files?.[0] ?? null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus("Selecciona un archivo antes de subir.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("sourceType", "auto-detect");
    formData.append("notes", notes);
    setIsUploading(true);
    setUploadStatus("");
    setUploadLog([]);
    setLearnedToday(null);
    setNewSignals([]);

    const logs: string[] = [];
    logs.push(`📄 Archivo detectado: "${selectedFile.name}"`);
    logs.push(`🔍 MIME detectado: ${selectedFile.type || "application/octet-stream"}`);

    try {
      const response = await fetch("/api/brain-admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Upload failed");
      }

      // Determine destination folder from MIME type
      const mime = selectedFile.type || "";
      const ext = selectedFile.name.split(".").pop()?.toLowerCase() || "";
      const audioExts = [
        "mp3", "wav", "m4a", "webm", "aac", "ogg", "oga",
        "opus", "amr", "caf", "3gp", "3gpp", "m4r",
      ];
      let destFolder = "/.txt";
      if (["jpg", "jpeg", "png", "webp"].includes(ext) || mime.startsWith("image/")) {
        destFolder = "/img";
      } else if (
        audioExts.includes(ext) ||
        mime.startsWith("audio/") ||
        (ext === "mp4" && mime.startsWith("audio/"))
      ) {
        destFolder = "/.mp3";
      } else if (ext === "md" || mime === "text/markdown") {
        destFolder = "/.md";
      } else if (ext === "pdf" || mime === "application/pdf") {
        destFolder = "/.pdf";
      } else if (ext === "txt" || mime.startsWith("text/")) {
        destFolder = "/.txt";
      }

      logs.push(`📁 Carpeta destino: ${destFolder}`);
      logs.push(`🧠 Memoria registrada en business-brain/memory-log.md`);

      setSelectedFile(null);
      setNotes("");
      setUploadLog(logs);
      setUploadStatus("Archivo procesado y aprendizaje registrado.");

      // Show "Qué aprendió hoy" section
      if (data.learnedToday) {
        setLearnedToday(data.learnedToday);
      }
      if (data.newSignals) {
        setNewSignals(data.newSignals);
      }

      // Fire parent callbacks
      await onUploadSuccess({
        summary: data.summary,
        learnedToday: data.learnedToday,
        newSignals: data.newSignals,
      });

      showToast("🧠 Nuevo aprendizaje registrado en el sistema");
      await loadStorageStats();
    } catch (error) {
      logs.push(
        `❌ Error: ${
          error instanceof Error ? error.message : "No se pudo procesar el archivo."
        }`
      );
      setUploadLog(logs);
      setUploadStatus(
        error instanceof Error ? error.message : "No se pudo procesar el archivo."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearFile = () => {
    if (uploadLog.length > 0) {
      const confirmed = window.confirm(
        "Este archivo ya fue registrado. ¿Deseas eliminarlo del registro local?"
      );
      if (!confirmed) return;
    }
    setSelectedFile(null);
    setUploadLog([]);
    setUploadStatus("");
  };

  return {
    selectedFile,
    uploadStatus,
    isUploading,
    uploadLog,
    notes,
    learnedToday,
    newSignals,
    handleFileChange,
    handleUpload,
    handleClearFile,
    setNotes,
    setUploadStatus,
  };
}
