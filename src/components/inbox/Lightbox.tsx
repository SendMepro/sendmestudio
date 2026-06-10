"use client";

import type { StagedMedia } from "../../app/inbox/page";
import styles from "../../app/inbox/inbox.module.css";

export type LightboxProps = {
  images: StagedMedia[];
  onClose: () => void;
};

export default function Lightbox({ images, onClose }: LightboxProps) {
  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div
      className={styles.lightbox}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className={styles.lightboxGallery}>
        {images.map((media) => (
          <img key={media.id} alt={media.name} src={media.previewUrl} />
        ))}
      </div>
    </div>
  );
}
