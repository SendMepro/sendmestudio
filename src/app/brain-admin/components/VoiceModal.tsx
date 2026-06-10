"use client";

import { Mic, Square, X } from "lucide-react";
import styles from "../brain-admin.module.css";

type VoiceModalProps = {
  isOpen: boolean;
  isRecording: boolean;
  isSavingVoice: boolean;
  voiceTranscript: string;
  voiceStatus: string | null;
  formattedRecordingTime: string;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onTranscriptChange: (value: string) => void;
  onSave: () => Promise<void>;
  onClose: () => void;
};

export function VoiceModal({
  isOpen,
  isRecording,
  isSavingVoice,
  voiceTranscript,
  voiceStatus,
  formattedRecordingTime,
  onStartRecording,
  onStopRecording,
  onTranscriptChange,
  onSave,
  onClose,
}: VoiceModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalBackdrop} onMouseDown={onClose}>
      <section className={styles.voiceModal} onMouseDown={(event) => event.stopPropagation()}>
        <button className={styles.closeModalButton} onClick={onClose} type="button">
          <X size={16} strokeWidth={1.8} />
        </button>
        <span>Voice Brain Capture</span>
        <h2>Registrar aprendizaje por voz</h2>
        <p>
          Cuenta el problema, oportunidad o aprendizaje del día. Luego revisa el texto antes de guardar en el cerebro del negocio.
        </p>
        <div className={styles.recordingPanel} data-recording={isRecording ? "true" : "false"}>
          <strong>{formattedRecordingTime}</strong>
          <div>
            <button disabled={isRecording} onClick={onStartRecording} type="button">
              <Mic size={16} strokeWidth={1.8} />
              Grabar
            </button>
            <button disabled={!isRecording} onClick={onStopRecording} type="button">
              <Square size={15} strokeWidth={1.8} />
              Detener
            </button>
          </div>
        </div>
        <label className={styles.transcriptEditor}>
          <span>Revisa el texto antes de guardar en el cerebro del negocio.</span>
          <textarea
            onChange={(event) => onTranscriptChange(event.target.value)}
            placeholder="La transcripción aparecerá aquí. También puedes escribirla manualmente."
            value={voiceTranscript}
          />
        </label>
        {voiceStatus ? <p className={styles.voiceStatus}>{voiceStatus}</p> : null}
        <div className={styles.voiceModalActions}>
          <button onClick={onClose} type="button">Cancelar</button>
          <button disabled={isSavingVoice || isRecording} onClick={onSave} type="button">
            {isSavingVoice ? "Guardando..." : "OK"}
          </button>
        </div>
      </section>
    </div>
  );
}
