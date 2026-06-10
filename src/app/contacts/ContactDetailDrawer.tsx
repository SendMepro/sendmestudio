"use client";

import { useState } from "react";
import { X, Award, Sparkles, Phone, Calendar, Clock, User, DollarSign, MessageSquare } from "lucide-react";
import AIBadge from "../components/AIBadge";
import { getCustomerAvatar } from "../lib/getCustomerAvatar";
import styles from "./contacts.module.css";

export type CustomerProfile = {
  id: string;
  phone: string;
  displayName?: string;
  firstName: string;
  tags: string[];
  requestedServices: string[];
  lastVisit: string | null;
  campaignEligible: boolean;
  lifecycleStage: string;
  aiSummary?: string;
  notes?: string;
  serviceHistory?: { service: string; date: string; specialist: string; price: string }[];
};

type DrawerTab = "notes" | "history" | "insights";

type Props = {
  customer: CustomerProfile | null;
  onClose: () => void;
};

export default function ContactDetailDrawer({ customer, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<DrawerTab>("notes");

  if (!customer) {
    return null;
  }

  const tier =
    customer.tags.includes("vip") && customer.lifecycleStage !== "imported"
      ? "VIP"
      : customer.lifecycleStage === "new"
        ? "New"
        : "Classic";

  const displayName = customer.firstName || customer.displayName || "Contacto";
  const avatarResult = getCustomerAvatar(customer);

  const tabs: { id: DrawerTab; label: string }[] = [
    { id: "notes", label: "Notas" },
    { id: "history", label: "Historial" },
    { id: "insights", label: "AI Insights" },
  ];

  return (
    <aside className={styles.drawerOverlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button className={styles.drawerClose} onClick={onClose} type="button">
          <X size={16} strokeWidth={1.5} />
        </button>

        {/* Portrait header */}
        <div className={styles.drawerHeader}>
          <div className={styles.drawerAvatar}>
            {avatarResult.type === "image" ? (
              <img src={avatarResult.src} alt={displayName} style={{ width: "64px", height: "64px", borderRadius: "20px", objectFit: "cover" }} />
            ) : (
              <span>{avatarResult.initials}</span>
            )}
            <div
              className={styles.drawerTierDot}
              style={{ background: tier === "VIP" ? "var(--champagne, #c8a96e)" : "var(--primary, #7c5cff)" }}
            />
          </div>
          <div>
            <div className={styles.drawerKicker}>{tier} PROFILE</div>
            <h2 className={styles.drawerTitle}>{displayName}</h2>
          </div>
        </div>

        {/* Tab bar */}
        <div className={styles.drawerTabs}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.drawerTab} ${activeTab === tab.id ? styles.drawerTabActive : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className={styles.drawerContent}>
          {activeTab === "notes" && (
            <div className={styles.drawerSection}>
              <div className={styles.drawerSectionHeader}>
                <Award size={14} color="var(--primary)" />
                <span>STYLE DOSSIER</span>
              </div>
              <p className={styles.drawerQuote}>
                &ldquo;{customer.notes || "Sin notas registradas para esta clienta."}&rdquo;
              </p>

              <div className={styles.drawerDivider} />

              <div className={styles.drawerDetailsGrid}>
                <div className={styles.drawerDetailRow}>
                  <Phone size={12} color="var(--text-muted)" />
                  <span>Teléfono</span>
                  <strong>{customer.phone}</strong>
                </div>
                <div className={styles.drawerDetailRow}>
                  <Calendar size={12} color="var(--text-muted)" />
                  <span>Última visita</span>
                  <strong>{customer.lastVisit || "Sin visita"}</strong>
                </div>
                <div className={styles.drawerDetailRow}>
                  <User size={12} color="var(--text-muted)" />
                  <span>Segmento</span>
                  <strong>{tier}</strong>
                </div>
                <div className={styles.drawerDetailRow}>
                  <MessageSquare size={12} color="var(--text-muted)" />
                  <span>Estado</span>
                  <strong>{customer.campaignEligible ? "WhatsApp OK" : "Sin consentimiento"}</strong>
                </div>
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className={styles.drawerSection}>
              <div className={styles.drawerSectionHeader}>
                <Clock size={14} color="var(--primary)" />
                <span>EXPERIENCE LOG</span>
              </div>
              {customer.serviceHistory && customer.serviceHistory.length > 0 ? (
                <div className={styles.historyList}>
                  {customer.serviceHistory.map((entry, i) => (
                    <div key={i} className={styles.historyItem}>
                      <div className={styles.historyDot} />
                      <div className={styles.historyBody}>
                        <div className={styles.historyService}>{entry.service}</div>
                        <div className={styles.historyMeta}>
                          {entry.date} · {entry.specialist}
                        </div>
                      </div>
                      <div className={styles.historyPrice}>{entry.price}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.drawerEmpty}>Sin historial de servicios registrado.</p>
              )}
            </div>
          )}

          {activeTab === "insights" && (
            <div className={styles.drawerSection}>
              <div className={styles.drawerInsightCard}>
                <div className={styles.drawerSectionHeader}>
                  <Sparkles size={14} color="var(--primary)" />
                  <span>AI RECOMMENDATION</span>
                  <AIBadge />
                </div>
                <p className={styles.drawerInsightText}>
                  &ldquo;{customer.aiSummary || "Análisis de inteligencia artificial no disponible para esta clienta."}&rdquo;
                </p>
              </div>

              <div className={styles.drawerDivider} />

              <div className={styles.drawerKpiCard}>
                <div className={styles.drawerKpiLabel}>Afinidad</div>
                <div className={styles.drawerKpiTrend}>HIGH</div>
                <div className={styles.drawerKpiValue}>$117.000</div>
                <div className={styles.drawerKpiSub}>Valor de Ciclo (LTV)</div>
              </div>

              <div className={styles.drawerDivider} />

              <div className={styles.drawerSectionHeader}>
                <DollarSign size={14} color="var(--primary)" />
                <span>SERVICIOS FAVORITOS</span>
              </div>
              <div className={styles.drawerTagList}>
                {customer.requestedServices.length > 0
                  ? customer.requestedServices.map((s, i) => (
                      <span key={i} className={styles.drawerTag}>{s}</span>
                    ))
                  : <p className={styles.drawerEmpty}>Sin servicios registrados.</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
