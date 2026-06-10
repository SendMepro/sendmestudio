"use client";

import { Clock, MessageSquare, Search, Smartphone, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import type { Conversation } from "../../hooks/inbox/useInboxThreads";
import ThreadItem from "./ThreadItem";
import styles from "../../app/inbox/inbox.module.css";
import { useTenantBranding } from "@/hooks/useTenantBranding";

export type { Conversation };

export type ConversationsPanelProps = {
  threads: Conversation[];
  activeId: number | string;
  animatedThreadIds: string[];
  onSelectConversation: (id: Conversation["id"], conversation: Conversation) => void;
  onCopyPhone: (formattedPhone: string) => void;
  setThreadItemRef: (threadId: string) => (node: HTMLDivElement | null) => void;
  formatPhone: (phone: string) => string;
  iaResponsesToday?: number;
};

export default function ConversationsPanel({
  threads,
  activeId,
  animatedThreadIds,
  onSelectConversation,
  onCopyPhone,
  setThreadItemRef,
  formatPhone,
  iaResponsesToday,
}: ConversationsPanelProps) {
  const { branding } = useTenantBranding();
  const logoUrl = branding?.logoUrl || "/img/logo_banner.png";
  const businessName = branding?.businessName || "SendMe Studio";
  return (
    <aside className={styles.conversationsPanel}>
      <div className={styles.heroWrap}>
        <img
          src="/img/bg_salon.webp"
          alt=""
          className={styles.inboxHeroImage}
        />
        <div className={styles.bannerGlassFooter}>
          <span className={styles.bannerGlassFooterItem}>
            <Users size={12} />
            {threads.length} activos
          </span>
          <span className={styles.bannerGlassFooterItem}>
            <Clock size={12} />
            {(() => {
              const now = new Date();
              return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
            })()} · Santiago
          </span>
          {iaResponsesToday !== undefined && (
            <span className={styles.inlineKpi}>
              <Sparkles size={10} />
              {iaResponsesToday} IA hoy
            </span>
          )}
        </div>
      </div>
      <header className={styles.panelHeader}>
        <div className={styles.headerMainRow}>
          <img
            src={logoUrl}
            alt={businessName}
            className={styles.panelLogo}
          />
        </div>

        <label className={styles.searchShell}>
          <Search size={14} />
          <input
            aria-label="Buscar conversación"
            className={styles.searchInput}
            placeholder="Buscar conversación..."
          />
        </label>
      </header>

      <div className={styles.conversationList}>
        {threads.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            padding: "40px 24px", textAlign: "center", gap: 12,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: "rgba(124,92,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <MessageSquare size={22} color="#7c5cff" />
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
              Bandeja de entrada
            </h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
              Cuando un cliente te escriba por WhatsApp, las conversaciones aparecerán aquí.
            </p>
            <Link href="/business/settings?tab=whatsapp" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              marginTop: 8, padding: "8px 16px", borderRadius: 8,
              background: "#7c5cff", color: "#fff",
              fontSize: 13, fontWeight: 600, textDecoration: "none",
            }}>
              <Smartphone size={14} />
              Configurar WhatsApp
            </Link>
          </div>
        ) : (
          threads.map((conversation) => {
            const isActive = activeId === conversation.id;
            const threadId = String(conversation.id);

            return (
              <ThreadItem
                key={threadId}
                conversation={conversation}
                isActive={isActive}
                isAnimated={animatedThreadIds.includes(threadId)}
                onSelect={(id) => onSelectConversation(id, conversation)}
                onCopyPhone={onCopyPhone}
                setRef={setThreadItemRef}
                formatPhone={formatPhone}
              />
            );
          })
        )}
      </div>
    </aside>
  );
}
