# G-9: Event Visibility Verification Report

## Verification Result: ✅ ALL LAYERS WIRED CORRECTLY

Business events are being emitted by the webhook and fully exposed through both the agent layer and the API layer. The dashboard consumes them. No missing wiring.

---

## Layer-by-Layer Walkthrough

### 1. `SystemSupervisorAgent` — `getReport()`
**File:** `src/agents/system/SystemSupervisorAgent.ts` (line 395)

```ts
businessMetrics: BusinessEventBus.getMetrics(),
```

The `SupervisorReport` interface includes `businessMetrics: BusinessMetrics` (line 65). Every `getReport()` call reads directly from the singleton bus — synchronous, zero-latency.

### 2. `/api/supervisor` — `GET` handler
**File:** `src/app/api/supervisor/route.ts` (lines 174–198)

The API route dynamically imports `BusinessEventBus` and maps `getMetrics()` into the `BusinessMetricsResponse` shape:

```ts
const { BusinessEventBus } = await import('../../../agents/system/BusinessEventBus');
const metrics = BusinessEventBus.getMetrics();
businessMetrics = { eventsToday, messagesReceived, bookingsCreated, lastEvent, recentEvents, byType };
```

Returned in the JSON response at line 222:
```ts
return NextResponse.json({
  ...
  businessMetrics,
});
```

### 3. Supervisor Dashboard — `page.tsx`
**File:** `src/app/supervisor/page.tsx` (lines 340–434)

The dashboard:
- Types `businessMetrics` in `SupervisorApiResponse` (lines 48–55)
- Conditionally renders a "Live Business Activity" section when `data.businessMetrics` is present (line 340)
- Shows 4 metric cards: Events Today, Messages Received, Bookings Created, Last Event
- Renders an event timeline from `recentEvents`

---

## Data Flow (End-to-End)

```
WhatsApp webhook/route.ts
  └── BusinessEventBus.emit({ type, timestamp, metadata })
        ↓
SystemSupervisorAgent.getReport()
  └── BusinessEventBus.getMetrics()
        ↓ (serialized into SupervisorReport.businessMetrics)
/api/supervisor GET
  └── dynamic import BusinessEventBus
  └── BusinessEventBus.getMetrics()
  └── { ..., businessMetrics }
        ↓
/supervisor page.tsx
  └── fetch('/api/supervisor')
  └── data.businessMetrics.eventsToday / .messagesReceived / .bookingsCreated / .lastEvent / .recentEvents
  └── Renders cards + timeline
```

Both the agent layer (`SystemSupervisorAgent`) and the direct API path (`/api/supervisor`) independently read from `BusinessEventBus.getMetrics()`. The dashboard page receives business metrics through the API response.

---

## Coverage

| Layer | Component | Business Metrics Read? |
|-------|-----------|----------------------|
| Event source | `BusinessEventBus` | ✅ Stores all 8 event types |
| Emission | `webhook/route.ts` | ✅ 7 emit points in `maybeSendAutoReply()` |
| Agent | `SystemSupervisorAgent.getReport()` | ✅ `businessMetrics` in `SupervisorReport` |
| API | `/api/supervisor` GET | ✅ `businessMetrics` in JSON response |
| UI | `/supervisor` page | ✅ Metrics cards + timeline rendered |

**No changes needed.** The event bus is fully wired end-to-end.
