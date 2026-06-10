import { NextResponse } from "next/server";
import {
  normalizeStatusAsMessage,
  normalizeWhatsAppMessage,
  type WhatsAppWebhookStatus,
} from "../normalizer";
import {
  generateBookingConciergeDecision,
  generateConciergeDecision,
  generateTenantAwareReply,
  hasDeepSeekConfig,
  type BookingDecision,
} from "../ai-concierge";
import { getBookingContext } from "../booking-context";
import { findActiveAppointment } from "../booking-context";
import { emitWhatsAppEvent } from "../realtime";
import { sendWhatsAppMessage } from "../sender";
import { saveInboundCustomerAsset } from "../customer-assets";
import { addCustomerAsset, upsertCustomerFromMessage } from "../../customers/store";
import {
  maskPhone,
  recordAnalyticsEvent,
  saveWhatsAppMessage,
  updateWhatsAppMessageStatus,
  type WhatsAppInternalMessage,
} from "../store";
import { BusinessEventBus } from "../../../../agents/system/BusinessEventBus";
import { matchTextToServices, fuzzyIncludes, normalizeSearchText } from "../../../lib/serviceMatcher";
import { processCustomerMessage } from "../../../../agents/customer-memory-agent";
import { loadTenantKnowledge } from "@/lib/tenant-knowledge";
import { validateBusinessHours, autoAssignStylist } from "@/lib/booking-validator";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ── Multi-tenant lookup ──────────────────────────────────────────

/**
 * Resolve tenantId from Meta's phone_number_id via WhatsAppTenantMapping.
 * Logs [WHATSAPP] phoneNumberId, tenantId for observability.
 */
async function resolveTenantByPhoneNumberId(
  phoneNumberId: string,
): Promise<{ tenantId: string | null; error?: string }> {
  try {
    const mapping = await prisma.whatsAppTenantMapping.findUnique({
      where: { phoneNumberId },
      select: { tenantId: true },
    });

    if (!mapping) {
      console.warn("[WHATSAPP] No tenant mapping found for phone_number_id", {
        phoneNumberId,
      });
      return { tenantId: null, error: "NO_MAPPING" };
    }

    console.log("[WHATSAPP]", {
      phoneNumberId,
      tenantId: mapping.tenantId,
      event: "tenant_resolved",
    });

    return { tenantId: mapping.tenantId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    console.error("[WHATSAPP] Failed to resolve tenant", {
      phoneNumberId,
      error: message,
    });
    return { tenantId: null, error: `LOOKUP_FAILED: ${message}` };
  }
}

// ── Customer Memory (fire-and-forget) ────────────────────────────

async function processCustomerMemoryIfNeeded(
  message: WhatsAppInternalMessage,
  tenantId: string,
) {
  // Fire-and-forget: silently extract signals from inbound text messages.
  // Does not block the main auto-reply flow.
  if (message.direction !== "inbound" || !message.content) return;
  try {
    await processCustomerMessage({
      customerPhone: message.phone,
      customerName: message.senderName || "Unknown",
      messageText: message.content,
      source: "whatsapp",
      tenantId,
    });
  } catch (error) {
    console.warn("customer memory processing failed", {
      conversationId: message.conversationId,
      tenantId,
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}

// ── Auto-reply logic ─────────────────────────────────────────────

async function maybeSendAutoReply(message: WhatsAppInternalMessage) {
  // ── 0) Emit message_received business event ──
  BusinessEventBus.emit({
    type: 'message_received',
    timestamp: new Date().toISOString(),
    conversationId: message.conversationId,
    phone: message.phone,
    metadata: { content: message.content?.slice(0, 80), type: message.type, tenantId: message.tenantId },
  });

  // ── 0.5) Fire-and-forget: extract customer memory signals ──
  if (message.tenantId) {
    processCustomerMemoryIfNeeded(message, message.tenantId);
  }

  // ── 1) Booking concierge decision ──
  const bookingDecision = await generateBookingConciergeDecision(message);
  const { bookingSignal, shouldBook } = bookingDecision;

  // ── 2) If booking signal detected and we can reply ──
  if (bookingDecision.canAutoReply && bookingDecision.reply) {
    console.info("booking concierge reply", {
      conversationId: message.conversationId,
      tenantId: message.tenantId,
      stage: bookingSignal.nextStage,
      shouldBook,
      service: bookingSignal.service,
      date: bookingSignal.date,
      time: bookingSignal.time,
    });

    // Emit service/date/time detection events
    if (bookingSignal.service) {
      BusinessEventBus.emit({
        type: 'service_detected',
        timestamp: new Date().toISOString(),
        conversationId: message.conversationId,
        metadata: { service: bookingSignal.service, tenantId: message.tenantId },
      });
    }
    if (bookingSignal.date) {
      BusinessEventBus.emit({
        type: 'date_detected',
        timestamp: new Date().toISOString(),
        conversationId: message.conversationId,
        metadata: { date: bookingSignal.date, tenantId: message.tenantId },
      });
    }
    if (bookingSignal.time) {
      BusinessEventBus.emit({
        type: 'time_detected',
        timestamp: new Date().toISOString(),
        conversationId: message.conversationId,
        metadata: { time: bookingSignal.time, tenantId: message.tenantId },
      });
    }

    // ── Execute booking action ──
    if (shouldBook || bookingSignal.action === "cancel") {
      BusinessEventBus.emit({
        type: 'booking_confirmed',
        timestamp: new Date().toISOString(),
        conversationId: message.conversationId,
        phone: message.phone,
        metadata: {
          service: bookingSignal.service,
          date: bookingSignal.date,
          time: bookingSignal.time,
          action: bookingSignal.action,
          tenantId: message.tenantId,
        },
      });

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

      try {
        // ── CANCEL: soft delete via PATCH ──
        if (bookingSignal.action === "cancel") {
          let appointmentId = bookingSignal.existingAppointmentId;

          // Look up active appointment if we don't have the ID
          if (!appointmentId && message.tenantId) {
            const active = await findActiveAppointment(message.phone, message.tenantId);
            appointmentId = active?.id ?? null;
          }

          if (appointmentId) {
            const cancelResponse = await fetch(
              `${baseUrl}/api/calendar/appointments/${appointmentId}`,
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "cancelled" }),
              },
            );

            if (cancelResponse.ok) {
              console.info("auto-cancel succeeded", {
                appointmentId,
                conversationId: message.conversationId,
                tenantId: message.tenantId,
              });
            } else {
              console.warn("auto-cancel failed", {
                status: cancelResponse.status,
                tenantId: message.tenantId,
              });
            }
          } else {
            console.warn("auto-cancel: no appointment found", {
              phone: message.phone,
              tenantId: message.tenantId,
            });
          }
        }
        // ── RESCHEDULE: PATCH existing appointment ──
        else if (bookingSignal.action === "reschedule" && bookingSignal.date && bookingSignal.time) {
          let appointmentId = bookingSignal.existingAppointmentId;

          if (!appointmentId && message.tenantId) {
            const active = await findActiveAppointment(message.phone, message.tenantId);
            appointmentId = active?.id ?? null;
          }

          if (appointmentId) {
            // Validate business hours before rescheduling
            if (message.tenantId) {
              const hoursValidation = await validateBusinessHours(
                message.tenantId, bookingSignal.date, bookingSignal.time,
              );
              if (!hoursValidation.valid) {
                console.warn("auto-reschedule: invalid hours", {
                  error: hoursValidation.error,
                  tenantId: message.tenantId,
                });
              }
            }

            const rescheduleResponse = await fetch(
              `${baseUrl}/api/calendar/appointments/${appointmentId}`,
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  date: bookingSignal.date,
                  time: bookingSignal.time,
                  status: "confirmed",
                }),
              },
            );

            if (rescheduleResponse.ok) {
              const rescheduleData = await rescheduleResponse.json();
              console.info("auto-reschedule succeeded", {
                appointmentId,
                newDate: bookingSignal.date,
                newTime: bookingSignal.time,
                conversationId: message.conversationId,
                tenantId: message.tenantId,
              });
              BusinessEventBus.emit({
                type: 'appointment_rescheduled',
                timestamp: new Date().toISOString(),
                conversationId: message.conversationId,
                phone: message.phone,
                metadata: {
                  appointmentId,
                  newDate: bookingSignal.date,
                  newTime: bookingSignal.time,
                  tenantId: message.tenantId,
                },
              });
            } else {
              console.warn("auto-reschedule failed", {
                status: rescheduleResponse.status,
                tenantId: message.tenantId,
              });
            }
          } else {
            console.warn("auto-reschedule: no appointment found", {
              phone: message.phone,
              tenantId: message.tenantId,
            });
          }
        }
        // ── NEW BOOKING: POST with validation + auto-assign ──
        else if (bookingSignal.date && bookingSignal.time) {
          // Validate business hours
          if (message.tenantId) {
            const hoursValidation = await validateBusinessHours(
              message.tenantId, bookingSignal.date, bookingSignal.time,
            );
            if (!hoursValidation.valid) {
              console.warn("auto-booking: invalid hours", {
                error: hoursValidation.error,
                tenantId: message.tenantId,
              });
              // Still try to create, API will also validate
            }
          }

          // Auto-assign stylist if none specified
          let stylistId: string | undefined;
          let stylistName: string | undefined;
          if (message.tenantId) {
            const assigned = await autoAssignStylist(
              message.tenantId,
              bookingSignal.service ?? "Servicio",
              bookingSignal.date,
              bookingSignal.time,
              60,
            );
            if (assigned) {
              stylistId = assigned.id;
              stylistName = assigned.name;
            }
          }

          // Use /api/calendar/appointments for conflict detection (unified path)
          const appointmentPayload: Record<string, unknown> = {
            customerName: message.senderName,
            phone: message.phone,
            serviceName: bookingSignal.service ?? "Servicio",
            date: bookingSignal.date ?? "",
            startTime: bookingSignal.time ?? "",
            durationMinutes: 60,
            estimatedValue: 0,
            status: "confirmed",
            source: "ai",
            conversationId: message.conversationId,
          };

          if (stylistId) {
            appointmentPayload.stylistId = stylistId;
            appointmentPayload.stylistName = stylistName;
          }

          const apptResponse = await fetch(`${baseUrl}/api/calendar/appointments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(appointmentPayload),
          });

          if (apptResponse.ok) {
            const apptData = await apptResponse.json();
            const appointment = apptData.appointment ?? apptData;
            console.info("auto-booking created", {
              appointmentId: appointment.id,
              conversationId: message.conversationId,
              tenantId: message.tenantId,
              stylistId,
            });
            BusinessEventBus.emit({
              type: 'appointment_created',
              timestamp: new Date().toISOString(),
              conversationId: message.conversationId,
              phone: message.phone,
              metadata: {
                appointmentId: appointment.id,
                service: bookingSignal.service,
                date: bookingSignal.date,
                time: bookingSignal.time,
                stylistId,
                tenantId: message.tenantId,
              },
            });
            emitWhatsAppEvent({
              type: "appointment_scheduled",
              conversationId: message.conversationId,
              appointment,
            });
          } else {
            const errorBody = await apptResponse.text().catch(() => "");
            console.warn("auto-booking failed", {
              status: apptResponse.status,
              body: errorBody,
              tenantId: message.tenantId,
            });
          }
        }
      } catch (error) {
        console.warn("auto-booking action error", {
          action: bookingSignal.action,
          error: error instanceof Error ? error.message : "unknown",
          tenantId: message.tenantId,
        });
      }
    }

    // Send the booking reply
    const result = await sendWhatsAppMessage(message.phone, bookingDecision.reply, message.tenantId);
    const whatsappMessageId = result.messageId ?? crypto.randomUUID();
    
    BusinessEventBus.emit({
      type: 'reply_sent',
      timestamp: new Date().toISOString(),
      conversationId: message.conversationId,
      phone: message.phone,
      metadata: { intent: 'booking', confidence: bookingDecision.confidence, tenantId: message.tenantId },
    });
    const savedMessage: WhatsAppInternalMessage = {
      id: whatsappMessageId,
      waMessageId: whatsappMessageId,
      tenantId: message.tenantId,
      conversationId: message.conversationId,
      phone: message.phone,
      senderName: "SendMe Studio AI",
      direction: "outbound",
      type: "text",
      content: bookingDecision.reply,
      timestamp: Math.floor(Date.now() / 1000).toString(),
      status: "sent",
      raw: result.data,
      metadata: {
        generatedByAI: true,
        autoSent: true,
        confidence: bookingDecision.confidence,
        intent: "booking",
        bookingStage: bookingSignal.nextStage,
      },
    };
    const saved = await saveWhatsAppMessage(savedMessage);

    emitWhatsAppEvent({
      type: "new_message",
      message: savedMessage,
      conversation: saved.conversation ?? undefined,
    });

    emitWhatsAppEvent({
      type: "ai_auto_replied",
      conversationId: message.conversationId,
      messageId: whatsappMessageId,
      confidence: bookingDecision.confidence,
      intent: "booking",
    });

    if (saved.conversation) {
      emitWhatsAppEvent({
        type: "conversation_updated",
        conversation: saved.conversation,
      });
    }

    return;
  }

  // ── 3) Fall through to original concierge ──
  console.log("AI mode active:", true);
  console.log("Inbound received:", message.content);
  const decision = generateConciergeDecision(message);

  // Emit intent_detected even when blocked (supervisor visibility)
  if (decision.intent !== 'unknown') {
    BusinessEventBus.emit({
      type: 'intent_detected',
      timestamp: new Date().toISOString(),
      conversationId: message.conversationId,
      metadata: { intent: decision.intent, confidence: decision.confidence, tenantId: message.tenantId },
    });
  }

  const draftPayload = {
    type: "ai_draft_ready" as const,
    conversationId: message.conversationId,
    draft: decision.reply,
    confidence: decision.confidence,
    intent: decision.intent,
    safeguardReason: decision.safeguardReason,
  };

  if (!decision.canAutoReply) {
    const reason = decision.safeguardReason
      ? "safeguard blocked"
      : decision.intent === "unknown"
        ? "no intent detected"
        : "confidence blocked";
    console.warn("AI auto reply blocked", {
      reason,
      intent: decision.intent,
      confidence: decision.confidence,
      safeguardReason: decision.safeguardReason,
      tenantId: message.tenantId,
    });
    emitWhatsAppEvent(draftPayload);
    emitWhatsAppEvent({
      type: "ai_auto_reply_blocked",
      conversationId: message.conversationId,
      reason,
      intent: decision.intent,
      confidence: decision.confidence,
    });
    await recordAnalyticsEvent({
      conversationId: message.conversationId,
      type: "ai_draft_generated",
      metadata: {
        sourceMessageId: message.id,
        intent: decision.intent,
        confidence: decision.confidence,
        safeguardReason: decision.safeguardReason ?? null,
        tenantId: message.tenantId,
      },
    });
    await recordAnalyticsEvent({
      conversationId: message.conversationId,
      type: "ai_auto_reply_blocked",
      metadata: {
        sourceMessageId: message.id,
        intent: decision.intent,
        confidence: decision.confidence,
        safeguardReason: decision.safeguardReason ?? "low_confidence",
        tenantId: message.tenantId,
      },
    });
    return;
  }

  if (!hasDeepSeekConfig()) {
    console.warn("DeepSeek key missing");
    emitWhatsAppEvent({
      type: "ai_auto_reply_blocked",
      conversationId: message.conversationId,
      reason: "DeepSeek key missing",
      intent: decision.intent,
      confidence: decision.confidence,
    });
    await recordAnalyticsEvent({
      conversationId: message.conversationId,
      type: "ai_auto_reply_blocked",
      metadata: {
        sourceMessageId: message.id,
        intent: decision.intent,
        confidence: decision.confidence,
        safeguardReason: "deepseek_key_missing",
        tenantId: message.tenantId,
      },
    });
    return;
  }

  try {
    // ── Load tenant knowledge for AI context ──
    const tenantKnowledge = message.tenantId
      ? await loadTenantKnowledge(message.tenantId)
      : null;

    const knowledgePayload = tenantKnowledge
      ? {
          services: tenantKnowledge.services,
          faqs: tenantKnowledge.faqs,
          salonProfile: tenantKnowledge.salonProfile,
          aiRules: tenantKnowledge.aiRules,
          prompts: tenantKnowledge.prompts,
        }
      : undefined;

    console.log("Calling DeepSeek with tenant knowledge...");
    const bCtx = message.tenantId
      ? await getBookingContext(message.conversationId, message.tenantId)
      : null;
    const bookingPayload = bCtx
      ? {
          service: bCtx.service,
          date: bCtx.proposedDate,
          time: bCtx.proposedTime,
          stage: bCtx.stage,
          stylist: bCtx.stylist,
        }
      : null;
    const aiReply = await generateTenantAwareReply(message, decision, knowledgePayload, bookingPayload);
    console.log("DeepSeek response:", aiReply);
    console.log("Auto sending AI reply...");
    const result = await sendWhatsAppMessage(message.phone, aiReply, message.tenantId);
    const whatsappMessageId = result.messageId ?? crypto.randomUUID();

    BusinessEventBus.emit({
      type: 'reply_sent',
      timestamp: new Date().toISOString(),
      conversationId: message.conversationId,
      phone: message.phone,
      metadata: { intent: decision.intent, confidence: decision.confidence, tenantId: message.tenantId },
    });
    const savedMessage: WhatsAppInternalMessage = {
      id: whatsappMessageId,
      waMessageId: whatsappMessageId,
      tenantId: message.tenantId,
      conversationId: message.conversationId,
      phone: message.phone,
      senderName: "SendMe Studio AI",
      direction: "outbound",
      type: "text",
      content: aiReply,
      timestamp: Math.floor(Date.now() / 1000).toString(),
      status: "sent",
      raw: result.data,
      metadata: {
        generatedByAI: true,
        autoSent: true,
        confidence: decision.confidence,
        intent: decision.intent,
      },
    };
    const saved = await saveWhatsAppMessage(savedMessage);

    emitWhatsAppEvent({
      type: "new_message",
      message: savedMessage,
      conversation: saved.conversation ?? undefined,
    });

    emitWhatsAppEvent({
      type: "ai_auto_replied",
      conversationId: message.conversationId,
      messageId: whatsappMessageId,
      confidence: decision.confidence,
      intent: decision.intent,
    });

    if (saved.conversation) {
      emitWhatsAppEvent({
        type: "conversation_updated",
        conversation: saved.conversation,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown auto reply error";
    console.warn("whatsapp ai auto reply failed", {
      conversationId: message.conversationId,
      tenantId: message.tenantId,
      error: errorMessage,
      cause: errorMessage.includes("DeepSeek") ? "DeepSeek error" : "send failed",
    });
    await recordAnalyticsEvent({
      conversationId: message.conversationId,
      type: "failed_send",
      metadata: {
        sourceMessageId: message.id,
        generatedByAI: true,
        autoSent: true,
        error: errorMessage,
        tenantId: message.tenantId,
      },
    });
    emitWhatsAppEvent({
      type: "ai_auto_reply_blocked",
      conversationId: message.conversationId,
      reason: errorMessage.includes("DeepSeek") ? "DeepSeek error" : "send failed",
      intent: decision.intent,
      confidence: decision.confidence,
    });
    emitWhatsAppEvent(draftPayload);
  }
}

async function attachInboundAsset(message: WhatsAppInternalMessage) {
  if (
    message.direction !== "inbound" ||
    !message.mediaId ||
    (message.type !== "image" &&
      message.type !== "audio" &&
      message.type !== "video" &&
      message.type !== "document")
  ) {
    return message;
  }

  const asset = await saveInboundCustomerAsset(message);

  if (!asset) {
    return message;
  }

  message.mediaUrl = asset.publicUrl ?? undefined;
  message.metadata = {
    ...message.metadata,
    assetId: asset.id,
    assetError: asset.error,
  };

  await recordAnalyticsEvent({
    conversationId: message.conversationId,
    type: "media_received",
    metadata: {
      messageId: message.id,
      mediaId: message.mediaId,
      assetId: asset.id,
      mediaType: message.type,
      saved: Boolean(asset.localPath),
      error: asset.error ?? null,
      tenantId: message.tenantId,
    },
  });

  await recordAnalyticsEvent({
    conversationId: message.conversationId,
    type: `${message.type}_received` as
      | "image_received"
      | "audio_received"
      | "video_received"
      | "document_received",
    metadata: {
      messageId: message.id,
      mediaId: message.mediaId,
      assetId: asset.id,
      mimeType: asset.mimeType,
      saved: Boolean(asset.localPath),
      error: asset.error ?? null,
      tenantId: message.tenantId,
    },
  });

  if (asset.localPath) {
    await recordAnalyticsEvent({
      conversationId: message.conversationId,
      type: "asset_saved",
      metadata: {
        messageId: message.id,
        mediaId: message.mediaId,
        assetId: asset.id,
        type: asset.type,
        localPath: asset.localPath,
        publicUrl: asset.publicUrl,
        tenantId: message.tenantId,
      },
    });
  }

  return message;
}

// ── GET: Meta webhook verification ───────────────────────────────

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const verifyToken = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    verifyToken &&
    verifyToken === process.env.WHATSAPP_VERIFY_TOKEN &&
    challenge
  ) {
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

// ── POST: Incoming webhook ───────────────────────────────────────

export async function POST(request: Request) {
  const payload = await request.json();
  const normalizedMessages: WhatsAppInternalMessage[] = [];
  const normalizedStatuses: WhatsAppInternalMessage[] = [];
  const statusUpdates: WhatsAppWebhookStatus[] = [];

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value ?? {};

      // ── Multi-tenant: resolve tenantId from metadata.phone_number_id ──
      const metadata = value.metadata ?? {};
      const phoneNumberId: string | undefined = metadata.phone_number_id;

      let tenantId: string | null = null;
      let tenantError: string | undefined;

      if (phoneNumberId) {
        const resolved = await resolveTenantByPhoneNumberId(phoneNumberId);
        tenantId = resolved.tenantId;
        tenantError = resolved.error;
      } else {
        console.warn("[WHATSAPP] No phone_number_id in webhook metadata");
        tenantError = "NO_PHONE_NUMBER_ID";
      }

      if (!tenantId) {
        console.error("[WHATSAPP] Dropping webhook batch — tenant not resolved", {
          phoneNumberId,
          error: tenantError,
        });
        // Still process statuses (delivery notifications don't need tenant)
        for (const status of value.statuses ?? []) {
          if (
            status.status === "sent" ||
            status.status === "delivered" ||
            status.status === "read"
          ) {
            const normalizedStatus = normalizeStatusAsMessage(status);
            if (normalizedStatus) {
              normalizedStatuses.push(normalizedStatus);
            }
          }
          if (status.id && (status.status === "failed")) {
            console.warn("whatsapp delivery status failed (no tenant)", {
              messageId: status.id,
              recipientId: status.recipient_id,
              errors: status.errors,
            });
          }
        }
        // Skip messages when no tenant resolved
        continue;
      }

      const contacts = value.contacts ?? [];

      for (const message of value.messages ?? []) {
        const normalizedMessage = normalizeWhatsAppMessage(message, contacts);

        if (!normalizedMessage) {
          continue;
        }

        // ── Attach tenantId to the message ──
        normalizedMessage.tenantId = tenantId;

        console.log("[WHATSAPP] Processing inbound message", {
          phoneNumberId,
          tenantId,
          customerPhone: maskPhone(normalizedMessage.phone),
          messageId: normalizedMessage.id,
        });

        await attachInboundAsset(normalizedMessage);
        await upsertCustomerFromMessage(normalizedMessage, tenantId);

        if (normalizedMessage.metadata?.assetId) {
          await addCustomerAsset(normalizedMessage.phone, normalizedMessage.metadata.assetId);
        }

        const saved = await saveWhatsAppMessage(normalizedMessage);
        normalizedMessages.push(normalizedMessage);

        if (saved.isNew) {
          emitWhatsAppEvent({
            type: "new_message",
            message: normalizedMessage,
            conversation: saved.conversation ?? undefined,
          });
        }

        if (saved.conversation) {
          emitWhatsAppEvent({
            type: "conversation_updated",
            conversation: saved.conversation,
          });
        }

        if (saved.isNew) {
          const autoReplyEnabled = Boolean(saved.conversation?.autoReplyEnabled);
          console.log("AI mode active:", autoReplyEnabled);
          console.log("Inbound received:", normalizedMessage.content);

          if (!autoReplyEnabled) {
            console.warn("AI auto reply skipped", {
              cause: "autoReplyEnabled false",
              conversationId: normalizedMessage.conversationId,
              tenantId,
            });
          }
        }

        if (saved.isNew && saved.conversation?.autoReplyEnabled) {
          console.info("whatsapp ai auto reply triggered", {
            conversationId: normalizedMessage.conversationId,
            tenantId,
            phone: maskPhone(normalizedMessage.phone),
          });
          await maybeSendAutoReply(normalizedMessage);
        }
      }

      for (const status of value.statuses ?? []) {
        if (
          status.status === "sent" ||
          status.status === "delivered" ||
          status.status === "read"
        ) {
          const normalizedStatus = normalizeStatusAsMessage(status);

          if (normalizedStatus) {
            normalizedStatus.tenantId = tenantId;
            normalizedStatuses.push(normalizedStatus);
          }
        }

        if (
          status.id &&
          (status.status === "sent" ||
            status.status === "delivered" ||
            status.status === "read")
        ) {
          const updatedMessage = await updateWhatsAppMessageStatus(
            status.id,
            status.status,
            status.timestamp,
            tenantId
          );

          statusUpdates.push(status);

          emitWhatsAppEvent({
            type: "message_status_updated",
            messageId: status.id,
            conversationId: updatedMessage?.conversationId ?? status.recipient_id,
            status: updatedMessage?.status ?? status.status,
            timestamp: status.timestamp,
          });
        } else if (status.id && status.status === "failed") {
          console.warn("whatsapp delivery status failed", {
            messageId: status.id,
            recipientId: status.recipient_id,
            errors: status.errors,
            tenantId,
          });
        }
      }
    }
  }

  if (normalizedMessages.length > 0) {
    console.info(
      "whatsapp webhook messages received",
      normalizedMessages.map((message) => ({
        id: message.id,
        from: maskPhone(message.phone),
        type: message.type,
        direction: message.direction,
        tenantId: message.tenantId,
        hasContent: Boolean(message.content),
        hasMedia: Boolean(message.mediaId || message.mediaUrl),
      }))
    );
  }

  return NextResponse.json({
    ok: true,
    received: normalizedMessages.length,
    statuses: statusUpdates.length,
    statusMessages: normalizedStatuses.length,
  });
}
