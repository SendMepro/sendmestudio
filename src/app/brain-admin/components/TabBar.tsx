"use client";

import { Brain, FolderOpen, Heart, Target, Users } from "lucide-react";
import styles from "../brain-admin.module.css";

export type TabId = "aprender" | "trabajos" | "talento" | "satisfaccion" | "campanas";

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "aprender", label: "Aprender", icon: <Brain size={16} strokeWidth={1.7} /> },
  { id: "trabajos", label: "Trabajos realizados", icon: <FolderOpen size={16} strokeWidth={1.7} /> },
  { id: "talento", label: "Talento del equipo", icon: <Users size={16} strokeWidth={1.7} /> },
  { id: "satisfaccion", label: "Satisfacción social", icon: <Heart size={16} strokeWidth={1.7} /> },
  { id: "campanas", label: "Oportunidades de campaña", icon: <Target size={16} strokeWidth={1.7} /> },
];

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <nav className={styles.ccTabBar} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={styles.ccTabButton}
          data-active={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
        >
          <span className={styles.ccTabIcon}>{tab.icon}</span>
          <span className={styles.ccTabLabel}>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
