# WhatsApp Auto-Booking Concierge — Implementation Report

## Summary

Implemented a stateful auto-booking system within the WhatsApp concierge AI. When clients express interest in scheduling (via keywords like "agenda", "cita", "disponible", "hora"), the concierge now guides them through a structured booking flow — detecting service, date, and time — and auto-creates appointments on confirmation.

## What was built

### New file: `src/app/api/whatsapp/booking-context.ts`

A conversational state store that tracks the booking stage per conversation:

**Stages:** `idle → awaiting_date → awaiting_time → awaiting_confirm → booking_complete`

Key capabilities:
- **In-memory state per conversationId** with 30-min TTL garbage collection
- **Date detection:** "hoy", "mañana", day-of-week names ("lunes", "martes"), DD/MM patterns, "15 de mayo" format
- **Time detection:** HH:MM, HHam/pm, "3pm", "15 hrs" patterns
- **Service detection** via the existing `matchTextToServices` service matcher
- **Confirmation/negation detection:** "si", "ok", "dale", "confirmo" vs "no", "despues", "otro dia"
- **`formatSlotSuggestions()`** reads `data/availability.json` and returns formatted slot suggestions grouped by date
- **State reset** on negation or timeout

### Modified: `src/app/api/whatsapp/ai-concierge.ts`

- Added `generateBookingConciergeDecision()` — evaluates the booking signal before falling through to the existing intent detection
- Returns a `BookingDecision` with:
  - `canAutoReply` — whether we should reply now
  - `reply` — context-aware reply text
  - `bookingSignal` — detected { service, date, time, nextStage, isConfirm }
  - `shouldBook` — true when user confirmed (service + date + time all present)
- Added `bookingReplyFor()` — generates Spanish replies tailored to where the user is in the booking flow
- Added `export type BookingDecision` for use by the webhook route
- Existing `generateConciergeDecision()` remains untouched for non-booking messages

### Modified: `src/app/api/whatsapp/webhook/route.ts`

Updated `maybeSendAutoReply()`:
1. First calls `generateBookingConciergeDecision()` at the top
2. If a booking signal is detected and can auto-reply, sends the booking reply directly (no DeepSeek call needed — booking replies are deterministic)
3. If `shouldBook === true`, POSTs to `POST /api/appointments` to create the appointment, emits `appointment_scheduled` event
4. Falls through to the original `generateConciergeDecision()` + DeepSeek pipeline only for non-booking messages

### Modified: `src/app/api/whatsapp/store.ts`

Added `bookingStage?: string` to the `metadata` type on `WhatsAppInternalMessage` — allows storing booking stage on saved messages for analytics.

## Booking flow example

```
Client: "Quiero agendar un balayage"
→ Stage: awaiting_date
→ Concierge: "Genial. ¿Que dia te gustaria agendar tu Balayage?"

Client: "El jueves"
→ Stage: awaiting_time (date=jueves)
→ Concierge: "Excelente. Para el [jueves date], ¿que horario te acomoda mejor?"

Client: "A las 3pm"
→ Stage: awaiting_confirm (date=jueves, time=15:00)
→ Concierge: "Perfecto, voy a reservar tu hora para el [date] a las 15:00..."

Client: "Si, dale"
→ shouldBook=true → POST /api/appointments → appointment created
```

## Build status

- `npx tsc --noEmit` — **passes**
- `npm run build` / `npx next build` — **succeeds** (all 25 pages, all routes, Compiled 4.3s, TS 9.2s)

## What's NOT changed

- No new UI pages
- No new API routes (uses existing `POST /api/appointments`)
- No new npm dependencies
- No changes to the existing `generateConciergeDecision()` or DeepSeek flow
- Inbox, client pages, campaigns, contacts all unchanged
- `formatSlotSuggestions()` is exported but not yet wired into replies — ready for future enhancement

## Future enhancement ideas

1. Wire `formatSlotSuggestions()` into booking replies when no date/time detected yet
2. Add more natural language date patterns (e.g. "este viernes", "la proxima semana")
3. Support stylist preference detection ("con Sofia", "con Valeria")
4. Persist booking context to disk for server restarts
5. Wire appointment creation confirmation back to UI via SSE
