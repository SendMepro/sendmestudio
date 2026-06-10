# INSPECTION_REPORT.md

## 1. Current Project Structure

```
Salon_Belleza/
├── project-memory/        ← [NUEVO] Sistema de memoria persistente
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Home / Dashboard (1390 líneas)
│   │   ├── page.module.css
│   │   ├── layout.tsx                  # Root layout
│   │   ├── globals.css
│   │   ├── inbox/
│   │   │   ├── page.tsx                # Messages CRM (4326+ líneas)
│   │   │   └── inbox.module.css
│   │   ├── campaigns/
│   │   │   ├── page.tsx                # Campaigns editor (2537+ líneas)
│   │   │   ├── campaigns.module.css
│   │   │   └── templateWorkflow.ts
│   │   ├── components/
│   │   │   ├── AppShell.tsx            # Layout con sidebar
│   │   │   ├── Sidebar.tsx             # Navegación principal
│   │   │   ├── AIBadge.tsx
│   │   │   ├── LiquidGlass.tsx
│   │   │   ├── sidebarUnreadStore.ts   # Store de mensajes no leídos
│   │   │   └── Sidebar.module.css
│   │   ├── api/                        # API routes (45 archivos)
│   │   │   ├── whatsapp/               # Integración WhatsApp Cloud API
│   │   │   ├── customers/              # CRUD clientes
│   │   │   ├── messages/               # Mensajes
│   │   │   ├── campaigns/              # Campañas
│   │   │   ├── knowledge/              # Knowledge Base
│   │   │   └── ... (25+ endpoints)
│   │   ├── salon-intelligence/         # [Futura sección Intelligence]
│   │   ├── studio-pulse/               # [Futura sección Pulse]
│   │   ├── brain-admin/                # Emotional Business Brain
│   │   ├── agenda/                     # Agenda diaria
│   │   ├── analytics/                  # Reportes
│   │   ├── contacts/                   # Contactos
│   │   └── ... (otras rutas)
│   ├── lib/
│   │   ├── serviceMatcher.ts           # Fuzzy matching de servicios
│   │   ├── liquidGL.js / .d.ts
│   │   └── googleDriveBrainStorage.ts
│   └── components/
│       ├── atelier/
│       │   ├── AIDrawer.tsx
│       │   ├── Composer.tsx
│       │   └── MessageBubble.tsx
│       └── ViewportDebugger.tsx
├── data/                               # Datos locales JSON/MD
│   ├── conversations/
│   ├── customers/
│   ├── knowledge/
│   ├── meta-templates/
│   ├── business-brain/
│   ├── campaign-assets/
│   ├── campaign-history/
│   └── customer-assets/
├── business-brain/                     # Memoria emocional procesada
├── claves/                             # Credenciales Google Drive OAuth
├── docs/
├── public/
└── wsp/                                # Archivos de contacto
```

## 2. Current Home Files
- `src/app/page.tsx` - Dashboard completo (1390 líneas)
  - Muestra citas del día con inteligencia de cliente
  - Perfiles emocionales, LTV, recomendaciones IA
  - Widgets: feed de prioridad, oportunidades, métricas, citas próximas
  - Sin división en módulos - todo en un archivo
- `src/app/page.module.css` - Estilos del Home
- `src/app/components/AIBadge.tsx` - Componente badge IA
- `src/app/components/AppShell.tsx` - Layout wrapper
- `src/app/components/Sidebar.tsx` - Navegación
- `src/app/layout.tsx` - Layout raíz

## 3. Current Messages Files
- `src/app/inbox/page.tsx` - CRM de mensajes (4326+ líneas - archivo grande)
  - Lista de conversaciones
  - Chat en tiempo real
  - Modo Manual / IA
  - Panel de soporte conversacional
  - Tapiz visual
- `src/app/inbox/inbox.module.css`
- `src/app/api/whatsapp/webhook/route.ts` - Webhook Meta
- `src/app/api/whatsapp/sender.ts` - Envío de mensajes
- `src/app/api/whatsapp/ai-concierge.ts` - IA conversacional (intent detection + replies)
- `src/app/api/whatsapp/store.ts` - Almacenamiento local JSON
- `src/app/api/whatsapp/normalizer.ts` - Normalización de mensajes
- `src/app/api/whatsapp/realtime.ts` - Eventos en tiempo real
- `src/app/api/whatsapp/customer-assets.ts` - Assets de clientes
- `src/app/api/whatsapp/mode/route.ts` - Cambio de modo Manual/IA
- `src/app/api/whatsapp/send/route.ts` - API de envío
- `src/app/api/whatsapp/reaction/route.ts` - Reacciones
- `src/app/components/sidebarUnreadStore.ts` - Store de contador no leídos
- `src/app/api/messages/route.ts` - API de mensajes

## 4. Current Campaigns Files
- `src/app/campaigns/page.tsx` - Editor de campañas (2537+ líneas)
  - Creación de campañas con narrativa
  - Audience Builder
  - Campaign Safety Gate
  - Consent Guard
  - Test Send
  - Sidebar de campañas guardadas
- `src/app/campaigns/campaigns.module.css`
- `src/app/campaigns/templateWorkflow.ts` - Flujo de plantillas Meta
- `src/app/api/campaign-assets/route.ts`
- `src/app/api/campaign-history/route.ts`
- `src/app/api/meta-templates/route.ts`

## 5. Current Meta/WhatsApp Integration
- **Webhook**: `src/app/api/whatsapp/webhook/route.ts`
  - Verificación webhook (GET)
  - Recepción de mensajes (POST)
  - Auto-reply con AI Concierge
  - Detección de modo Manual/IA
- **Sender**: `src/app/api/whatsapp/sender.ts`
  - Envío a Meta Graph API v25.0
  - Manejo de errores
- **AI Concierge**: `src/app/api/whatsapp/ai-concierge.ts`
  - Detección de intenciones (balayage, color, corte, agenda, etc.)
  - Safeguard patterns (reclamos, quejas, devoluciones, salud)
  - DeepSeek integration (opcional)
- **Store**: `src/app/api/whatsapp/store.ts`
  - Almacenamiento JSON local
  - CRUD de mensajes
  - Analytics events
- **Config**: Variables de entorno
  - `WHATSAPP_ACCESS_TOKEN`
  - `WHATSAPP_BUSINESS_ACCOUNT_ID`
  - `WHATSAPP_PHONE_NUMBER_ID`
  - `WHATSAPP_GRAPH_API_VERSION` (v25.0)

## 6. Current Data Flows
```
WhatsApp → Webhook → normalizeMessage → AI Concierge → Draft → Manual/IA decision → Send → WhatsApp
                                                                        ↓
                                                              saveWhatsAppMessage() → data/conversations/messages.json
                                                                        ↓
                                                              recordAnalyticsEvent() → data/conversations/analytics-events.json

Campaign → Audience Builder → Safety Gate → Consent Guard → Test Send → WhatsApp
                                                                        ↓
                                                              saveCampaignTemplate() → data/meta-templates/templates.json

Home → fetch data → readCustomers() + readConversations() + render dashboard
```

## 7. Current Route Structure
- `/` - Home/Dashboard
- `/inbox` - Messages CRM
- `/campaigns` - Campaigns
- `/contacts` - Contactos
- `/agenda` - Agenda
- `/analytics` - Reportes
- `/brain-admin` - Emotional Business Brain
- `/salon-intelligence` - Inteligencia (en desarrollo)
- `/studio-pulse` - Pulso Studio (en desarrollo)
- `/settings` - Ajustes
- `/settings/atelier-memory` - Inventario
- `/knowledge` - Base de conocimiento
- `/brain-upload` - Subida Brain
- `/mobile-upload` - Subida móvil
- `/clients` - Muses/Clientes
- `/editorial` - Editorial
- `/ventas` - Ventas

## 8. Current State Management
- Sin store global (No Redux, Zustand, Context global)
- Estado local con `useState`, `useRef` en cada página
- Sidebar: `sidebarUnreadStore.ts` con `useSyncExternalStore`
- Persistencia: Archivos JSON en `/data/` con `fs.promises`
- Sin base de datos

## 9. Existing Backend/API/Service Files
### API Routes (26 endpoints)
- `api/analytics/route.ts` - Eventos de analytics
- `api/appointments/route.ts` - Citas
- `api/booking/availability/route.ts` - Disponibilidad
- `api/brain-admin/*` - Admin Brain (audit, drive, events, queue, session, storage, upload, voice)
- `api/campaign-assets/route.ts` - Assets de campañas
- `api/campaign-history/route.ts` - Historial de campañas
- `api/clients/route.ts` - Clientes
- `api/customer-assets/route.ts` - Assets de clientes
- `api/customers/*` - CRUD clientes (import, segments, store)
- `api/google-drive/*` - Google Drive (auth, callback, status)
- `api/knowledge/*` - Knowledge Base (faqs, services, stylists, store)
- `api/messages/route.ts` - Mensajes
- `api/meta-templates/route.ts` - Plantillas Meta
- `api/theme/tapices/route.ts` - Tapices visuales
- `api/whatsapp/*` - WhatsApp (events, messages, mode, reaction, send, webhook)

## 10. Missing Agents (vs target architecture)
| Agente | Estado |
|--------|--------|
| EmotionalSalonOrchestrator | ❌ No existe |
| AgentRegistry | ❌ No existe |
| AgentInspector | ❌ No existe |
| CuratorAgent | ❌ No existe |
| RecoveryAgent | ❌ No existe |
| HealthCheckAgent | ❌ No existe |
| HomeOrchestratorAgent | ❌ No existe |
| HomeInspectorAgent | ❌ No existe |
| HomeDataSourceAgent | ❌ No existe |
| HomeHealthCheckAgent | ❌ No existe |
| HomeLearningAgent | ❌ No existe |
| ReceptionOrchestratorAgent | ❌ No existe |
| ConversationInspectorAgent | ❌ No existe |
| IntentDetectionAgent | ❌ No existe |
| DraftResponseAgent | ❌ No existe |
| MetaReplyGuardAgent | ❌ No existe |
| ConversationMemoryAgent | ❌ No existe |
| CampaignOrchestratorAgent | ❌ No existe |
| AudienceAgent | ❌ No existe |
| TemplateValidationAgent | ❌ No existe |
| CampaignComplianceAgent | ❌ No existe |
| DeliveryMonitorAgent | ❌ No existe |
| CampaignLearningAgent | ❌ No existe |

## 11. Proposed Agent Architecture
Ver `AGENT_MAP.md` y `SAFE_REFACTOR_PLAN.md`

## 12. Proposed Folder Structure
Ver instrucciones en `AGENT_ARCHITECTURE_MAP.md`

## 13. Step-by-Step Safe Refactor Plan
Ver `SAFE_REFACTOR_PLAN.md`

## 14. Checkpoint and Rollback Strategy
- Checkpoint 0: Estado original (actual)
- Cada fase crea un nuevo checkpoint
- RecoveryAgent usa CHECKPOINTS.md para restaurar
- Rollback: copiar archivos desde checkpoint o usar git

## 15. What Should Be Modified First
1. Crear `src/agents/system/` (sin modificar código existente)
2. Crear `src/skills/emotional-salon/`
3. Crear agentes de Home
4. Crear agentes de Messages
5. Crear agentes de Campaigns

## 16. What Should NOT Be Touched Yet
- `src/app/page.tsx` (Home) - No modificar aún
- `src/app/inbox/page.tsx` (Messages) - No modificar aún
- `src/app/campaigns/page.tsx` (Campaigns) - No modificar aún
- `src/app/api/whatsapp/*` - No tocar integración Meta
- `data/` - No tocar datos existentes
- `claves/` - No tocar credenciales
- `business-brain/` - No tocar memoria emocional
