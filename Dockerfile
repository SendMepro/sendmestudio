# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Solo copiar package files primero para cachear capa de dependencias
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copiar el resto del código
COPY . .

# Build de Next.js
RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copiar build desde builder
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Exponer puerto
EXPOSE 3000

# Iniciar servidor
CMD ["node", "server.js"]
