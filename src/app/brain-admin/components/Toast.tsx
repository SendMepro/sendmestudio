"use client";

import styles from "../brain-admin.module.css";

interface ToastProps {
  message: string;
  visible: boolean;
}

export function Toast({ message, visible }: ToastProps) {
  if (!visible) return null;

  return (
    <div className={styles.toast}>
      <span>{message}</span>
    </div>
  );
}
