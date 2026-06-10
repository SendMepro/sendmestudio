import HomeDossierHeroCard from "./dossier/HomeDossierHeroCard";
import HomeEmotionalProfile from "./dossier/HomeEmotionalProfile";
import HomeMaterialIntelligence from "./dossier/HomeMaterialIntelligence";
import HomeCustomerLTV from "./dossier/HomeCustomerLTV";
import HomeArrivalBehavior from "./dossier/HomeArrivalBehavior";
import HomeAIAlerts from "./dossier/HomeAIAlerts";
import HomeAIRecommendation from "./dossier/HomeAIRecommendation";
import HomeTechnicalHistory from "./dossier/HomeTechnicalHistory";
import HomeTechParameters from "./dossier/HomeTechParameters";
import styles from "../../app/page.module.css";

interface AppointmentInfo {
  id: string;
  client: string;
  service: string;
  clientImageUrl?: string | null;
  clientPhone?: string | null;
}

interface EmotionalProfile {
  decisionStyle: string;
  responseStyle: string;
  idealTone: string;
  anxietyLevel: string;
  priceSensitivity: string;
  visualValidation: string;
}

interface MaterialIntelligence {
  avgCost: string;
  brands: string[];
  colorations: string;
  sessionTime: string;
  margin: string;
}

interface LifetimeValue {
  ltv: string;
  avgTicket: string;
  annualVisits: string;
  repurchase: string;
}

interface TechnicalHistory {
  tonesUsed: string;
  recentServices: string;
  observations: string;
  preferences: string;
}

interface ArrivalRecord {
  arrivedAt: string;
  deltaMinutes: number;
}

interface HomeDossierProps {
  selectedAppointment: AppointmentInfo;
  ep: EmotionalProfile;
  mi: MaterialIntelligence;
  clv: LifetimeValue;
  alerts: string[];
  recs: string[];
  th: TechnicalHistory;
  selectedArrivalLabel: string;
  selectedArrivalRecord: ArrivalRecord | undefined;
  modoTecnico: boolean;
  registerArrival: () => void;
  renderBilingual: (value: string, labelClassName?: string) => React.ReactNode;
  chileTimeLabel: (date: Date) => string;
}

export default function HomeDossier({
  selectedAppointment,
  ep,
  mi,
  clv,
  alerts,
  recs,
  th,
  selectedArrivalLabel,
  selectedArrivalRecord,
  modoTecnico,
  registerArrival,
  renderBilingual,
  chileTimeLabel,
}: HomeDossierProps) {
  return (
    <>
      <HomeDossierHeroCard
        client={selectedAppointment.client}
        service={selectedAppointment.service}
        decisionStyle={ep.decisionStyle}
        clientImageUrl={selectedAppointment.clientImageUrl}
        clientPhone={selectedAppointment.clientPhone}
      />

      <div className={styles.dossierListContainer}>
        <HomeEmotionalProfile
          ep={ep}
          modoTecnico={modoTecnico}
          renderBilingual={renderBilingual}
        />

        <HomeMaterialIntelligence
          mi={mi}
          modoTecnico={modoTecnico}
          renderBilingual={renderBilingual}
        />

        <HomeCustomerLTV
          clv={clv}
          modoTecnico={modoTecnico}
          renderBilingual={renderBilingual}
        />

        <HomeArrivalBehavior
          selectedArrivalLabel={selectedArrivalLabel}
          selectedArrivalRecord={selectedArrivalRecord}
          modoTecnico={modoTecnico}
          renderBilingual={renderBilingual}
          onRegisterArrival={registerArrival}
          chileTimeLabel={chileTimeLabel}
        />

        <HomeAIAlerts
          alerts={alerts}
          modoTecnico={modoTecnico}
          renderBilingual={renderBilingual}
        />

        <HomeAIRecommendation
          recs={recs}
          modoTecnico={modoTecnico}
          renderBilingual={renderBilingual}
        />

        <HomeTechnicalHistory
          th={th}
          modoTecnico={modoTecnico}
          renderBilingual={renderBilingual}
        />

        <HomeTechParameters
          selectedAppointmentId={selectedAppointment.id}
          modoTecnico={modoTecnico}
        />
      </div>
    </>
  );
}
