#!/bin/bash
# ================================================================
# SendMe Studio — VPS Deploy Checklist (DRY RUN)
# ================================================================
# Este script SOLO imprime los pasos del deploy.
# NO ejecuta nada destructivo.
# ================================================================

set -e
echo ""
echo "========================================"
echo " SendMe Studio — VPS Deploy Checklist"
echo "========================================"
echo ""
echo "Target: app.sendmestudio.com (13.140.129.238)"
echo "Branch: main"
echo "Tag:    v0.1.0"
echo ""

# ── Paso 1 ──
echo "╔══════════════════════════════════════════╗"
echo "║ STEP 1 — Conectar por SSH               ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "  \$ ssh usuario@13.140.129.238"
echo ""
read -p "Presiona Enter para continuar..."

# ── Paso 2 ──
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║ STEP 2 — Backup del estado actual       ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "  TIMESTAMP=\$(date +%Y%m%d_%H%M%S)"
echo '  BACKUP_DIR="/opt/sendmestudio/backups/$TIMESTAMP"'
echo "  mkdir -p \$BACKUP_DIR"
echo "  docker exec sendmestudio_app pg_dump ... > db.sql 2>/dev/null"
echo "  cp -r data/ \$BACKUP_DIR/"
echo "  cp .env.production \$BACKUP_DIR/"
echo ""
read -p "Presiona Enter para continuar..."

# ── Paso 3 ──
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║ STEP 3 — Detener contenedor actual      ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "  cd /opt/sendmestudio/app"
echo "  docker compose down"
echo ""
read -p "Presiona Enter para continuar..."

# ── Paso 4 ──
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║ STEP 4 — Actualizar código desde GitHub ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "  cd /opt/sendmestudio/app"
echo "  git fetch --all --tags"
echo "  git checkout main"
echo "  git pull origin main"
echo ""
read -p "Presiona Enter para continuar..."

# ── Paso 5 ──
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║ STEP 5 — Verificar .env.production      ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "  ls -la .env.production"
echo "  grep DATABASE_URL .env.production"
echo '  ([ -f .env.production ] && echo "✅ .env existe") || echo "⚠ FALTA .env"'
echo ""
read -p "Presiona Enter para continuar..."

# ── Paso 6 ──
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║ STEP 6 — Docker build y up              ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "  docker compose build --no-cache"
echo "  docker compose up -d"
echo ""
read -p "Presiona Enter para continuar..."

# ── Paso 7 ──
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║ STEP 7 — Verificar funcionamiento       ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "  sleep 10"
echo "  docker ps"
echo "  curl -s localhost:3000/api/health"
echo "  docker logs sendmestudio_app --tail 20"
echo ""
read -p "Presiona Enter para continuar..."

# ── Paso 8 ──
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║ STEP 8 — Verificar Nginx                ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "  sudo nginx -t"
echo "  sudo nginx -s reload"
echo "  sudo systemctl status nginx"
echo ""
read -p "Presiona Enter para continuar..."

# ── Paso 9 ──
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║ STEP 9 — Verificar dominio público      ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "  curl -s https://app.sendmestudio.com/api/health"
echo ""

# ── Completado ──
echo ""
echo "========================================"
echo " ✅ Checklist completado (DRY RUN)"
echo "========================================"
echo ""
echo "Para ejecutar el deploy real, sigue"
echo "la guía completa en:"
echo "  docs/VPS_DEPLOY_RUNBOOK.md"
echo ""
echo "Rollback procedure:"
echo "  docs/ROLLBACK.md"
echo ""
exit 0
