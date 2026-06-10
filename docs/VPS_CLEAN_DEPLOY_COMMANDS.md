# ================================================================
# SendMe Studio — Plan de Limpieza y Deploy VPS
# ================================================================
# Versión: v0.1.0
# Fecha: Junio 2026
# Contexto: Reemplazar legado (salon_belleza_app) por repo oficial
# Repo: https://github.com/SendMePro/sendmestudio.git
# ================================================================

## Resumen de la operación

| Item | Valor actual | Valor nuevo |
|------|-------------|-------------|
| Ruta app | `/opt/sendmestudio/app` (no es git) | `/opt/sendmestudio/app` (git clone) |
| Contenedor | `salon_belleza_app_1` | `sendmestudio_app` |
| Imagen | `salon_belleza_app:latest` | `sendmestudio_app:latest` |
| Puerto | `3000:3000` | `3000:3000` (sin cambios) |
| Origen | Código manual/tar.gz | GitHub: `main` |
| Docker Compose | No existe | `docker-compose.yml` del repo |

---

## 1. Backup del estado actual

```bash
# Crear directorio de backups
mkdir -p /opt/sendmestudio/backups

# Mover la carpeta app actual a backups con timestamp
mv /opt/sendmestudio/app /opt/sendmestudio/backups/app-manual-legacy-$(date +%Y%m%d-%H%M%S)

# Verificar el backup
ls -la /opt/sendmestudio/backups/
```

**Resultado esperado:**
- `/opt/sendmestudio/app` ya no existe
- `/opt/sendmestudio/backups/app-manual-legacy-20260610-XXXXXX/` contiene el código anterior

---

## 2. Detener contenedor legacy

```bash
# Ir al backup (la ruta anterior de app)
cd /opt/sendmestudio/backups/app-manual-legacy-*

# Si existe docker-compose, hacer down
if [ -f docker-compose.yml ]; then
  docker compose down
fi

# Forzar stop del contenedor legacy por nombre
docker stop salon_belleza_app_1 2>/dev/null || echo "Contenedor salon_belleza_app_1 no encontrado"

# Eliminar el contenedor legacy
docker rm salon_belleza_app_1 2>/dev/null || echo "Contenedor ya eliminado"

# Verificar que no quede nada
docker ps | grep salon_belleza || echo "✅ No hay contenedores legacy activos"
```

---

## 3. Clonar repositorio oficial

```bash
# Clonar repo en la ruta final
git clone https://github.com/SendMePro/sendmestudio.git /opt/sendmestudio/app

# Ir a la ruta
cd /opt/sendmestudio/app

# Pararse en la rama de producción
git checkout main

# Verificar
git log --oneline -3
git branch
```

**Resultado esperado:**
- `/opt/sendmestudio/app` es un repositorio Git
- En `main`, commit más reciente
- 696+ archivos trackeados

---

## 4. Crear / Verificar .env.production

### ⚠️ IMPORTANTE: .env.production NO está versionado en Git

Debe crearse manualmente en el VPS con las variables reales de producción.

### Opción A — Copiar desde backup legacy

```bash
cp /opt/sendmestudio/backups/app-manual-legacy-*/.env /opt/sendmestudio/app/.env.production
# O
cp /opt/sendmestudio/backups/app-manual-legacy-*/.env.production /opt/sendmestudio/app/.env.production
```

### Opción B — Copiar desde .env.production.template del repo

```bash
cd /opt/sendmestudio/app
cp .env.production.template .env.production
nano .env.production
```

### Opción C — Crear desde SCP local

```bash
# Desde tu máquina local:
# scp .env.production root@13.140.129.238:/opt/sendmestudio/app/.env.production
```

### Variables requeridas en .env.production

```
# Base de datos
DATABASE_URL=postgresql://usuario:password@localhost:5432/sendmestudio

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx

# WhatsApp Cloud API
WHATSAPP_ACCESS_TOKEN=EAAXxxxx
WHATSAPP_PHONE_NUMBER_ID=123456789
WHATSAPP_BUSINESS_ACCOUNT_ID=987654321
WHATSAPP_VERIFY_TOKEN=token_personalizado

# DeepSeek AI
DEEPSEEK_API_KEY=sk-xxxxx

# App URL
NEXT_PUBLIC_BASE_URL=https://app.sendmestudio.com

# Encriptación
ENCRYPTION_KEY=clave_de_32_caracteres_abcdefghijklmnopq
```

### Verificación post-creación

```bash
cd /opt/sendmestudio/app
ls -la .env.production
grep -c "=" .env.production
```

---

## 5. Construir imagen Docker

```bash
cd /opt/sendmestudio/app

# Build sin cache para imagen limpia
docker compose build --no-cache

# Verificar que la imagen se creó
docker images | grep sendmestudio
```

**Resultado esperado:**
- Imagen `sendmestudio_app:latest` creada
- Imagen `salon_belleza_app:latest` (vieja) aún existe

---

## 6. Levantar contenedor

```bash
cd /opt/sendmestudio/app

# Levantar en background
docker compose up -d

# Verificar contenedor activo
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"

# Resultado esperado:
# NAMES              IMAGE                          STATUS         PORTS
# sendmestudio_app   sendmestudio_app:latest        Up X minutes   0.0.0.0:3000->3000/tcp
```

---

## 7. Verificar funcionamiento

```bash
# Esperar a que la app inicie
sleep 15

# 7a. Ver logs de arranque
docker logs sendmestudio_app --tail=100

# 7b. Health check interno (desde VPS)
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3000
# Debe: HTTP 200

# 7c. Health endpoint
curl -s http://localhost:3000/api/health | head -20

# 7d. Verificar que Nginx sigue funcionando
sudo nginx -t
sudo systemctl status nginx --no-pager | head -10

# 7e. Verificar dominio público
curl -s -o /dev/null -w "HTTPS %{http_code}\n" https://app.sendmestudio.com
# Debe: HTTPS 200  (o 302 si redirige al login)

# 7f. Verificar SSL
curl -sI https://app.sendmestudio.com | grep -i "strict-transport-security\|x-frame-options"
```

---

## 8. Post-deploy: limpiar imágenes legacy (opcional)

```bash
# Listar imágenes viejas
docker images | grep salon_belleza

# Eliminar imagen legacy (solo si todo funciona bien)
# docker rmi salon_belleza_app:latest
```

---

## 9. Rollback (si algo falla)

```bash
# 9a. Detener el nuevo contenedor
cd /opt/sendmestudio/app
docker compose down

# 9b. Eliminar el clon del repo
rm -rf /opt/sendmestudio/app

# 9c. Restaurar el backup legacy
mv /opt/sendmestudio/backups/app-manual-legacy-* /opt/sendmestudio/app

# 9d. Reconstruir y levantar
cd /opt/sendmestudio/app
docker compose up -d --build

# 9e. Verificar
docker ps
curl -s http://localhost:3000
```

---

## 10. Verificación final del ecosistema

```bash
echo "===== VERIFICACIÓN FINAL ====="
echo ""
echo "1. Docker containers:"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "2. Git status:"
git -C /opt/sendmestudio/app status --short
echo ""
echo "3. Git branch:"
git -C /opt/sendmestudio/app branch
echo ""
echo "4. Espacio en disco:"
df -h /opt/sendmestudio
echo ""
echo "5. Nginx:"
sudo nginx -t 2>&1 | grep -o "syntax is ok\|test is successful\|FAILED"
echo ""
echo "6. app.sendmestudio.com:"
curl -s -o /dev/null -w "%{http_code}" https://app.sendmestudio.com
echo ""
echo "✅ Listo."
```

---

## Checklist resumido

| # | Paso | Comando |
|---|------|---------|
| 1 | Backup | `mv /opt/sendmestudio/app /opt/sendmestudio/backups/app-manual-legacy-$(date +%Y%m%d-%H%M%S)` |
| 2 | Stop legacy | `docker stop salon_belleza_app_1 && docker rm salon_belleza_app_1` |
| 3 | Clone | `git clone https://github.com/SendMePro/sendmestudio.git /opt/sendmestudio/app` |
| 4 | Branch | `cd /opt/sendmestudio/app && git checkout main` |
| 5 | .env | Copiar/crear `.env.production` manualmente |
| 6 | Build | `docker compose build --no-cache` |
| 7 | Up | `docker compose up -d` |
| 8 | Verify | `docker ps && curl localhost:3000` |
| 9 | Nginx | `sudo nginx -t && sudo systemctl status nginx` |
| 10 | Public | `curl https://app.sendmestudio.com` |

---

## Tiempo estimado

- Backup: 1 min
- Stop legacy: 1 min
- Clone: 2 min
- .env: 5 min
- Build: 5-10 min
- Verify: 2 min
- **Total: ~15-20 minutos**
