"use client";

import styles from "../../app/inbox/inbox.module.css";

export type InboxToastProps = {
  copyToast: string;
  modeToast: string;
};

export default function InboxToast({ copyToast, modeToast }: InboxToastProps) {
  return (
    <>
      {copyToast ? <div className={styles.copyToast}>{copyToast}</div> : null}
      <div className={styles.modeToast} data-visible={modeToast ? "true" : "false"}>{modeToast}</div>
    </>
  );
}
