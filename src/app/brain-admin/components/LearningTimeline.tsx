"use client";

import { Brain, Clock, Mic, PenSquare, Upload } from "lucide-react";
import styles from "../brain-admin.module.css";

type LastUpload = {
  id: string;
  originalName: string;
  sourceType: string;
  uploadedAt: string;
  leadWarmth: string;
  bookingIntent: string;
};

type LearningTimelineProps = {
  lastUploads: LastUpload[];
};

export function LearningTimeline({ lastUploads }: LearningTimelineProps) {
  return (
    <section className={styles.timelineCard}>
      <div className={styles.cardHeader}>
        <div>
          <span>Actividad reciente</span>
          <h2>Timeline de aprendizaje</h2>
        </div>
        <Clock size={18} strokeWidth={1.7} />
      </div>
      <div className={styles.timelineList}>
        {lastUploads.length > 0 ? lastUploads.map((upload) => {
          const dotType = upload.sourceType === "voice" ? "voice" :
            upload.sourceType === "note" ? "note" : "upload";
          const icon = dotType === "voice" ? <Mic size={12} strokeWidth={1.8} /> :
            dotType === "note" ? <PenSquare size={12} strokeWidth={1.8} /> :
            <Upload size={12} strokeWidth={1.8} />;
          const timeAgo = (() => {
            const diff = Date.now() - new Date(upload.uploadedAt).getTime();
            const mins = Math.floor(diff / 60000);
            if (mins < 1) return "Ahora";
            if (mins < 60) return `Hace ${mins} min`;
            const hrs = Math.floor(mins / 60);
            if (hrs < 24) return `Hace ${hrs}h`;
            const days = Math.floor(hrs / 24);
            return `Hace ${days}d`;
          })();
          return (
            <div key={upload.id} className={styles.timelineItem}>
              <div className={styles.timelineDot} data-type={dotType}>
                {icon}
              </div>
              <div className={styles.timelineBody}>
                <strong>{upload.originalName}</strong>
                <span>
                  {upload.sourceType === "voice" ? "Nota de voz" :
                   upload.sourceType === "note" ? "Nota colaborativa" :
                   upload.sourceType} · {upload.leadWarmth === "hot" ? "Interés alto" :
                   upload.leadWarmth === "warm" ? "Interés medio" : "Interés bajo"}
                </span>
              </div>
              <span className={styles.timelineTime}>{timeAgo}</span>
            </div>
          );
        }) : (
          <div className={styles.nightEmpty}>
            <Brain size={24} strokeWidth={1.5} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p>Sube el primer archivo para iniciar el aprendizaje del negocio.</p>
          </div>
        )}
      </div>
    </section>
  );
}
