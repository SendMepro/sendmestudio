import { Sparkles } from "lucide-react";
import ClientAvatar from "../ClientAvatar";
import styles from "../../../app/page.module.css";

interface HomeDossierHeroCardProps {
  client: string;
  service: string;
  decisionStyle: string;
  clientImageUrl?: string | null;
  clientPhone?: string | null;
}

export default function HomeDossierHeroCard({
  client,
  service,
  decisionStyle,
  clientImageUrl,
  clientPhone,
}: HomeDossierHeroCardProps) {
  return (
    <section className={`${styles.dossierHeroCard} ${styles.noiseBg}`}>
      <div className={styles.dossierHeroBlurBg} />
      <div className={styles.dossierHeroContent}>
        <div className={styles.dossierHeroAvatarWrapper}>
          <ClientAvatar
            className={styles.dossierHeroAvatar}
            name={client}
            imageUrl={clientImageUrl}
            phone={clientPhone}
          />
          <span className={styles.dossierHeroGlowRing} />
        </div>
        <div className={styles.dossierHeroMeta}>
          <div className={styles.dossierHeroKicker}>Concierge Intelligence</div>
          <h2 className={styles.dossierHeroName}>{client}</h2>
          <p className={styles.dossierHeroService}>{service}</p>
          <div className={styles.dossierHeroBadge}>
            <Sparkles size={10} className={styles.dossierHeroBadgeIcon} />
            <span>{decisionStyle.split(" / ")[0]}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
