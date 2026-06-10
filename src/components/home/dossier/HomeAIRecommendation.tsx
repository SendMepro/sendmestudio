import { Brain, ChevronRight } from "lucide-react";
import AIBadge from "../../../app/components/AIBadge";
import styles from "../../../app/page.module.css";

interface HomeAIRecommendationProps {
  recs: string[];
  modoTecnico: boolean;
  renderBilingual: (value: string, labelClassName?: string) => React.ReactNode;
}

export default function HomeAIRecommendation({
  recs,
  modoTecnico,
  renderBilingual,
}: HomeAIRecommendationProps) {
  return (
    <section className={`${styles.luxuryDossierAiCard} ${styles.noiseBg}`}>
      <AIBadge className={styles.dossierAiBadge} />
      <div className={styles.dossierHeaderLine}>
        <Brain size={13} className={styles.dossierIcon} />
        <div className={styles.luxuryTitleWrapper}>
          <span className={styles.luxuryDossierTitle}>Recomendación IA</span>
          {modoTecnico && <span className={styles.subLabelEn}>AI Recommendation</span>}
        </div>
      </div>
      <p className={styles.aiRecommendationKicker}>{renderBilingual("La clienta responde mejor cuando / Client responds best when:")}</p>
      <ul className={styles.aiRecommendationsList}>
        {recs.map((rec: string, idx: number) => (
          <li key={idx} className={styles.aiRecommendationItem}>
            <ChevronRight size={12} className={styles.aiRecArrow} />
            <p>{renderBilingual(rec)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
