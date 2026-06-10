# FIX: Booking Date Human Format — Report

## Problem

The WhatsApp concierge booking reply showed dates in ISO format (`YYYY-MM-DD`), which is machine-readable but not human-friendly for Spanish-speaking customers.

**Before:**
> *"Para el 2026-06-01, ¿qué horario te acomoda?"*

**After:**
> *"Para el lunes 01 de junio, ¿qué horario te acomoda?"*

## Root Cause

The `bookingReplyFor()` function in `src/app/api/whatsapp/ai-concierge.ts` used `context.date` directly in template strings. The `BookingSignal.date` field stores dates as ISO strings (`"2026-06-01"`) for internal processing, but those strings were never formatted for customer-facing output.

## Fix

### 1. Added `formatBookingDate()` in `booking-context.ts`

A standalone pure function that converts `YYYY-MM-DD` to Spanish human format:

```
2026-06-01 → lunes 01 de junio
2026-12-25 → viernes 25 de diciembre
```

Uses simple lookup arrays for weekdays and months — no Node.js `Intl` dependency, no locale files, no async.

### 2. Updated `bookingReplyFor()` in `ai-concierge.ts`

Two template strings now wrap `context.date` with `formatBookingDate(date)`:

- **Confirmed booking** (has date + time): `"voy a reservar tu hora para el {formattedDate} a las {time}."`
- **Need time** (has date, no time): `"Para el {formattedDate}, ¿qué horario te acomoda mejor?"`

The third format path (has service, no date) doesn't reference `context.date` so it was unchanged.

## Files Changed

| File | Change |
|------|--------|
| `src/app/api/whatsapp/booking-context.ts` | Added `formatBookingDate()` export (~30 lines) |
| `src/app/api/whatsapp/ai-concierge.ts` | Imported `formatBookingDate`, wrapped 2 date references in `bookingReplyFor()` |

## Validation

- `npx tsc --noEmit` — ✅ passes
- `npm run build` — ✅ passes (25 pages, all routes)
- No booking logic changed
- No appointment creation changed
- No webhook modified
- No UI changes
