import { AlertTriangle } from "lucide-react";
import styles from "../../../app/page.module.css";

interface HomeAIAlertsProps {
  alerts: string[];
  modoTecnico: boolean;
  renderBilingual: (value: string, labelClassName?: string) => React.ReactNode;
}

export default function HomeAIAlerts({
  alerts,
  modoTecnico,
  renderBilingual,
}: HomeAIAlertsProps) {
  return (
    <section className={styles.luxuryDossierSection}>
      <div className={styles.dossierHeaderLine}>
        <AlertTriangle size={13} className={styles.dossierIconAlert} />
        <div className={styles.luxuryTitleWrapper}>
          <span className={styles.luxuryDossierTitle}>La IA detecta</span>
          {modoTecnico && <span className={styles.subLabelEn}>AI detects</span>}
        </div>
      </div>
      <ul className={styles.aiAlertsList}>
        {alerts.map((alert: string, idx: number) => (
          <li key={idx} className={styles.aiAlertItem}>
            <span className={styles.aiAlertBullet} />
            <p>{renderBilingual(alert)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
