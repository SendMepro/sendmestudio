import { Compass } from "lucide-react";
import styles from "../../../app/page.module.css";

interface TechnicalHistory {
  tonesUsed: string;
  recentServices: string;
  observations: string;
  preferences: string;
}

interface HomeTechnicalHistoryProps {
  th: TechnicalHistory;
  modoTecnico: boolean;
  renderBilingual: (value: string, labelClassName?: string) => React.ReactNode;
}

export default function HomeTechnicalHistory({
  th,
  modoTecnico,
  renderBilingual,
}: HomeTechnicalHistoryProps) {
  return (
    <section className={styles.luxuryDossierSection}>
      <div className={styles.dossierHeaderLine}>
        <Compass size={13} className={styles.dossierIcon} />
        <div className={styles.luxuryTitleWrapper}>
          <span className={styles.luxuryDossierTitle}>Historial técnico</span>
          {modoTecnico && <span className={styles.subLabelEn}>Technical History</span>}
        </div>
      </div>
      
      <div className={styles.technicalHistoryGrid}>
        <div className={styles.technicalHistoryItem}>
          <span>{renderBilingual("Tonos usados / Tones used")}</span>
          <strong>{renderBilingual(th.tonesUsed)}</strong>
        </div>
        <div className={styles.technicalHistoryItem}>
          <span>{renderBilingual("Servicios recientes / Recent services")}</span>
          <p>{renderBilingual(th.recentServices)}</p>
        </div>
        <div className={styles.technicalHistoryItem}>
          <span>{renderBilingual("Observaciones técnicas / Technical notes")}</span>
          <p className={styles.techObservationsText}>{renderBilingual(th.observations)}</p>
        </div>
        <div className={styles.technicalHistoryItem}>
          <span>{renderBilingual("Preferencias / Preferences")}</span>
          <p>{renderBilingual(th.preferences)}</p>
        </div>
      </div>
    </section>
  );
}
