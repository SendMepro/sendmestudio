"use client";

import { CloudSun } from "lucide-react";
import styles from "../../app/page.module.css";

export interface HomeHeaderProps {
  feedIndex: number;
  headerFeed: { title: string; subtitle: string }[];
  weatherData: { city: string; temperature: string };
  currentFormattedDate: string;
  currentTimeString: string;
}

/**
 * HomeHeader — Header section with rotating feed, weather, and date/time.
 *
 * Phase E-2 extraction from page.tsx lines 1361–1380.
 * Props-only component — all state remains in page.tsx.
 */
export default function HomeHeader({
  feedIndex,
  headerFeed,
  weatherData,
  currentFormattedDate,
  currentTimeString,
}: HomeHeaderProps) {
  return (
    <header className={styles.pageHeader}>
      <div className={styles.headerLeft}>
        <div key={feedIndex} className={styles.headerFeedItem}>
          <h1 className={styles.headerTitle}>{headerFeed[feedIndex].title}</h1>
          <p className={styles.headerSubtitle}>{headerFeed[feedIndex].subtitle}</p>
        </div>
      </div>
      <div className={styles.headerRightInfo}>
        <div className={styles.weatherWidget}>
          <CloudSun size={14} strokeWidth={2} />
          <span>{weatherData.city}, {weatherData.temperature}</span>
        </div>
        <span className={styles.headerDateTimeDivider}>·</span>
        <div className={styles.headerDateTime}>
          <span>{currentFormattedDate}</span>
          <span className={styles.headerDateTimeDivider}>·</span>
          <span>{currentTimeString}</span>
        </div>
      </div>
    </header>
  );
}
