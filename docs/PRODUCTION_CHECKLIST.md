# ================================================================
# SendMe Studio — Production Readiness Checklist
# ================================================================

## GitHub

- [ ] Repositorio creado en GitHub
- [ ] Remote configurado: `git remote add origin git@github.com:tu-org/sendmestudio.git`
- [ ] Rama `main` protegida contra push directo (settings)
- [ ] Rama `develop` protegida (opcional)
- [ ] Pull Request requerido para merge a `main`
- [ ] Branch protection rules: requerir CI passing + review
- [ ] Tags de versión: `git tag v0.1.0 && git push origin v0.1.0`

## CI/CD

- [ ] GitHub Actions workflow CI funcionando (`.github/workflows/ci.yml`)
- [ ] Pipeline pasa en push a `develop` y `main`
- [ ] Pipeline pasa en PRs contra `main` y `develop`
- [ ] Secrets de GitHub configurados (si aplica para deploy automático)

## Docker

- [ ] `Dockerfile` revisado y optimizado (`npm ci --omit=dev`, multi-stage)
- [ ] `.dockerignore` actualizado (node_modules, .next, .git, .env*, etc.)
- [ ] `docker-compose.yml` con `container_name: sendmestudio_app`
- [ ] Imagen build local: `docker compose build`
- [ ] Contenedor iniciado: `docker compose up -d`
- [ ] Health check funcionando en `http://localhost:3000`
- [ ] Variables de entorno pasadas correctamente

## SSL / Nginx

- [ ] Certificado SSL activo (Let's Encrypt / Certbot)
- [ ] Nginx configurado para `app.sendmestudio.com`
- [ ] Proxy pass a `http://127.0.0.1:3000`
- [ ] WebSocket support configurado (Upgrade headers)
- [ ] Redirección HTTP → HTTPS
- [ ] Rate limiting configurado
- [ ] `NEXT_PUBLIC_BASE_URL=https://sendmestudio.com` en `.env`

## Multi-Tenant

- [ ] Prisma schema: todos los modelos tienen `tenantId`
- [ ] API routes: todas usan `requireTenant()` o `requireSuperAdmin()`
- [ ] Páginas client-side verifican tenant antes de mostrar datos
- [ ] `lib/admin-helper.ts` resuelve tenantId desde DB (no solo app_metadata)
- [ ] Fallback a app_metadata si DB falla
- [ ] Licencias: `checkLicenseBlock()` implementado
- [ ] No hay endpoints donde un tenant pueda acceder a datos de otro

## Backups

- [ ] Backup automático de base de datos (Supabase: Point-in-Time Recovery)
- [ ] Backup de `.env` (secreto, fuera del repo)
- [ ] Backup de `business-brain/` y `data/` (datos de negocio)
- [ ] Estrategia de restore documentada

## Seguridad

- [ ] Audit: No hay secretos en el código fuente
- [ ] Audit: No hay API keys hardcodeadas
- [ ] Audit: CORS configurado en API routes sensibles
- [ ] Audit: Input validation en endpoints que reciben datos
- [ ] Audit: Rate limiting en endpoints públicos (webhooks)
- [ ] Audit: `tsc --noEmit` pasa con 0 errores
- [ ] Audit: npm audit: 0 vulnerabilidades críticas

## Monitoreo

- [ ] Logs de Docker configurados (rotación)
- [ ] Health checks del sistema operativos (agentes)
- [ ] Alertas de licencia próxima a expirar
- [ ] Monitoreo de uso de IA (costos por tenant)

## Pre-lanzamiento

- [ ] DNS configurado: `sendmestudio.com` → VPS IP
- [ ] DNS configurado: `app.sendmestudio.com` → VPS IP
- [ ] Email transaccional configurado (si aplica)
- [ ] Términos de servicio y política de privacidad publicados
- [ ] Demo credentials funcionales (si aplica)
