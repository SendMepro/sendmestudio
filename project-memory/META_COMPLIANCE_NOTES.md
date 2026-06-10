# META_COMPLIANCE_NOTES.md

## Reglas de Compliance Meta/WhatsApp

### Reglas Obligatorias
1. **Consentimiento**: No enviar mensajes marketing si `consentWhatsapp !== true`
2. **Ventana 24h**: Dentro de 24h = mensaje libre permitido; fuera de 24h = requiere plantilla Meta aprobada
3. **Plantillas Aprobadas**: Solo usar plantillas con `metaStatus === "approved"`
4. **Categoría de Mensaje**: Marketing vs Service vs Authentication
5. **Frecuencia**: No saturar a clientes con mensajes frecuentes
6. **Spam Risk**: Validar contenido antes de enviar

### Safeguards Implementados (AI Concierge)
- Patrones bloqueados: reclamo, queja, molesto, enojado, mal servicio, devolución, pago, transferencia, tarjeta, reembolso, urgente, demanda, alergia, embarazo, salud, médico
- Estos activan `canAutoReply = false`

### Safeguards Pendientes
- **CampaignComplianceAgent**: Validar opt-in, frecuencia, categoría, ventana, spam, unsubscribe
- **MetaReplyGuardAgent**: Decidir si auto-reply es seguro contra políticas Meta

### Conducta del Sistema
- No usar "Meta Tech Provider" si no está aprobado oficialmente
- Usar: "Integrado con WhatsApp Cloud API" o "Powered by WhatsApp Cloud API"
- No exponer tokens ni números de teléfono en frontend
- No hardcodear credenciales

### Archivos de Configuración Sensibles
- `WHATSAPP_ACCESS_TOKEN` → `.env.local`
- `WHATSAPP_BUSINESS_ACCOUNT_ID` → `.env.local`
- `WHATSAPP_PHONE_NUMBER_ID` → `.env.local`
- `WHATSAPP_GRAPH_API_VERSION` → `v25.0` en `.env.local`
- `BRAIN_ADMIN_KEY` → `.env.local`
- Google Drive OAuth → `claves/` (no subir a repo)

### No Exponer
- ❌ `claves/sendmestudio-maiteguerra-f74f866238c6.json`
- ❌ `claves/client_secret_*.json`
- ❌ `data/business-brain/drive-oauth.json`
- ❌ `data/business-brain/qr-tokens.json`
- ❌ `.env.local`
