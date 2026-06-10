"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ── Types ────────────────────────────────────────────────────────

export type BookingService = {
  id: string;
  label: string;
  durationMinutes: number;
  keywords: string[];
};

export type BookingStylist = {
  id: string;
  name: string;
  services: string[];
};

export type BookingSlot = {
  id: string;
  label: string;
  date: string;
  time: string;
  stylistId: string;
  serviceIds: string[];
};

export type BookingAvailability = {
  stylists: BookingStylist[];
  services: BookingService[];
  slots: BookingSlot[];
};

export type AppointmentResponse = {
  success: boolean;
  appointment: {
    id: string;
    service: string;
    stylist: string;
    date: string;
    time: string;
  };
};

export type BookingOptions = {
  /** Conversation ID for the booking context */
  conversationId: string | number;
  /** Customer name */
  customerName: string;
  /** Customer phone */
  customerPhone: string;
  /** Called to append a confirmation message optimistically */
  appendMessage?: (msg: {
    id: string | number;
    type: "client" | "studio";
    text: string;
    status?: string;
  }) => void;
  /** Called to send the WhatsApp confirmation message */
  sendWhatsAppMessage?: (
    conversationId: string | number,
    text: string,
    optimisticId: string | number
  ) => Promise<any>;
  /** Called to update an optimistic message's status */
  updateOptimisticMessage?: (
    id: string | number,
    updates: { status?: string; waMessageId?: string }
  ) => void;
  /** Called to mark an optimistic message as failed */
  updateOptimisticStatus?: (id: string | number, status: string, metaError?: any) => void;
  /** Ref to generate unique local message IDs */
  localMessageIdRef?: React.MutableRefObject<number>;
  /** Called to show a toast notification */
  setCopyToast?: (msg: string) => void;
  /** Ref for copy toast timer */
  copyToastTimerRef?: React.MutableRefObject<number | null>;
  /** Called to set just-sent IDs for shine animation */
  setJustSentIds?: React.Dispatch<React.SetStateAction<Set<string>>>;
  /** Called when the booking drawer should close */
  closeBookingDrawer?: (options?: { clearDraft?: boolean; restoreFocus?: boolean }) => void;
};

// ── Hook ─────────────────────────────────────────────────────────

export function useBooking(options: BookingOptions) {
  const {
    conversationId,
    customerName,
    customerPhone,
    appendMessage,
    sendWhatsAppMessage,
    updateOptimisticMessage,
    updateOptimisticStatus,
    localMessageIdRef,
    setCopyToast,
    copyToastTimerRef,
    setJustSentIds,
    closeBookingDrawer,
  } = options;

  const [isBookingDrawerOpen, setIsBookingDrawerOpen] = useState(false);
  const [isBookingDrawerClosing, setIsBookingDrawerClosing] = useState(false);
  const [bookingAvailability, setBookingAvailability] = useState<BookingAvailability | null>(null);
  const [selectedBookingSlotId, setSelectedBookingSlotId] = useState("");
  const [selectedBookingStylistId, setSelectedBookingStylistId] = useState("");
  const [isConfirmingBooking, setIsConfirmingBooking] = useState(false);
  const bookingCloseTimerRef = useRef<number | null>(null);

  // ── Fetch availability on mount ──────────────────────────
  useEffect(() => {
    let isCancelled = false;

    const loadAvailability = async () => {
      try {
        const response = await fetch("/api/booking/availability");

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as BookingAvailability;

        if (!isCancelled) {
          setBookingAvailability(data);
          setSelectedBookingSlotId(data.slots[0]?.id ?? "");
          setSelectedBookingStylistId(data.stylists[0]?.id ?? "");
        }
      } catch {
        // Booking stays hidden if local availability is unavailable.
      }
    };

    void loadAvailability();

    return () => {
      isCancelled = true;
    };
  }, []);

  // ── Open drawer ─────────────────────────────────────────
  const openBookingDrawer = useCallback((onComposerResize?: (height: number) => void) => {
    if (isBookingDrawerOpen) {
      // If already open, close it (toggle behavior)
      closeBookingDrawerInner();
      return;
    }

    if (bookingCloseTimerRef.current) {
      window.clearTimeout(bookingCloseTimerRef.current);
      bookingCloseTimerRef.current = null;
    }

    setIsBookingDrawerClosing(false);
    setIsBookingDrawerOpen(true);
    onComposerResize?.(390);
  }, [isBookingDrawerOpen]);

  // ── Close drawer (internal, no external deps) ──────────
  const closeBookingDrawerInner = useCallback(
    (options: { clearDraft?: boolean; restoreFocus?: boolean; setDraftText?: (text: string) => void; draftFieldRef?: React.RefObject<HTMLTextAreaElement | null>; onComposerResize?: (height: number) => void } = {}) => {
      if (!isBookingDrawerOpen) {
        return;
      }

      if (bookingCloseTimerRef.current) {
        window.clearTimeout(bookingCloseTimerRef.current);
      }

      setIsBookingDrawerClosing(true);

      // Let the CSS transition play out before unmounting and collapsing composer
      if (bookingCloseTimerRef.current) {
        window.clearTimeout(bookingCloseTimerRef.current);
      }

      bookingCloseTimerRef.current = window.setTimeout(() => {
        setIsBookingDrawerOpen(false);
        setIsBookingDrawerClosing(false);
        bookingCloseTimerRef.current = null;

        if (options.clearDraft) {
          options.setDraftText?.("");
        }

        options.onComposerResize?.(180);

        if (options.restoreFocus) {
          window.requestAnimationFrame(() => {
            options.draftFieldRef?.current?.focus();
          });
        }
      }, 300);
    },
    [isBookingDrawerOpen]
  );

  // ── Confirm booking ────────────────────────────────────
  const confirmBooking = useCallback(
    async (
      detectedBookingService: BookingService | undefined,
      selectedBookingSlot: BookingSlot | undefined,
      selectedBookingStylist: BookingStylist | undefined,
      helpers: {
        activeId: string | number;
        activeChat: { name: string; phone: string };
        setDraftText: (text: string) => void;
        draftFieldRef: React.RefObject<HTMLTextAreaElement | null>;
        onComposerResize: (height: number) => void;
        closePicker?: () => void;
      }
    ) => {
      if (!detectedBookingService || !selectedBookingSlot || !selectedBookingStylist) {
        return;
      }

      setIsConfirmingBooking(true);

      try {
        const response = await fetch("/api/appointments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            conversationId: String(conversationId),
            customerName,
            customerPhone,
            service: detectedBookingService.label,
            serviceId: detectedBookingService.id,
            durationMinutes: detectedBookingService.durationMinutes,
            stylist: selectedBookingStylist.name,
            stylistId: selectedBookingStylist.id,
            date: selectedBookingSlot.date,
            time: selectedBookingSlot.time,
            slotId: selectedBookingSlot.id,
          }),
        });

        if (!response.ok) {
          throw new Error("Booking confirmation failed.");
        }

        const data = (await response.json()) as AppointmentResponse;
        const confirmationText = `Perfecto, dejamos tu reserva confirmada para ${selectedBookingSlot.label} con ${selectedBookingStylist.name} para ${detectedBookingService.label}. Te esperamos en SendMe Studio.`;
        const optimisticId = `booking-${(localMessageIdRef?.current ?? 0)}`;

        if (localMessageIdRef) {
          localMessageIdRef.current += 1;
        }

        appendMessage?.({
          id: optimisticId,
          type: "studio",
          text: confirmationText,
          status: "sending",
        });

        // Trigger shine animation on the booking confirmation bubble
        setJustSentIds?.((prev) => new Set(prev).add(optimisticId));
        const bookingShineTimerId = window.setTimeout(() => {
          setJustSentIds?.((prev) => {
            const next = new Set(prev);
            next.delete(optimisticId);
            return next;
          });
        }, 1200);

        void sendWhatsAppMessage?.(helpers.activeId, confirmationText, optimisticId)
          .then((sendData: any) => {
            updateOptimisticMessage?.(optimisticId, {
              status: "sent",
              waMessageId: sendData.message?.waMessageId ?? sendData.messageId,
            });
          })
          .catch((error: any) => {
            const metaError =
              error && typeof error === "object" && "metaError" in error
                ? error.metaError
                : undefined;

            updateOptimisticStatus?.(optimisticId, "failed", metaError);
          });

        setCopyToast?.(`Booking confirmado · ${data.appointment.time}`);
        if (copyToastTimerRef?.current) {
          window.clearTimeout(copyToastTimerRef.current);
        }
        if (copyToastTimerRef) {
          copyToastTimerRef.current = window.setTimeout(() => {
            setCopyToast?.("");
          }, 1800);
        }

        closeBookingDrawerInner({
          clearDraft: true,
          restoreFocus: true,
          setDraftText: helpers.setDraftText,
          draftFieldRef: helpers.draftFieldRef,
          onComposerResize: helpers.onComposerResize,
        });
      } catch (error) {
        console.warn("Booking confirmation failed", {
          error: error instanceof Error ? error.message : "Unknown booking error",
        });
        setCopyToast?.("No se pudo confirmar la reserva");
      } finally {
        setIsConfirmingBooking(false);
      }
    },
    [
      conversationId,
      customerName,
      customerPhone,
      appendMessage,
      sendWhatsAppMessage,
      updateOptimisticMessage,
      updateOptimisticStatus,
      localMessageIdRef,
      setCopyToast,
      copyToastTimerRef,
      setJustSentIds,
      closeBookingDrawerInner,
    ]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (bookingCloseTimerRef.current) {
        window.clearTimeout(bookingCloseTimerRef.current);
      }
    };
  }, []);

  return {
    /** State: booking drawer visibility */
    isBookingDrawerOpen,
    /** State: booking drawer closing animation */
    isBookingDrawerClosing,
    /** State: full availability data from the API */
    bookingAvailability,
    /** State: selected slot ID */
    selectedBookingSlotId,
    /** State: selected stylist ID */
    selectedBookingStylistId,
    /** State: is booking being confirmed */
    isConfirmingBooking,
    /** Set selected slot ID */
    setSelectedBookingSlotId,
    /** Set selected stylist ID */
    setSelectedBookingStylistId,
    /** Open booking drawer */
    openBookingDrawer,
    /** Close booking drawer */
    closeBookingDrawer: closeBookingDrawerInner,
    /** Confirm booking — sends API request + optimistic message */
    confirmBooking,
    /** Ref for booking close timer */
    bookingCloseTimerRef,
  };
}
