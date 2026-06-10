# Cloudflare WhatsApp Webhook Setup

## Local Endpoint

The WhatsApp webhook is available locally at:

```txt
http://localhost:3000/api/whatsapp/webhook
```

Supported methods:

- `GET /api/whatsapp/webhook`
- `POST /api/whatsapp/webhook`

## Verify Token

Configured local environment:

```txt
WHATSAPP_VERIFY_TOKEN=sendmestudio_verify_2026
```

Files updated:

- `.env.local`
- `.env.example`

After changing `.env.local`, restart `next dev` if the server was already running.

## Local Verification

Valid challenge test:

```powershell
Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=sendmestudio_verify_2026&hub.challenge=sendme_challenge_ok" -Method GET
```

Expected response:

```txt
200 sendme_challenge_ok
```

Invalid token test:

```powershell
Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=sendme_challenge_bad" -Method GET
```

Expected response:

```txt
403 Forbidden
```

POST receive test:

```powershell
Invoke-WebRequest -UseBasicParsing `
  -Uri "http://localhost:3000/api/whatsapp/webhook" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"entry":[{"changes":[{"value":{"contacts":[{"wa_id":"56912345678","profile":{"name":"Valentina"}}],"messages":[{"id":"wamid.cloudflare.test","from":"56912345678","timestamp":"1716470400","type":"text","text":{"body":"Mensaje de prueba Cloudflare Tunnel"}}]}}]}]}'
```

Expected response:

```json
{"ok":true,"received":1}
```

## Cloudflare Tunnel

Run:

```powershell
cloudflared tunnel --url http://localhost:3000
```

Cloudflare will print a generated `trycloudflare.com` URL.

## Meta Webhook Configuration

Callback URL:

```txt
https://GENERATED-CLOUDFLARE-URL.trycloudflare.com/api/whatsapp/webhook
```

Verify token:

```txt
sendmestudio_verify_2026
```

## Current Local Test Result

Verified locally:

- Correct token returns `200 sendme_challenge_ok`.
- Wrong token returns `403 Forbidden`.
- Sample WhatsApp POST returns `200 {"ok":true,"received":1}`.
