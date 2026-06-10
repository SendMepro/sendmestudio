# ================================================================
# SendMe Studio — Deployment Guide
# ================================================================

## Información del proyecto

| Ítem | Valor |
|------|-------|
| Proyecto | SendMe Studio |
| Local | `D:\SENDMEPRO\PROYECTOS\SENDME STUDIO\sendmestudio` |
| VPS | `/opt/sendmestudio/app` |
| Container | `sendmestudio_app` |
| Image | `sendmestudio_app:latest` |
| Dominio | `sendmestudio.com` |
| App | `app.sendmestudio.com` |

---

## Requisitos

- Node.js 20+ (local / CI)
- Docker + Docker Compose (producción)
- PostgreSQL 15+ (Supabase)
- Nginx (reverse proxy)

---

## Desarrollo local

```bash
# 1. Clonar repositorio
git clone git@github.com:tu-organizacion/sendmestudio.git
cd sendmestudio

# 2. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con valores reales

# 3. Instalar dependencias
npm install

# 4. Generar Prisma Client
npm run db:generate

# 5. Iniciar servidor de desarrollo
npm run dev
```

---

## Build de producción

```bash
# TypeScript check
npx tsc --noEmit

# Build Next.js
npm run build

# El output se genera en .next/standalone
```

---

## Deploy con Docker (VPS)

```bash
# 1. Conectarse al VPS
ssh user@sendmestudio.com

# 2. Ir al directorio de la aplicación
cd /opt/sendmestudio/app

# 3. Obtener última versión
git pull origin main

# 4. Construir imagen (sin cache para build limpio)
docker compose build --no-cache

# 5. Iniciar contenedor
docker compose up -d

# 6. Verificar logs
docker compose logs -f
```

---

## Configuración de Nginx (VPS)

```nginx
# sendmestudio.com — App
server {
    listen 443 ssl;
    server_name app.sendmestudio.com;

    ssl_certificate     /etc/letsencrypt/live/app.sendmestudio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.sendmestudio.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Variables de entorno requeridas en producción (`.env`):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
DIRECT_URL=
DEEPSEEK_API_KEY=
META_WHATSAPP_TOKEN=
META_PHONE_NUMBER_ID=
META_BUSINESS_ACCOUNT_ID=
META_VERIFY_TOKEN=
NEXT_PUBLIC_BASE_URL=https://sendmestudio.com
```

---

## Actualización

```bash
# Desde el VPS
cd /opt/sendmestudio/app
git pull
docker compose build --no-cache
docker compose up -d
```

---

## Rollback

```bash
# Revertir al commit anterior
cd /opt/sendmestudio/app
git revert HEAD --no-edit
docker compose build --no-cache
docker compose up -d
```
