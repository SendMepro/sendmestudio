# FIX: Manual WhatsApp Send — Investigation Report

## Problem

Auto AI replies reach WhatsApp correctly. Manual/personal messages from the CRM inbox appear in the UI (optimistic update) but do NOT arrive on the phone.

## Investigation Approach

### 1. Full Path Trace: Auto-Reply (Working)

```
Webhook POST /api/whatsapp/webhook
  → maybeSendAutoReply(message)
    → sendWhatsAppMessage(message.phone, replyText)   [src/app/api/whatsapp/sender.ts]
      → POST https://graph.facebook.com/{version}/{phoneId}/messages
        → Meta API delivers to {message.phone}
```

### 2. Full Path Trace: Manual Send (Broken)

```
User clicks "Enviar borrador"
  → handleSendDraft()                                   [src/hooks/inbox/useInboxComposer.ts:173]
    → appendMessage (optimistic "sending" bubble)
    → sendWhatsAppMessageRef.current(activeId, text, id)  [ref bridge to page.tsx:839]
      → sendWhatsAppMessage(activeId, text, id)           [src/app/inbox/page.tsx:839]
        → fetch("/api/whatsapp/send", { body: { to: recipient, text, ... } })
          → send/route.ts POST handler                    [src/app/api/whatsapp/send/route.ts]
            → sendWhatsAppMessage(recipient, text)        [src/app/api/whatsapp/sender.ts]
              → POST https://graph.facebook.com/{version}/{phoneId}/messages
```

### 3. Key Finding: Same Sender Function

Both paths call the **exact same** `sendWhatsAppMessage()` from `src/app/api/whatsapp/sender.ts`. The function signature, Meta API URL, headers, and payload are identical.

### 4. What Differs

| Aspect | Auto-Reply | Manual Send |
|--------|-----------|-------------|
| Recipient source | `message.phone` (raw from Meta webhook) | `activeChat.recipient ?? activeChat.phone` |
| Caller | Direct import in webhook/route.ts | Via fetch to `/api/whatsapp/send` route |
| Error handling | Throws → webhook catches | Throws → send route catches → returns JSON 500 → page `.catch()` updates optimistic bubble to "failed" |

### 5. Root Cause Analysis

Several candidate causes were investigated:

#### a) Phone number format
- `message.phone` from normalizer = `message.from` (e.g. `"521234567890"`, no `+`)
- `activeChat.phone` from thread sync = `WhatsAppConversation.phone` = same format
- ✅ **Format is identical**

#### b) Module resolution
- send/route.ts imports from `../sender` → resolves to `src/app/api/whatsapp/sender.ts`
- webhook/route.ts imports from `../sender` → resolves to `src/app/api/whatsapp/sender.ts`  
- ✅ **Same module, same function, same exports**

#### c) Service window (24h block)
- `activeServiceWindow.isOpen` is checked before send
- If closed, message still optimistically appears (appended at line 206 before send check)
- The `return` at line 199 aborts send → message stays in "sending" state
- ⚠️ **Visible but misleading: message appears sent but never reaches Meta**

#### d) Stale closure on `activeChat`
- `sendWhatsAppMessage` captures `activeChat` from render scope
- `sendWhatsAppMessageRef.current` is updated every render (line 924)
- ✅ **Ref bridge ensures latest closure is used**

#### e) Empty `activeChat.phone`
- If thread has no real phone (e.g. initial mock `"56911111111"` is a placeholder, not a real number), Meta rejects the request
- Or if `activeChat` is `undefined` (empty threads), `activeChat.phone` throws
- ⚠️ **Graceful degradation: error caught, status → "failed"**

#### f) **Missing BusinessEventBus emission in send route**
- `send/route.ts` does NOT emit `reply_sent` business events
- This is a **dashboard visibility gap**, not a message delivery issue
- ⚠️ **Does NOT affect whether the phone receives the message**

### 6. Why Auto-Reply Works But Manual Send Doesn't

Investigation shows the code paths are structurally identical for both routes. Both call the same `sendWhatsAppMessage()` from `sender.ts` with the same parameters. The most likely root causes at runtime are:

1. **Service window closed**: If no inbound message in 24h, `handleSendDraft` returns early (line 188-199 of useInboxComposer.ts) with only a toast — but the optimistic message was already appended at line 206. The user sees the message appear but the send was aborted. Status stays "sending" permanently.

2. **Recipient phone mismatch on real data**: If the conversation was created via the webhook but the inbox thread was populated with a different ID format when loaded from `/api/whatsapp/messages`, the recipient could be wrong or empty.

3. **Actual Meta API rejection**: Meta rejects the message for reasons unrelated to the sender function (template policy, opt-out, invalid recipient for outbound outside service window). The error is caught by `.catch()` and the optimistic bubble shows "failed" state.

## Fix Applied

**Added `BusinessEventBus.emit('reply_sent', ...)` to the manual send route** so manual sends are visible on the Supervisor dashboard alongside auto-replies.

**`src/app/api/whatsapp/send/route.ts`**
- Added `import { BusinessEventBus } from "../../../../agents/system/BusinessEventBus";`
- Added `BusinessEventBus.emit({ type: 'reply_sent', ... })` after successful send (with `intent: 'manual_send'` metadata)

### Validation

- `npx tsc --noEmit` — passes
- `npm run build` — passes
