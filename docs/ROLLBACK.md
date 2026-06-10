# ================================================================
# SendMe Studio — Rollback Procedure
# ================================================================
# VersiOn: v0.1.0
# Fecha: Junio 2026
# ================================================================

## Rollback por Tag (v0.1.0)

### Paso 1 — Conectar al VPS

```bash
ssh usuario@13.140.129.238
```

### Paso 2 — Ir al directorio de la app

```bash
cd /opt/sendmestudio/app
```

### Paso 3 — Backup del estado actual (por si acaso)

```bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/sendmestudio/rollback-backups/$TIMESTAMP"
mkdir -p "$BACKUP_DIR"
docker compose down
cp .env.production "$BACKUP_DIR/"
echo "Backup previo en: $BACKUP_DIR"
```

### Paso 4 — Checkout al tag de rollback

```bash
git fetch --all --tags
git checkout v0.1.0
```

> ⚠ **Importante**: `git checkout v0.1.0` pone el repo en estado **detached HEAD**.
> Para volver a main después del rollback:
> `git checkout main`

### Paso 5 — Restaurar .env.production (si se perdió)

```bash
cp /opt/sendmestudio/backups/latest/.env.production ./.env.production
# O desde backup manual.
```

### Paso 6 — Construir y levantar

```bash
docker compose build --no-cache
docker compose up -d
```

### Paso 7 — Verificar

```bash
sleep 10
docker ps
curl -s localhost:3000/api/health
```

---

## Rollback por Commit EspecÍfico

```bash
cd /opt/sendmestudio/app

# Backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p "/opt/sendmestudio/rollback-backups/$TIMESTAMP"
docker compose down

# Checkout al commit deseado
git checkout <commit-hash>

# Build y deploy
docker compose build --no-cache
docker compose up -d
```

---

## Rollback de Base de Datos

```bash
# Restore desde backup local
pg_restore -h localhost -U sendme_user -d sendmestudio \
  --clean --if-exists \
  /opt/sendmestudio/backups/20260610_030000/sendmestudio_20260610_030000.dump
```

---

## Post-Rollback

```bash
# Volver a main
git checkout main

# Hacer merge del hotfix
git merge <hotfix-branch>

# Pushear
git push origin main
```

---

## Resumen

| Escenario | Comando | Tiempo estimado |
|-----------|---------|----------------|
| Rollback a tag | `git checkout v0.1.0` + build | 5 min |
| Rollback a commit | `git checkout <hash>` + build | 5 min |
| Rollback DB | `pg_restore` | Variable |
| Volver a main | `git checkout main` | 1 min |
