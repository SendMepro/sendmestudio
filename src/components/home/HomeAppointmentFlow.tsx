import { Clock3, Sparkles, CalendarDays } from "lucide-react";
import ClientAvatar from "./ClientAvatar";
import styles from "../../app/page.module.css";

interface FlowAppointment {
  id: string;
  time: string;
  client: string;
  service: string;
  status: string;
  tone: string;
  stylist?: string;
  stylistImage?: string;
  stage: string;
  isMock: boolean;
  clientImageUrl?: string | null;
  clientPhone?: string | null;
}

interface HomeAppointmentFlowProps {
  appointments: FlowAppointment[];
  selectedAppointmentId: string;
  isLoadingAppointments: boolean;
  onSelectAppointment: (id: string, item: FlowAppointment) => void;
  getStageIcon: (stage: string) => React.ReactNode;
}

export default function HomeAppointmentFlow({
  appointments,
  selectedAppointmentId,
  isLoadingAppointments,
  onSelectAppointment,
  getStageIcon,
}: HomeAppointmentFlowProps) {
  if (isLoadingAppointments) {
    return (
      <section className={styles.flowColumn}>
        <div className={styles.flowScroll}>
          <div className={styles.flowList}>
            <div className={`${styles.flowCard} ${styles.flowCardSkeleton}`}>
              <div className={styles.skeletonAvatar} />
              <div className={styles.flowContent}>
                <div className={styles.skeletonLine} style={{ width: '60%' }} />
                <div className={styles.skeletonLine} style={{ width: '85%' }} />
                <div className={styles.skeletonLine} style={{ width: '45%' }} />
              </div>
            </div>
            <div className={`${styles.flowCard} ${styles.flowCardSkeleton}`}>
              <div className={styles.skeletonAvatar} />
              <div className={styles.flowContent}>
                <div className={styles.skeletonLine} style={{ width: '55%' }} />
                <div className={styles.skeletonLine} style={{ width: '75%' }} />
                <div className={styles.skeletonLine} style={{ width: '50%' }} />
              </div>
            </div>
            <div className={`${styles.flowCard} ${styles.flowCardSkeleton}`}>
              <div className={styles.skeletonAvatar} />
              <div className={styles.flowContent}>
                <div className={styles.skeletonLine} style={{ width: '65%' }} />
                <div className={styles.skeletonLine} style={{ width: '80%' }} />
                <div className={styles.skeletonLine} style={{ width: '40%' }} />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (appointments.length === 0) {
    return (
      <section className={styles.flowColumn}>
        <div className={styles.flowScroll}>
          <div className={styles.flowList}>
            <div className={styles.flowCardEmpty}>
              <div className={styles.flowCardEmptyInner}>
                <CalendarDays size={20} strokeWidth={1.2} className={styles.flowEmptyIcon} />
                <div className={styles.flowEmptyTitle}>Sin citas hoy</div>
                <div className={styles.flowEmptyDesc}>
                  No hay reservas para hoy. Las citas aparecerán aquí cuando clientes agenden.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.flowColumn}>
      <div className={styles.flowScroll}>
        <div className={styles.flowList}>
          {appointments.map((item, index) => (
            <article
              key={item.id}
              className={styles.flowCard}
              data-tone={item.tone}
              data-mock={item.isMock ? "true" : "false"}
              data-last={index === appointments.length - 1 ? "true" : "false"}
              data-selected={selectedAppointmentId === item.id ? "true" : "false"}
              role="button"
              tabIndex={0}
              onClick={() => onSelectAppointment(item.id, item)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectAppointment(item.id, item);
                }
              }}
            >
              <ClientAvatar className={styles.flowAvatar} name={item.client} imageUrl={item.clientImageUrl} phone={item.clientPhone} />

              <div className={styles.flowContent}>
                <div className={styles.flowName}>{item.client}</div>
                <div className={styles.flowMetaLine}>
                  <span className={styles.flowTime}>
                    <Clock3 className={styles.flowTimeIcon} size={9} strokeWidth={1.6} />
                    <span>{item.time}</span>
                    <span className={styles.flowStageIconInline} data-tone={item.tone}>
                      {getStageIcon(item.stage)}
                      <span className={styles.tooltipText}>{item.stage}</span>
                    </span>
                  </span>
                  <span>·</span>
                  <span className={styles.flowServiceText}>
                    <Sparkles className={styles.flowServiceIcon} size={11} strokeWidth={1.8} />
                    <span>{item.service}</span>
                  </span>
                </div>
                <div className={styles.flowMeta}>
                  <img
                    alt={item.stylist}
                    className={styles.stylistAvatar}
                    src={item.stylistImage}
                  />
                  <div className={styles.flowStylistInfo}>
                    <span>{item.stylist}</span>
                    <span className={styles.flowStylistLabel}>Estilista</span>
                  </div>
                </div>

                <div className={styles.flowPills}>
                  {item.isMock && <span className={styles.flowBadgeMock}>Demo</span>}
                  {!item.isMock && <span className={styles.flowBadgeLive}>Live</span>}
                  <span className={styles.flowStatus} data-tone={item.tone}>
                    {item.status}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
