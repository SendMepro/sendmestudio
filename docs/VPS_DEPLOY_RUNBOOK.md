# ================================================================
# SendMe Studio — VPS Deploy Runbook
# ================================================================
# Versión: v0.1.0
# Fecha: Junio 2026
# Target: app.sendmestudio.com (13.140.129.238)
# ================================================================

## Prerrequisitos

### En VPS

- [ ] Docker + Docker Compose v2 instalados
- [ ] Git instalado
- [ ] Nginx instalado y configurado
- [ ] Certbot / SSL configurado para `app.sendmestudio.com`
- [ ] PostgreSQL (o acceso a RDS externo)
- [ ] Puerto 22 (SSH) abierto
- [ ] Puerto 80/443 (HTTP/HTTPS) abierto
- [ ] Usuario con sudo o en grupo docker

### En local

- [ ] Acceso SSH configurado (llave pública en VPS)
- [ ] Repositorio GitHub: `https://github.com/SendMePro/sendmestudio.git`
- [ ] Tag `v0.1.0` creado y pusheado
- [ ] `.env.production` listo (no versionado)

---

## 1. Conectar por SSH

```bash
ssh usuario@13.140.129.238
```

> Reemplazar `usuario` con el usuario del VPS (ej: `root`, `ubuntu`, `admin`).
> Si usas llave SSH: `ssh -i ~/.ssh/tu-llave usuario@13.140.129.238`

---

## 2. Backup del estado actual

```bash
# Crear backup con timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/sendmestudio/backups/$TIMESTAMP"
mkdir -p "$BACKUP_DIR"

# Backup de base de datos (si corre local)
docker exec sendmestudio_app pg_dump -U sendme_user sendmestudio \
  > "$BACKUP_DIR/db_$TIMESTAMP.sql" 2>/dev/null || \
  echo "⚠ No se pudo hacer dump de DB (puede ser externa)"

# Backup de archivos de datos
if [ -d /opt/sendmestudio/app/data ]; then
  cp -r /opt/sendmestudio/app/data "$BACKUP_DIR/data"
  echo "✅ Data backup: $BACKUP_DIR/data"
fi

# Backup de .env
if [ -f /opt/sendmestudio/app/.env.production ]; then
  cp /opt/sendmestudio/app/.env.production "$BACKUP_DIR/.env.production"
  echo "✅ .env.production backup: $BACKUP_DIR/.env.production"
fi

echo "Backup completo en: $BACKUP_DIR"
```

---

## 3. Detener contenedor actual

```bash
cd /opt/sendmestudio/app

# Detener contenedores
docker compose down

# Verificar que no quede nada corriendo
docker ps | grep sendmestudio || echo "✅ No hay contenedores sendmestudio activos"
```

---

## 4. Clonar o actualizar repositorio

### Si es la primera vez:

```bash
cd /opt/sendmestudio
git clone https://github.com/SendMePro/sendmestudio.git app
cd app
```

### Si ya existe:

```bash
cd /opt/sendmestudio/app
git fetch --all --tags

# En producción, apuntar a main
git checkout main
git pull origin main
```

---

## 5. Verificar .env.production

```bash
cd /opt/sendmestudio/app

# Verificar que existe
ls -la .env.production

# Verificar variables críticas
grep -E "^(DATABASE_URL|NEXT_PUBLIC_SUPABASE_URL|WHATSAPP_ACCESS_TOKEN|DEEPSEEK_API_KEY)" .env.production || \
  echo "⚠ FALTAN variables de entorno críticas"

# Verificar formato (no debe tener comillas alrededor de valores)
head -20 .env.production
```

> ⚠ **CRÍTICO**: `.env.production` NO debe estar versionado en Git.
> Debe copiarse manualmente al VPS por SCP o desde backup.

```bash
# Si no existe, copiarlo desde backup o SCP local:
# scp .env.production usuario@13.140.129.238:/opt/sendmestudio/app/.env.production
```

---

## 6. Construir y levantar con Docker

```bash
cd /opt/sendmestudio/app

# Construir imagen limpia (sin cache)
docker compose build --no-cache

# Levantar contenedores en background
docker compose up -d

# Verificar que el contenedor está corriendo
docker ps

# Ver logs de arranque
docker logs sendmestudio_app --tail 50
```

---

## 7. Verificar funcionamiento local

```bash
# Health check interno (desde VPS)
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health
# Debe responder: 200

# Página principal
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
# Debe responder: 200

# Si hay errores, revisar logs completos
docker logs sendmestudio_app --tail 100
```

---

## 8. Verificar Nginx

```bash
# Verificar sintaxis de nginx
sudo nginx -t

# Recargar nginx si se modificó configuración
sudo nginx -s reload

# Verificar que nginx está activo
sudo systemctl status nginx
```

---

## 9. Verificar dominio público

```bash
# Desde VPS (localhost a través de nginx)
curl -s -o /dev/null -w "%{http_code}" https://app.sendmestudio.com/api/health

# Ver resolución DNS
dig +short app.sendmestudio.com
# Debe responder: 13.140.129.238

# Verificar SSL
curl -sI https://app.sendmestudio.com | head -5
```

---

## 10. Verificación post-deploy (opcional, desde local)

```bash
# Probar desde tu máquina
curl -s -o /dev/null -w "%{http_code}" https://app.sendmestudio.com
# Debe: 200

# Health endpoint
curl -s https://app.sendmestudio.com/api/health

# Ver headers de seguridad
curl -sI https://app.sendmestudio.com | grep -i -E "x-frame|x-content|x-xss|strict-transport"
```

---

## Flujo completo (comandos en orden)

```bash
# === 1 ===
ssh usuario@13.140.129.238

# === 2 ===
# (ejecutar script de backup manualmente)

# === 3 ===
cd /opt/sendmestudio/app
docker compose down

# === 4 ===
git fetch --all --tags
git checkout main
git pull origin main

# === 5 ===
ls -la .env.production
grep DATABASE_URL .env.production

# === 6 ===
docker compose build --no-cache
docker compose up -d
docker ps

# === 7 ===
sleep 10
curl -s localhost:3000/api/health
docker logs sendmestudio_app --tail 20

# === 8 ===
sudo nginx -t
sudo systemctl status nginx

# === 9 ===
curl -s https://app.sendmestudio.com/api/health

echo "✅ Deploy completado"
```

---

## Resolución de problemas

### Error: `docker: command not found`
→ Instalar Docker: `sudo apt install docker.io docker-compose-v2`

### Error: `port 3000 already in use`
→ Verificar qué ocupa el puerto: `sudo lsof -i :3000` y detenerlo

### Error: `database connection refused`
→ Verificar DATABASE_URL en `.env.production`
→ Verificar que PostgreSQL esté accesible desde el VPS

### Error: `nginx: configuration test failed`
→ Revisar sintaxis: `sudo nginx -t`
→ Ver logs: `sudo tail -50 /var/log/nginx/error.log`

### Error: `SSL certificate expired`
→ Renovar: `sudo certbot renew`
→ Forzar: `sudo certbot --nginx -d app.sendmestudio.com`
