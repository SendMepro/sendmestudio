import { Clock3, CheckCircle2 } from "lucide-react";
import styles from "../../../app/page.module.css";

interface ArrivalRecord {
  arrivedAt: string;
  deltaMinutes: number;
}

interface HomeArrivalBehaviorProps {
  selectedArrivalLabel: string;
  selectedArrivalRecord: ArrivalRecord | undefined;
  modoTecnico: boolean;
  renderBilingual: (value: string, labelClassName?: string) => React.ReactNode;
  onRegisterArrival: () => void;
  chileTimeLabel: (date: Date) => string;
}

export default function HomeArrivalBehavior({
  selectedArrivalLabel,
  selectedArrivalRecord,
  modoTecnico,
  renderBilingual,
  onRegisterArrival,
  chileTimeLabel,
}: HomeArrivalBehaviorProps) {
  return (
    <section className={styles.luxuryArrivalSection}>
      <div className={styles.arrivalCardMain}>
        <div className={styles.dossierHeaderLine}>
          <Clock3 size={13} className={styles.dossierIcon} />
          <div className={styles.luxuryTitleWrapper}>
            <span className={styles.luxuryDossierTitle}>Comportamiento horario</span>
            {modoTecnico && <span className={styles.subLabelEn}>Arrival Behavior</span>}
          </div>
        </div>
        <strong className={styles.arrivalBehaviorStrong}>{selectedArrivalLabel}</strong>
        {selectedArrivalRecord ? (
          <small className={styles.arrivalSmallText}>Registrado {chileTimeLabel(new Date(selectedArrivalRecord.arrivedAt))}</small>
        ) : (
          <small className={styles.arrivalSmallText}>
            {renderBilingual("Presiona cuando la clienta llegue / Press when client arrives.", styles.arrivalSmallText)}
          </small>
        )}
      </div>
      <button type="button" className={styles.luxuryArrivalBtn} onClick={onRegisterArrival}>
        <CheckCircle2 size={14} strokeWidth={1.8} />
        {renderBilingual("Llegó / Arrived")}
      </button>
    </section>
  );
}
