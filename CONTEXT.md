# CONTEXT.md — SendMe Studio / Salon_Belleza

## Proyecto

Estamos construyendo **SendMe Studio**, una plataforma SaaS premium para salones de belleza que combina:

* WhatsApp CRM
* Inbox inteligente
* campañas por WhatsApp
* IA conversacional
* Knowledge Base del salón
* Emotional Business Brain
* importación de contactos
* cumplimiento Meta / WhatsApp
* métricas de campañas
* branding por cliente

Cliente actual de prueba:
**Maite Guerra Salón de Belleza**

Ruta local:
`D:\SENDMEPRO\PROYECTOS\SENDME STUDIO\Salon_Belleza`

---

## Stack

* Next.js App Router
* TypeScript
* CSS Modules
* WhatsApp Cloud API
* Cloudflare Tunnel para desarrollo local
* Archivos locales JSON/MD en `/data`
* Assets en `/public/img`

Comando local:

```bash
npm run dev
```

URL local:

```txt
http://localhost:3000
```

Cloudflare dev:

```bash
cloudflared tunnel --url http://localhost:3000
```

---

## Estado actual funcionando

### WhatsApp / Inbox

Funciona:

* mensaje desde CRM → teléfono
* mensaje desde teléfono → CRM
* imagen desde teléfono → CRM
* respuesta desde teléfono a campaña → CRM
* ventana 24h detectada
* indicador “Ventana activa · 24h restantes”
* tapiz visual del chat aplicado
* modo Manual / IA
* panel derecho de soporte conversacional

Pendiente / revisar:

* imagen desde CRM → teléfono puede requerir corrección outbound media
* evitar duplicados visuales por optimistic UI
* botón enviar debe bloquear doble click

---

## Campaigns

Funciona:

* editor de campañas
* selección narrativa / audiencia / estilo post
* importación CSV/XLSX desde `/wsp`
* Audience Builder
* Test Send seguro
* Campaign Safety Gate
* Consent Guard
* ventana 24h
* envío de prueba real a WhatsApp
* respuesta de cliente vuelve al CRM
* health/compliance básico
* hero con logo/branding cliente
* sidebar con campañas

Reglas importantes:

* si `consentWhatsapp !== true`, NO enviar campañas marketing
* dentro de 24h: mensaje libre permitido
* fuera de 24h: requiere plantilla Meta aprobada
* envío masivo aún debe mantenerse bloqueado hasta validar mejor
* Test Send solo a 1 contacto

Pendiente:

* Campaign History
* KPIs reales desde webhooks
* deduplicación visual de bubbles
* loading state en enviar prueba
* plantillas Meta reales
* masivo controlado

---

## Contactos

Archivos de prueba:

```txt
/wsp/sendme_contacts_sample.csv
/wsp/sendme_contacts_sample.xlsx
```

Campos esperados:

```csv
firstName,lastName,phone,email,tags,requestedService,favoriteService,preferredStylist,lastVisit,consentWhatsapp,lifecycleStage,notes
```

Regla:

* deduplicar por teléfono
* no enviar a contactos sin consentimiento confirmado
* mostrar importados / válidos / duplicados

---

## Knowledge Base

Debe existir un Knowledge estable y editable.

Regla clave:

NO consultar la web cada vez que responde la IA.

Flujo correcto:

1. importar web/documentos/texto una vez
2. IA extrae conocimiento
3. guardar en `data/knowledge/knowledge-document.json`
4. usuario revisa conflictos
5. usuario confirma valor oficial
6. la IA usa solo el documento aprobado

Archivos:

```txt
data/knowledge/knowledge-document.json
data/knowledge/knowledge-sources.json
data/knowledge/knowledge-versions.json
```

Debe soportar:

* servicios
* precios
* horarios
* dirección
* estilistas
* alias
* errores comunes de escritura
* preguntas frecuentes
* campañas sugeridas
* conflictos de datos

Conflictos detectados Maite Guerra:

* dirección antigua vs dirección actual
* precios distintos en home vs páginas internas

UI debe mostrar conflictos en rojo suave:

* Confirmar A
* Confirmar B
* Editar manualmente
* Marcar como oficial

---

## Maite Guerra Knowledge inicial

Website:

```txt
https://maiteguerra.cl
```

Páginas fuente:

```txt
https://maiteguerra.cl/
https://maiteguerra.cl/cabello
https://maiteguerra.cl/unas
https://maiteguerra.cl/cejas-y-pestanas
https://maiteguerra.cl/maquillaje
https://maiteguerra.cl/depilacion
https://maiteguerra.cl/expertos
```

Datos principales:

* WhatsApp: `+56 944990219`
* Email: `contacto@maiteguerra.cl`
* Instagram: `@maiteguerrasalon`
* TikTok: `@maiteguerrasalon`
* Booking: AgendaPro

Horario:

* martes a viernes: 09:30 a 19:30
* sábado: 09:00 a 16:00
* lunes/domingo: cerrado

Servicios base:

* Corte mujer
* Corte hombre
* Brushing
* Coloración completa
* Balayage / reflejos / mechas / babylights / visos
* Alisado orgánico
* Masajes capilares
* Ritual Kerastase
* Tratamiento ABC Redken
* Esmaltado permanente
* Dip powder
* Perfilado de cejas
* Lifting pestañas
* Depilación

---

## Fuzzy matching servicios

Debe funcionar para TODOS los servicios, no solo balayage.

Cada servicio debe soportar:

```ts
name
category
keywords
aliases
misspellings
phoneticAliases
```

Ejemplos:

Balayage:

```txt
balayage, balayash, balayaje, balaje, ballayage, mechas, reflejos, iluminación, rayitos, rubios, visos
```

Hidratación:

```txt
hidratacion, idratacion, masaje capilar, tratamiento, pelo seco, reparación
```

Olaplex:

```txt
olaple, olaples, reparación, pelo dañado
```

Color:

```txt
tinte, tintura, coloración, teñir, raíz, canas, baño de color
```

---

## IA Conversacional

La IA debe sonar como recepcionista premium de salón, no como chatbot.

Estilo:

* breve
* cálido
* humano
* chileno natural
* elegante
* no corporativo
* no respuestas largas
* no sonar robótico

Ejemplos buenos:

```txt
Sí claro 😊
Perfecto, la esperamos ✨
¿Desea baño de color, cobertura de canas o color global?
```

Ejemplos malos:

```txt
Con mucho gusto podemos asistirle en su requerimiento.
```

Debe detectar:

* precio
* reserva
* reagendar
* promociones
* baño de color
* canas
* raíz
* masaje
* Kerastase
* corte
* estilista preferido
* clienta enviando foto
* dudas técnicas

Debe guardar señales CRM:

* servicio detectado
* intención de reserva
* presupuesto estimado
* temperatura lead
* objeción
* emoción
* urgencia
* preferencia de horario

---

## Emotional Business Brain

Ruta:

```txt
/brain-admin
```

Objetivo:

Sistema premium/admin para alimentar memoria emocional del negocio.

Debe estar protegido por clave admin.

Clave local temporal:

```txt
BRAIN_ADMIN_KEY=SendMeBrain2026!
```

Agregar a `.env.local`:

```env
BRAIN_ADMIN_KEY=SendMeBrain2026!
```

Funciones:

* subir capturas WhatsApp
* subir chats exportados
* subir TXT / MD / PDF
* grabar nota de voz
* transcribir audio
* editar transcripción antes de guardar
* generar sugerencias
* guardar memoria portable `.md` y `.json`
* actualizar % de Brain Confidence

Storage local:

```txt
data/business-brain/raw-conversations/
data/business-brain/raw-voice/
data/business-brain/transcripts/
data/business-brain/suggestions/
data/business-brain/emotion-patterns/
data/business-brain/campaign-analysis/
data/business-brain/service-intents/
data/business-brain/closing-techniques/
```

Debe ser portable para:

* GPT
* Claude
* DeepSeek
* Gemini
* MCP
* agentes futuros

---

## Google Drive Brain Storage

Drive externo del cliente:

```txt
SendMeStudio / MaiteGuerra.cl
```

Carpetas:

```txt
/img
/.txt
/.pdf
/.mp3
/.md
```

Reglas:

* `/img`: jpg, jpeg, png, webp
* `/.txt`: textos
* `/.pdf`: documentos
* `/.mp3`: audios
* `/.md`: memoria procesada

No hacer polling constante.

Usar:

* botón “Sincronizar Drive”
* en futuro Google Drive Watch/Webhook

Guardar índice:

```txt
data/business-brain/drive-sync-index.json
```

Procesar solo archivos nuevos por:

```txt
fileId + modifiedTime
```

---

## AI Usage Metering

Necesitamos medir consumo IA para cobrar extra.

Guardar cada llamada IA en:

```txt
data/ai-usage/usage-events.json
```

Campos:

```ts
feature
customerId
conversationId
campaignId
model
inputTokens
outputTokens
totalTokens
estimatedCost
timestamp
success
error
```

Features:

```txt
inbox_ai_reply
campaign_ai_copy
campaign_ai_rewrite
support_feed_match
knowledge_search
brain_voice_transcription
brain_screenshot_learning
brain_suggestion_generation
```

Mostrar resumen mensual:

* llamadas IA
* tokens
* costo estimado
* uso facturable
* feature más usada

---

## Branding / UI

Idioma:

* Toda la UI debe estar en español.
* Se puede mostrar key inglesa pequeña al lado como ayuda técnica.

Ejemplo:

```txt
Palabras permitidas / allowedWords
Palabras prohibidas / forbiddenWords
Emojis permitidos / allowedEmojis
Cuándo vender / whenToSell
Cuándo no vender / whenNotToSell
```

Assets:

```txt
/public/img/logo.png
/public/img/logo-white.svg
/public/img/tapiz-1.png
/public/img/tapiz-2.png
/public/img/tapiz-3.png
```

Home hero:

* usar `logo-white.svg`
* sin fondo blanco lechoso detrás del logo
* estética premium/luxury salon

---

## Reglas Meta / WhatsApp

* No usar “Meta Tech Provider” si no está aprobado oficialmente.
* Se puede decir:

  * “Integrado con WhatsApp Cloud API”
  * “Powered by WhatsApp Cloud API”
* Dentro de 24h desde último mensaje cliente: mensaje libre.
* Fuera de 24h: requiere plantilla aprobada.
* Campañas marketing solo a contactos con consentimiento.
* No enviar a contactos con `consentWhatsapp !== true`.

---

## Bugs conocidos / próximos

1. Evitar duplicado visual de mensajes enviados en Inbox.
2. Loading/disabled state en botones de envío.
3. Outbound media CRM → WhatsApp.
4. Campaign History.
5. KPIs reales desde webhooks.
6. Plantillas Meta reales.
7. Google Drive sync.
8. AI usage billing.
9. Knowledge Review completo.
10. Brain Admin audio capture/transcription.
11. Home dashboard premium final.
12. Multi-tenant / Embedded Signup futuro.

---

## Cómo trabajar

* No refactorizar módulos no relacionados.
* No romper UI premium.
* Cambios pequeños y verificables.
* Mantener estética glass/luxury.
* Español primero.
* No hardcodear datos si ya existen en JSON/env.
* No exponer tokens.
* No guardar secretos en frontend.
* Siempre proteger reglas Meta y consentimiento.
