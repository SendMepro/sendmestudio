"use client";

import { X } from "lucide-react";
import type { BookingService, BookingSlot, BookingStylist } from "../../hooks/inbox/useBooking";
import styles from "../../app/inbox/inbox.module.css";

export type { BookingService, BookingSlot, BookingStylist };

export type BookingDrawerProps = {
  isOpen: boolean;
  isClosing: boolean;
  isConfirming: boolean;
  detectedService: BookingService | undefined;
  activeChatName: string;
  bookingSlots: BookingSlot[];
  bookingStylists: BookingStylist[];
  selectedSlot: BookingSlot | undefined;
  selectedStylist: BookingStylist | undefined;
  onSelectSlot: (slotId: string, stylistId: string) => void;
  onSelectStylist: (stylistId: string) => void;
  onConfirm: () => void;
  onClose: () => void;
};

export default function BookingDrawer({
  isOpen,
  isClosing,
  isConfirming,
  detectedService,
  activeChatName,
  bookingSlots,
  bookingStylists,
  selectedSlot,
  selectedStylist,
  onSelectSlot,
  onSelectStylist,
  onConfirm,
  onClose,
}: BookingDrawerProps) {
  if (!isOpen) return null;

  return (
    <div
      className={styles.bookingDrawer}
      aria-label="Drawer inteligente de reservas"
      data-closing={isClosing ? "true" : "false"}
    >
      <div className={styles.bookingDrawerHeader}>
        <div>
          <span>Reserva inteligente</span>
          <strong>{detectedService?.label ?? "Servicio"}</strong>
        </div>
        <button
          aria-label="Cerrar drawer de reserva"
          className={styles.bookingClose}
          onClick={onClose}
          type="button"
        >
          <X size={12} strokeWidth={1.8} />
        </button>
      </div>

      <div className={styles.bookingMeta}>
        <span>{detectedService?.durationMinutes ?? 60} min</span>
        <span>{activeChatName}</span>
      </div>

      <div className={styles.bookingLeftCol}>
        <div className={styles.bookingSection}>
          <span>Estilista</span>
          <div className={styles.bookingChipGrid}>
            {bookingStylists.map((stylist) => (
              <button
                className={styles.bookingChip}
                data-selected={selectedStylist?.id === stylist.id ? "true" : "false"}
                key={stylist.id}
                onClick={() => onSelectStylist(stylist.id)}
                type="button"
              >
                {stylist.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.bookingRightCol}>
        <div className={styles.bookingSection}>
          <span>Horarios</span>
          <div className={styles.bookingChipGrid}>
            {bookingSlots.map((slot) => (
              <button
                className={styles.bookingChip}
                data-selected={selectedSlot?.id === slot.id ? "true" : "false"}
                key={slot.id}
                onClick={() => onSelectSlot(slot.id, slot.stylistId)}
                type="button"
              >
                {slot.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        className={styles.bookingConfirm}
        disabled={
          isConfirming ||
          !detectedService ||
          !selectedSlot ||
          !selectedStylist
        }
        onClick={onConfirm}
        type="button"
      >
        Confirmar reserva
      </button>
    </div>
  );
}
