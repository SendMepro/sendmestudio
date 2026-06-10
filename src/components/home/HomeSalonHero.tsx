"use client";

import styles from "../../app/page.module.css";
import { useTenantBranding } from "@/hooks/useTenantBranding";

/**
 * HomeSalonHero — Dynamic salon branding hero section.
 * Shows tenant banner if available, otherwise falls back to SendMe Studio corporate banner.
 */
export default function HomeSalonHero() {
  const { branding } = useTenantBranding();

  const bannerUrl = branding?.bannerUrl || "/img/banner-default.jpg";
  const logoUrl = branding?.logoUrl || "/img/logo-white.svg";
  const businessName = branding?.businessName || "SendMe Studio";
  const tagline = branding?.tagline || "AI Business Workspace";

  return (
    <section
      className={styles.salonHero}
      style={{
        backgroundImage: `url(${bannerUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className={styles.salonHeroOverlay}>
        <img
          alt={businessName}
          className={styles.salonLogo}
          src={logoUrl}
        />
        <div>
          <div className={styles.heroEyebrow}>{businessName}</div>
          <p>{tagline}</p>
        </div>
      </div>
    </section>
  );
}
