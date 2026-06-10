# G-9: Business Event Bus — Implementation Report

## Goal

Connect real business events (WhatsApp messages, concierge decisions, booking stages, appointment creation) to the Supervisor dashboard, so business activity is visible alongside agent heartbeats — without any architecture rewrite.

## What Was Built

### 1. `BusinessEventBus` (new file)

**`src/agents/system/BusinessEventBus.ts`**

A lightweight singleton event store that:
- Accepts `emit(event)` calls from business routes
- Stores up to 100 events in a ring buffer
- Returns `getMetrics()` — a synchronous snapshot of event counts + timeline
- Requires no async init, no Node builtins, no external deps

**Event types emitted:**

| Event | When |
|-------|------|
| `message_received` | Inbound WhatsApp message triggers `maybeSendAutoReply()` |
| `intent_detected` | Concierge detects a non-booking intent (balayage, corte, etc.) |
| `service_detected` | Booking flow detects a service keyword |
| `date_detected` | Booking flow parses a date (hoy, mañana, 15/05, lunes) |
| `time_detected` | Booking flow parses a time (3pm, 15:00) |
| `booking_confirmed` | User confirms booking (has date + time + confirmation signal) |
| `appointment_created` | POST `/api/appointments` returned 201 |
| `reply_sent` | AI auto-reply sent to customer (booking or DeepSeek) |

### 2. Emissions in `webhook/route.ts`

Events are emitted at natural decision points in `maybeSendAutoReply()`:
- On every inbound message (top of function)
- After booking signal detection (service/date/time sub-events)
- After booking confirmation (before appointment POST)
- After successful appointment creation
- After sending a booking reply
- After intent detection in normal concierge path
- After sending a DeepSeek reply

**Existing business logic is completely unchanged.** Event emissions are added alongside existing `console.info` / `emitWhatsAppEvent` / `recordAnalyticsEvent` calls — not replacing them.

### 3. `SystemSupervisorAgent` Update

- Imports `BusinessEventBus`
- Adds `businessMetrics: BusinessMetrics` to `SupervisorReport`
- `getReport()` now includes `BusinessEventBus.getMetrics()` in the snapshot

### 4. Supervisor API Route Update

**`src/app/api/supervisor/route.ts`**
- Reads `BusinessEventBus.getMetrics()` via dynamic import
- Returns `businessMetrics` object in the API response alongside agents/heartbeats
- Zero-latency (same as registry fallback pattern — immediate synchronous read)

### 5. Supervisor Dashboard Page

**`src/app/supervisor/page.tsx`** — new **"Live Business Activity"** section:

| Card | Shows |
|------|-------|
| Events Today | Total events since process start |
| Messages Received | `message_received` count |
| Bookings Created | `booking_confirmed` count |
| Last Event | Type + timestamp of most recent event |
| Event Timeline | Scrollable list of last 20 events with time, type, and detail |

## Files Changed

| File | Type | Lines Changed |
|------|------|--------------|
| `src/agents/system/BusinessEventBus.ts` | **New** | 74 |
| `src/agents/system/SystemSupervisorAgent.ts` | Modified | +4 imports, +1 interface field, +1 snapshot field |
| `src/app/api/whatsapp/webhook/route.ts` | Modified | +2 imports, +7 emit blocks (~80 lines) |
| `src/app/api/supervisor/route.ts` | Modified | +2 interfaces, +1 metrics read block, +1 response field |
| `src/app/supervisor/page.tsx` | Modified | +4 icons, +1 type, +3 helpers, +1 business section block (~100 lines) |
| `src/app/supervisor/supervisor.module.css` | Modified | ~50 new CSS rules |

## Validation

- `npx tsc --noEmit` — **passes**
- `npm run build` — **passes** (25 pages, all routes compiled)
- No new dependencies
- No new agents created
- No existing business logic changed

## Architecture

```
WhatsApp inbound message
  └── webhook/route.ts
        ├── BusinessEventBus.emit('message_received')
        ├── generateBookingConciergeDecision()
        │     ├── BusinessEventBus.emit('service_detected')
        │     ├── BusinessEventBus.emit('date_detected')
        │     ├── BusinessEventBus.emit('time_detected')
        │     └── BusinessEventBus.emit('booking_confirmed')
        │           └── fetch('/api/appointments')
        │                 └── BusinessEventBus.emit('appointment_created')
        └── BusinessEventBus.emit('reply_sent')

Supervisor Dashboard
  └── fetch('/api/supervisor')
        └── BusinessEventBus.getMetrics()
              └── returned in JSON response
```

No agent ecosystem modules are called from business routes. The BusinessEventBus is a standalone singleton — zero coupling to `SystemSupervisorAgent` or any agent.
