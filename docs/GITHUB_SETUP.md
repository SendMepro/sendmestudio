# ================================================================
# SendMe Studio — Guía de Configuración GitHub
# ================================================================
# Fecha: Junio 2026
# Versión: v0.1.0
# ================================================================

## Prerrequisitos

- [ ] Tener una cuenta en GitHub (github.com)
- [ ] Git instalado localmente (verificar con `git --version`)
- [ ] Acceso a la terminal del proyecto

---

## 1. Crear Repositorio en GitHub

1. Ir a [github.com/new](https://github.com/new)
2. **Repository name**: `sendmestudio`
3. **Description**: `SendMe Studio — Plataforma multi-tenant SaaS para salones de belleza`
4. **Visibility**: `Private` (recomendado para producción)
5. **NO** inicializar con README, .gitignore ni license (ya tenemos todo)
6. Click **Create repository**

---

## 2. Conectar Remote Origin

```bash
# Desde la raíz del proyecto
git remote add origin https://github.com/TU_USUARIO/sendmestudio.git
```

> Reemplazar `TU_USUARIO` con el nombre de usuario de GitHub.

---

## 3. Push de Ramas Principales

```bash
# Push de main
git push origin main

# Push de develop
git push origin develop
```

> Nota: Si el repositorio no está vacío, usar `git push -u origin main` en el primer push.

---

## 4. Push de Tags

```bash
# Push del tag v0.1.0
git push origin v0.1.0
```

---

## 5. Protección de Rama `main`

En GitHub, ir a: **Settings > Branches > Add branch protection rule**

Configurar:

| Regla | Valor |
|-------|-------|
| Branch name pattern | `main` |
| Require a pull request before merging | ✅ |
| Require approvals | 1 |
| Dismiss stale pull request approvals when new commits are pushed | ✅ |
| Require status checks to pass before merging | ✅ |
| Require branches to be up to date | ✅ |
| Status checks | `CI / build` (del workflow CI) |
| Require conversation resolution before merging | ✅ |
| Do not allow bypassing the above settings | ✅ |

---

## 6. Pull Request Obligatorio

**Flujo de trabajo para cambios:**

```mermaid
graph LR
    A[feature/nueva-funcionalidad] -->|Pull Request| B[develop]
    B -->|Pull Request (release)| C[main]
    C -->|Tag| D[v*.*.*]
```

**Reglas:**

1. **Nunca** hacer push directo a `main`
2. Todo cambio pasa primero por `develop`
3. Pull Request hacia `develop` requiere al menos 1 approval
4. Pull Request hacia `main` solo desde `develop` (preparación de release)
5. Cada release en `main` debe tener un tag semántico

---

## 7. Workflow CI/CD

El archivo `.github/workflows/ci.yml` ya está configurado y se ejecutará automáticamente en:

- Push a `main` y `develop`
- Pull Request hacia `main` y `develop`

**Jobs del pipeline:**

1. **Install**: `npm ci`
2. **Lint / Type Check**: `tsc --noEmit`
3. **Build**: `npm run build`

---

## 8. Secrets de GitHub (repositorio > Settings > Secrets and variables > Actions)

| Secret | Descripción |
|--------|-------------|
| `DATABASE_URL` | URL de conexión PostgreSQL |
| `NEXT_PUBLIC_SUPABASE_URL` | URL de Supabase project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `WHATSAPP_ACCESS_TOKEN` | Token de acceso WhatsApp Cloud API |
| `WHATSAPP_PHONE_NUMBER_ID` | ID de número de WhatsApp |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | ID de cuenta de negocio WhatsApp |
| `DEEPSEEK_API_KEY` | API key de DeepSeek |
| `NEXT_PUBLIC_BASE_URL` | URL base de la aplicación |
| `ENCRYPTION_KEY` | Clave de encriptación para tokens en DB |

---

## 9. Configuración Local Adicional

```bash
# Verificar remoto
git remote -v

# Verificar ramas remotas
git branch -r

# Verificar tags
git tag -l
```

---

## Resumen de Comandos

```bash
# Primer push
git remote add origin https://github.com/TU_USUARIO/sendmestudio.git
git push -u origin main
git push -u origin develop
git push origin v0.1.0

# Flujo diario
git checkout develop
git pull origin develop
git checkout -b feature/mi-cambio
# ... trabajar ...
git add .
git commit -m "descripcion"
git push -u origin feature/mi-cambio
# Crear PR en GitHub hacia develop
```
