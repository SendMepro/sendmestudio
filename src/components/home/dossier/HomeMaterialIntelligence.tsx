import { ShoppingBag } from "lucide-react";
import styles from "../../../app/page.module.css";

interface MaterialIntelligence {
  avgCost: string;
  brands: string[];
  colorations: string;
  sessionTime: string;
  margin: string;
}

interface HomeMaterialIntelligenceProps {
  mi: MaterialIntelligence;
  modoTecnico: boolean;
  renderBilingual: (value: string, labelClassName?: string) => React.ReactNode;
}

export default function HomeMaterialIntelligence({
  mi,
  modoTecnico,
  renderBilingual,
}: HomeMaterialIntelligenceProps) {
  return (
    <section className={styles.luxuryDossierSection}>
      <div className={styles.dossierHeaderLine}>
        <ShoppingBag size={13} className={styles.dossierIcon} />
        <div className={styles.luxuryTitleWrapper}>
          <span className={styles.luxuryDossierTitle}>Inteligencia de materiales</span>
          {modoTecnico && <span className={styles.subLabelEn}>Material Intelligence</span>}
        </div>
      </div>
      
      <div className={styles.materialMetricsGrid}>
        <div className={styles.materialMetricCard}>
          {renderBilingual("Gasto promedio / Avg Cost")}
          <strong>{renderBilingual(mi.avgCost)}</strong>
        </div>
        <div className={styles.materialMetricCard}>
          {renderBilingual("Margen / Oper. Margin")}
          <strong className={styles.goldenHighlight}>{renderBilingual(mi.margin)}</strong>
        </div>
      </div>

      <div className={styles.materialTextDetail}>
        <div className={styles.materialDetailRow}>
          <span className={styles.materialRowLabel}>{renderBilingual("Marcas / Brands:")}</span>
          <div className={styles.brandsChips}>
            {mi.brands.map((brand: string) => (
              <span key={brand} className={styles.brandChip}>{brand}</span>
            ))}
          </div>
        </div>
        <div className={styles.materialDetailRow}>
          <span className={styles.materialRowLabel}>{renderBilingual("Coloración / Colorations:")}</span>
          <strong className={styles.materialRowValue}>{renderBilingual(mi.colorations)}</strong>
        </div>
        <div className={styles.materialDetailRow}>
          <span className={styles.materialRowLabel}>{renderBilingual("Tiempo promedio / Session Time:")}</span>
          <strong className={styles.materialRowValue}>{renderBilingual(mi.sessionTime)}</strong>
        </div>
      </div>
    </section>
  );
}
