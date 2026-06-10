"use client";

import { useState, useCallback } from "react";
import { Info } from "lucide-react";
import styles from "./SectionInfoButton.module.css";

export type SectionInfo = {
  title: string;
  tooltip: string;
  description: string;
  usesData: string[];
  helpsWith: string[];
};

type Props = {
  info: SectionInfo;
};

export default function SectionInfoButton({ info }: Props) {
  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        className={styles.trigger}
        onClick={handleOpen}
        title={info.tooltip}
        aria-label={info.tooltip}
        type="button"
      >
        <Info size={14} strokeWidth={1.5} />
      </button>

      {open && (
        <div className={styles.overlay} onClick={handleClose}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{info.title}</h3>
              <button
                className={styles.modalClose}
                onClick={handleClose}
                aria-label="Cerrar"
                type="button"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <p className={styles.modalDesc}>{info.description}</p>

            <div className={styles.modalBlock}>
              <div className={styles.modalBlockTitle}>Datos que utiliza</div>
              <ul className={styles.modalList}>
                {info.usesData.map((d) => (
                  <li key={d} className={styles.modalListItem}>{d}</li>
                ))}
              </ul>
            </div>

            <div className={styles.modalBlock}>
              <div className={styles.modalBlockTitle}>Te ayuda a decidir</div>
              <ul className={styles.modalList}>
                {info.helpsWith.map((h) => (
                  <li key={h} className={styles.modalListItem}>{h}</li>
                ))}
              </ul>
            </div>

            <button
              className={styles.modalBtn}
              onClick={handleClose}
              type="button"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
