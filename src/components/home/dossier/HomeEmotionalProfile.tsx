import { Heart } from "lucide-react";
import styles from "../../../app/page.module.css";

interface EmotionalProfile {
  decisionStyle: string;
  responseStyle: string;
  idealTone: string;
  anxietyLevel: string;
  priceSensitivity: string;
  visualValidation: string;
}

interface HomeEmotionalProfileProps {
  ep: EmotionalProfile;
  modoTecnico: boolean;
  renderBilingual: (value: string, labelClassName?: string) => React.ReactNode;
}

export default function HomeEmotionalProfile({
  ep,
  modoTecnico,
  renderBilingual,
}: HomeEmotionalProfileProps) {
  return (
    <section className={styles.luxuryDossierSection}>
      <div className={styles.dossierHeaderLine}>
        <Heart size={13} className={styles.dossierIcon} />
        <div className={styles.luxuryTitleWrapper}>
          <span className={styles.luxuryDossierTitle}>Perfil emocional</span>
          {modoTecnico && <span className={styles.subLabelEn}>Emotional Profile</span>}
        </div>
      </div>
      
      <div className={styles.emotionalDetailGrid}>
        <div className={styles.emotionalDetailItem}>
          <span className={styles.emotionalDetailLabel}>{renderBilingual("Decisión / Decision")}</span>
          <p className={styles.emotionalDetailValue}>{renderBilingual(ep.decisionStyle)}</p>
        </div>
        <div className={styles.emotionalDetailItem}>
          <span className={styles.emotionalDetailLabel}>{renderBilingual("Respuesta / Response")}</span>
          <p className={styles.emotionalDetailValue}>{renderBilingual(ep.responseStyle)}</p>
        </div>
        <div className={styles.emotionalDetailItem}>
          <span className={styles.emotionalDetailLabel}>{renderBilingual("Tono ideal / Ideal Tone")}</span>
          <p className={styles.emotionalDetailValue}>{renderBilingual(ep.idealTone)}</p>
        </div>
      </div>

      <div className={styles.emotionalBarGrid}>
        <div className={styles.emotionalBarItem}>
          <div className={styles.emotionalBarMeta}>
            {renderBilingual("Ansiedad / Anxiety")}
            <strong>{renderBilingual(ep.anxietyLevel)}</strong>
          </div>
          <div className={styles.luxuryProgressTrack}>
            <span 
              className={styles.luxuryProgressBar} 
              style={{ width: ep.anxietyLevel.includes("Alta") || ep.anxietyLevel.includes("High") ? "75%" : ep.anxietyLevel.includes("Media") || ep.anxietyLevel.includes("Medium") ? "50%" : "25%" }} 
            />
          </div>
        </div>
        <div className={styles.emotionalBarItem}>
          <div className={styles.emotionalBarMeta}>
            {renderBilingual("Sensibilidad precio / Price Sensitivity")}
            <strong>{renderBilingual(ep.priceSensitivity)}</strong>
          </div>
          <div className={styles.luxuryProgressTrack}>
            <span 
              className={styles.luxuryProgressBar} 
              style={{ width: ep.priceSensitivity.includes("Alta") || ep.priceSensitivity.includes("High") ? "75%" : ep.priceSensitivity.includes("Media") || ep.priceSensitivity.includes("Medium") ? "50%" : "25%" }} 
            />
          </div>
        </div>
        <div className={styles.emotionalBarItem}>
          <div className={styles.emotionalBarMeta}>
            {renderBilingual("Validación visual / Visual Validation")}
            <strong>{renderBilingual(ep.visualValidation)}</strong>
          </div>
          <div className={styles.luxuryProgressTrack}>
            <span 
              className={styles.luxuryProgressBar} 
              style={{ width: ep.visualValidation.includes("Alta") || ep.visualValidation.includes("High") || ep.visualValidation.includes("Crítica") || ep.visualValidation.includes("Critical") ? "90%" : ep.visualValidation.includes("Media") || ep.visualValidation.includes("Medium") ? "55%" : "30%" }} 
            />
          </div>
        </div>
      </div>
    </section>
  );
}
