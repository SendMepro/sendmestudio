import { Brain } from "lucide-react";
import styles from "../../../app/page.module.css";

interface HomeTechParametersProps {
  selectedAppointmentId: string;
  modoTecnico: boolean;
}

export default function HomeTechParameters({
  selectedAppointmentId,
  modoTecnico,
}: HomeTechParametersProps) {
  if (!modoTecnico) return null;

  return (
    <section className={`${styles.luxuryDossierSection} ${styles.techMetricsSection}`}>
      <div className={styles.dossierHeaderLine}>
        <Brain size={13} className={styles.dossierIconTech} />
        <div className={styles.luxuryTitleWrapper}>
          <span className={styles.luxuryDossierTitle}>Parámetros técnicos IA</span>
          <span className={styles.subLabelEn}>AI TECHNICAL PARAMETERS</span>
        </div>
      </div>
      
      <div className={styles.techParamsGrid}>
        <div className={styles.techParamItem}>
          <span>Confidence Score</span>
          <strong>{selectedAppointmentId === 'ana-lopez' ? '0.982' : selectedAppointmentId === 'carla-mendez' ? '0.941' : '0.895'}</strong>
        </div>
        <div className={styles.techParamItem}>
          <span>Temperature</span>
          <strong>0.25</strong>
        </div>
        <div className={styles.techParamItem}>
          <span>Embeddings Distance</span>
          <strong>{selectedAppointmentId === 'ana-lopez' ? '0.124' : selectedAppointmentId === 'carla-mendez' ? '0.158' : '0.187'}</strong>
        </div>
        <div className={styles.techParamItem}>
          <span>Operational Analysis</span>
          <strong>{selectedAppointmentId === 'ana-lopez' ? 'Estable' : selectedAppointmentId === 'carla-mendez' ? 'Atención' : 'Normal'}</strong>
        </div>
      </div>
      
      <div className={styles.techReasoningBox}>
        <span>Reasoning IA / Reasoning Path</span>
        <p>
          {selectedAppointmentId === 'ana-lopez' 
            ? 'Análisis semántico de interacciones previas detecta alta correlación entre recomendación de Olaplex y aceptación en fase pre-lavado (probabilidad de éxito > 92%).'
            : selectedAppointmentId === 'carla-mendez'
            ? 'Detección de patrones de insatisfacción por tiempos de espera prolongados en reservas anteriores. Se sugiere mitigación visual temprana.'
            : 'Cliente recurrente con historial de visitas regular. Algoritmo prioriza sugerencia de mantenimiento basada en intervalo promedio de visitas (24 días).'}
        </p>
      </div>
    </section>
  );
}
