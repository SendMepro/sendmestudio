# ================================================================
# SendMe Studio — Release Notes v0.1.0
# ================================================================

## v0.1.0 — Initial Release

Fecha: Junio 2026

### Funcionalidades principales

- **Multi-Tenant SaaS**: Arquitectura multi-tenant completa con aislamiento de datos por tenantId en Prisma y validación en todas las API routes via `requireTenant()`.
- **WhatsApp Cloud API**: Integración con Meta WhatsApp Business Platform. Webhook entrante, envío de mensajes, reacciones, y gestión de conversaciones multi-tenant.
- **AI Router**: Sistema de enrutamiento inteligente que distribuye peticiones entre proveedores (DeepSeek, Xiaomi MiMo) según la tarea.
- **DeepSeek Integration**: Proveedor principal de IA para respuestas de WhatsApp, análisis de clientes y generación de contenido.
- **Customer Memory**: Memoria persistente por cliente con perfil, señales de compra y metadatos para personalización AI.
- **Dashboard**: Panel de control con KPIs, métricas en tiempo real, health checks del sistema y visualización de agentes.
- **CRM**: Gestión completa de clientes con historial de servicios, segmentación, etiquetas y campañas.
- **Campaigns**: Sistema de campañas de marketing con segmentación de audiencias, programación y tracking de resultados.
- **Business Center**: Inventario, ventas de productos y comisiones con tracking completo.
- **Brain (Knowledge Base)**: Sistema de conocimiento empresarial con FAQ, horarios, servicios, estilistas y reglas AI por tenant.
- **Google Drive Integration**: Sincronización de activos del negocio con Google Drive.
- **Agent System**: Ecosistema de agentes inteligentes (Supervisor, HealthCheck, Recovery, Inspector, etc.) con EventBus y ciclo de vida gestionado.
- **Analytics**: Analytics en tiempo real con configuraciones por tenant, métricas diarias y live dashboard.

### Stack técnico

- **Frontend**: Next.js 16.2.6 (App Router), React 19, TypeScript 5, Framer Motion, Lucide React
- **Backend**: Next.js API Routes (Node.js runtime), Prisma ORM
- **Auth**: Supabase SSR (authentication + session management)
- **Database**: PostgreSQL (Supabase) con schema multi-tenant
- **Container**: Docker (multi-stage build, Alpine)
- **CI/CD**: GitHub Actions

### Notas de deploy

Ver `docs/DEPLOYMENT.md` para instrucciones completas.
