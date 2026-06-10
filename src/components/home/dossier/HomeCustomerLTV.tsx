import { Activity } from "lucide-react";
import styles from "../../../app/page.module.css";

interface LifetimeValue {
  ltv: string;
  avgTicket: string;
  annualVisits: string;
  repurchase: string;
}

interface HomeCustomerLTVProps {
  clv: LifetimeValue;
  modoTecnico: boolean;
  renderBilingual: (value: string, labelClassName?: string) => React.ReactNode;
}

export default function HomeCustomerLTV({
  clv,
  modoTecnico,
  renderBilingual,
}: HomeCustomerLTVProps) {
  return (
    <section className={styles.luxuryDossierSection}>
      <div className={styles.dossierHeaderLine}>
        <Activity size={13} className={styles.dossierIcon} />
        <div className={styles.luxuryTitleWrapper}>
          <span className={styles.luxuryDossierTitle}>Valor de vida del cliente</span>
          {modoTecnico && <span className={styles.subLabelEn}>Customer Lifetime Value</span>}
        </div>
      </div>

      <div className={styles.clvMetricsGrid}>
        <div className={styles.clvMetricCard}>
          <span>LTV Total</span>
          <strong className={styles.clvPrimaryValue}>{renderBilingual(clv.ltv)}</strong>
        </div>
        <div className={styles.clvMetricCard}>
          {renderBilingual("Ticket Promedio / Avg Ticket")}
          <strong>{renderBilingual(clv.avgTicket)}</strong>
        </div>
      </div>

      <div className={styles.clvBars}>
        <div className={styles.clvBarItem}>
          <div className={styles.clvBarMeta}>
            {renderBilingual("Visitas anuales / Annual Visits")}
            <strong>{renderBilingual(clv.annualVisits)}</strong>
          </div>
          <div className={styles.luxuryProgressTrack}>
            <span 
              className={styles.luxuryProgressBarGold} 
              style={{ width: `${Math.min(100, (parseInt(clv.annualVisits) || 0) * 5)}%` }} 
            />
          </div>
        </div>
        <div className={styles.clvBarItem}>
          <div className={styles.clvBarMeta}>
            {renderBilingual("Recompra / Repurchase")}
            <strong>{renderBilingual(clv.repurchase)}</strong>
          </div>
          <div className={styles.luxuryProgressTrack}>
            <span 
              className={styles.luxuryProgressBarPurple} 
              style={{ width: clv.repurchase }} 
            />
          </div>
        </div>
      </div>
    </section>
  );
}
