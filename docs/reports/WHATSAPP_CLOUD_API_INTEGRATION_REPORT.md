# WhatsApp Cloud API Integration Report

## Scope

Implemented the SendMeStudio WhatsApp Cloud API foundation:

- webhook verification
- incoming webhook receive/normalization
- mock message storage
- text send endpoint
- `/inbox` Send Draft integration
- `/inbox` polling for incoming webhook messages

## Environment Variables

Added `.env.example` with:

```txt
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
```

Tokens remain server-only. No WhatsApp token is exposed to frontend code.

## API Routes

### `GET /api/whatsapp/webhook`

- Reads Meta webhook query params.
- Compares `hub.verify_token` with `WHATSAPP_VERIFY_TOKEN`.
- Returns `hub.challenge` when valid.
- Returns `403` when invalid.

### `POST /api/whatsapp/webhook`

- Receives WhatsApp webhook payloads.
- Parses `entry[].changes[].value.messages[]`.
- Normalizes messages into:

```ts
{
  id,
  from,
  timestamp,
  type,
  text,
  mediaId,
  contactName,
  raw
}
```

- Handles text now.
- Prepares media ID extraction for `image`, `video`, `audio`, and `document`.
- Stores normalized messages in an in-memory mock store.
- Increments mock unread count server-side.
- Logs only safe metadata: message id, masked phone, type, text/media flags.

### `POST /api/whatsapp/send`

- Accepts:

```json
{
  "to": "569...",
  "text": "Message body"
}
```

- Sends text through:

```txt
https://graph.facebook.com/v22.0/{WHATSAPP_PHONE_NUMBER_ID}/messages
```

- Uses server-side `WHATSAPP_ACCESS_TOKEN`.
- Does not log the access token.

### `GET /api/whatsapp/messages`

- Returns mock-stored webhook messages for inbox polling.
- Supports `after=<messageId>`.
- Supports `markSeen=true`.

## Inbox Integration

- `/inbox` Send Draft now calls `/api/whatsapp/send`.
- The current UI is preserved.
- Outgoing draft still appears as a studio bubble.
- Incoming webhook messages are polled from `/api/whatsapp/messages` and appended as client bubbles.
- Media webhook messages are represented with a prepared text fallback until upload/download handling is implemented.
- AI Draft panel was moved lower by increasing the draft panel top padding.

## Verification

- `GET /api/whatsapp/webhook` with invalid token returns `403`.
- `POST /api/whatsapp/webhook` with a sample WhatsApp text payload returns `200` and stores the normalized message.
- `GET /api/whatsapp/messages?markSeen=true` returns the stored normalized message.
- `POST /api/whatsapp/send` returns `500` locally because WhatsApp credentials are not configured, without exposing secrets.
- Browser verified `/inbox`:
  - webhook-stored messages appear as client bubbles through polling.
  - `Send draft` appends a studio bubble and calls the send endpoint.
  - AI Draft panel top padding is now `28px`.

## Build Status

`npm.cmd run build` compiled the Next.js bundle successfully, then failed on an unrelated existing TypeScript issue:

`liquid-glass-studio-main/src/App.tsx:260` cannot find name `GPUDevice`.
