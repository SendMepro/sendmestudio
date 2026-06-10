import { Clock3, ShoppingBag } from "lucide-react";
import ClientAvatar from "./ClientAvatar";
import AIBadge from "../../app/components/AIBadge";
import styles from "../../app/page.module.css";

interface AppointmentInfo {
  client: string;
  ltv: string;
  priorityLabel: string;
  repurchase: string;
  service: string;
  time: string;
  stylist: string;
  stylistImage: string;
  recommendation: string;
  impact: string;
  clientImageUrl?: string | null;
  clientPhone?: string | null;
}

interface ReservationProgress {
  label: string;
  progress: number;
}

interface HomeClientFocusCardProps {
  selectedAppointment: AppointmentInfo;
  isRealClient: boolean;
  reservationProgress: ReservationProgress;
}

export default function HomeClientFocusCard({
  selectedAppointment,
  isRealClient,
  reservationProgress,
}: HomeClientFocusCardProps) {
  return (
    <section className={styles.clientFocusCard}>
      <div className={styles.clientFocusLeft}>
        <ClientAvatar
          className={styles.clientFocusPortrait}
          name={selectedAppointment.client}
          imageUrl={selectedAppointment.clientImageUrl}
          phone={selectedAppointment.clientPhone}
        />
        <div className={styles.clientFocusSummary}>
          <div className={styles.clientFocusValuePills}>
            {isRealClient ? (
              <span className={`${styles.clientFocusValuePill} ${styles.clientFocusValuePillEmpty}`}>
                Sin datos suficientes
              </span>
            ) : (
              <span className={styles.clientFocusValuePill}>LTV {selectedAppointment.ltv}</span>
            )}
          </div>
        </div>
      </div>

      <div className={styles.clientFocusBody}>
        <h2 className={styles.clientFocusTitle}>{selectedAppointment.client}</h2>

        <div className={styles.clientFocusPriorityRow}>
          <div className={styles.sectionKicker}>{selectedAppointment.priorityLabel}</div>
          {!isRealClient && (
            <div className={styles.clientFocusRepurchase}>
              <ShoppingBag size={12} strokeWidth={2} />
              <span>{selectedAppointment.repurchase}</span>
            </div>
          )}
        </div>

        <div className={styles.clientFocusService}>{selectedAppointment.service}</div>

        <div className={styles.clientFocusMetaRow}>
          <span className={styles.clientFocusTime}>
            <Clock3 size={14} strokeWidth={1.8} />
            <span>{selectedAppointment.time}</span>
          </span>
          <span className={styles.clientFocusStylist}>
            <img
              alt={selectedAppointment.stylist}
              className={styles.stylistAvatar}
              src={selectedAppointment.stylistImage}
            />
            <span>{selectedAppointment.stylist}</span>
          </span>
        </div>

        <div className={styles.reservationProgress}>
          <div className={styles.reservationProgressMeta}>
            <strong>{reservationProgress.label}</strong>
          </div>
          <div className={styles.reservationProgressTrack}>
            <span style={{ width: `${reservationProgress.progress}%` }} />
          </div>
        </div>
      </div>

      {isRealClient && (
        <div className={styles.w5PlaceholderBadge}>
          <span className={styles.w5PlaceholderDot} />
          En construcción
        </div>
      )}

      <img
        alt="Balayage Premium"
        className={styles.serviceGraphicImage}
        src="/img/servicios/Balayage_Premium.png"
      />

      <div className={styles.clientFocusNoteBox}>
        <AIBadge className={styles.noteBadge} />
        <div className={styles.clientFocusNoteLabel}>IA recomienda</div>
        <p className={styles.clientFocusNote}>{selectedAppointment.recommendation}</p>
        <div className={styles.clientFocusImpact}>
          {selectedAppointment.impact} oportunidad detectada
        </div>
      </div>
    </section>
  );
}
