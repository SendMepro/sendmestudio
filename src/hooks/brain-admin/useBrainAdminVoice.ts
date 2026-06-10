"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type SpeechRecognitionEventLike = {
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

type VoiceRecordingResult = {
  isRecording: boolean;
  recordingSeconds: number;
  voiceTranscript: string;
  voiceStatus: string;
  voiceAudioBlob: Blob | null;
  isSavingVoice: boolean;
  formattedRecordingTime: string;
  startVoiceRecording: () => Promise<void>;
  stopVoiceRecording: () => void;
  closeVoiceModal: () => void;
  saveVoiceLearning: () => Promise<void>;
  updateSuggestion: (id: string, status: "applied" | "dismissed") => Promise<void>;
  setVoiceTranscript: (value: string) => void;
};

type VoiceRecordingCallbacks = {
  onSaveSuccess: (summary: unknown) => void;
  setUploadStatus: (value: string) => void;
};

/**
 * Hook that encapsulates voice recording, speech recognition, transcription,
 * and uploading audio learning to the brain admin API.
 */
export function useBrainAdminVoice(
  callbacks: VoiceRecordingCallbacks
): VoiceRecordingResult {
  const { onSaveSuccess, setUploadStatus } = callbacks;

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceStatus, setVoiceStatus] = useState("");
  const [voiceAudioBlob, setVoiceAudioBlob] = useState<Blob | null>(null);
  const [isSavingVoice, setIsSavingVoice] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const formattedRecordingTime = useMemo(() => {
    const minutes = Math.floor(recordingSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (recordingSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [recordingSeconds]);

  useEffect(() => {
    if (!isRecording) {
      return;
    }

    const interval = window.setInterval(() => {
      setRecordingSeconds((s) => s + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRecording]);

  const startVoiceRecording = async () => {
    setVoiceStatus("");
    setVoiceAudioBlob(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaStreamRef.current = stream;
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        setVoiceAudioBlob(
          new Blob(audioChunksRef.current, { type: mimeType })
        );
      };

      const recognitionConstructor =
        (window as SpeechRecognitionWindow).SpeechRecognition ??
        (window as SpeechRecognitionWindow).webkitSpeechRecognition;

      if (recognitionConstructor) {
        const recognition = new recognitionConstructor();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = "es-CL";
        recognition.onresult = (event) => {
          const transcript = Array.from(
            { length: event.results.length },
            (_, index) => event.results[index]
          )
            .filter((result) => result.isFinal)
            .map((result) => result[0].transcript.trim())
            .filter(Boolean)
            .join(" ");

          if (transcript) {
            setVoiceTranscript((current) =>
              [current, transcript].filter(Boolean).join(" ")
            );
          }
        };
        recognition.onerror = () => {
          setVoiceStatus(
            "La transcripción automática no está disponible. Puedes escribir el texto manualmente."
          );
        };
        recognition.start();
        recognitionRef.current = recognition;
      } else {
        setVoiceStatus(
          "Tu navegador no ofrece transcripción automática. Puedes grabar y escribir el texto manualmente."
        );
      }

      recorder.start();
      setRecordingSeconds(0);
      setIsRecording(true);
    } catch {
      setVoiceStatus(
        "No se pudo acceder al micrófono. Revisa permisos del navegador."
      );
    }
  };

  const stopVoiceRecording = () => {
    recorderRef.current?.stop();
    recognitionRef.current?.stop();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    recorderRef.current = null;
    recognitionRef.current = null;
    mediaStreamRef.current = null;
    setIsRecording(false);
    setVoiceStatus(
      (current) =>
        current ||
        "Grabación lista. Revisa el texto antes de guardar en el cerebro del negocio."
    );
  };

  const closeVoiceModal = () => {
    if (isRecording) {
      stopVoiceRecording();
    }
  };

  const saveVoiceLearning = async () => {
    if (!voiceTranscript.trim()) {
      setVoiceStatus("Agrega o corrige la transcripción antes de guardar.");
      return;
    }

    const formData = new FormData();
    formData.append("transcript", voiceTranscript.trim());

    if (voiceAudioBlob) {
      formData.append(
        "audio",
        new (File as unknown as new (
          fileBits: Blob[],
          fileName: string,
          options?: FilePropertyBag
        ) => File)(
          [voiceAudioBlob],
          "voice-learning.webm",
          { type: voiceAudioBlob.type || "audio/webm" }
        )
      );
    }

    setIsSavingVoice(true);
    setVoiceStatus("");

    try {
      const response = await fetch("/api/brain-admin/voice", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "No se pudo guardar el aprendizaje por voz.");
      }

      onSaveSuccess(data.summary);
      setVoiceTranscript("");
      setVoiceAudioBlob(null);
      setRecordingSeconds(0);
      setUploadStatus("Aprendizaje por voz guardado y sugerencias generadas.");
    } catch (error) {
      setVoiceStatus(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el aprendizaje por voz."
      );
    } finally {
      setIsSavingVoice(false);
    }
  };

  const updateSuggestion = async (
    id: string,
    status: "applied" | "dismissed"
  ) => {
    const response = await fetch("/api/brain-admin/voice", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const data = await response.json();

    if (response.ok && data.summary) {
      onSaveSuccess(data.summary);
    }
  };

  return {
    isRecording,
    recordingSeconds,
    voiceTranscript,
    voiceStatus,
    voiceAudioBlob,
    isSavingVoice,
    formattedRecordingTime,
    startVoiceRecording,
    stopVoiceRecording,
    closeVoiceModal,
    saveVoiceLearning,
    updateSuggestion,
    setVoiceTranscript,
  };
}
