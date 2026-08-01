# ──────────────────────────────────────────────────────────────────────────────
# Predicta AI — Backend NestJS (multi-stage)
# Build context: repo root (docker-compose build context: .)
# ──────────────────────────────────────────────────────────────────────────────

# ── Stage 1: base — node 22 + pnpm 10 ────────────────────────────────────────
FROM node:22-alpine AS base
# OpenSSL requerido por el query engine binario de Prisma en Alpine (musl libc)
RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@10 --activate

# ── Stage 2: builder — instala deps, genera Prisma client, compila TS ─────────
FROM base AS builder
WORKDIR /app

# Manifiestos primero → mejor cache de capas Docker
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/
# Schema necesario antes del install porque postinstall corre "prisma generate"
COPY apps/backend/prisma ./apps/backend/prisma

# Instala TODAS las deps (incluyendo devDeps; necesarias para nest build)
RUN pnpm install --frozen-lockfile --filter backend

# Copia código fuente, agentes y datasets
COPY apps/backend ./apps/backend

# Genera Prisma client antes de compilar TypeScript (evita errores de tipos)
RUN pnpm --filter backend exec prisma generate

# Compila NestJS → dist/
RUN pnpm --filter backend build

# Crea bundle de producción con node_modules PLANO (elimina symlinks de pnpm
# que romperían al copiar a otra imagen sin el store de pnpm)
RUN pnpm --filter backend deploy --prod --legacy /deploy

# ── Stage 3: runner — imagen mínima de producción ─────────────────────────────
FROM node:22-alpine AS runner

# openssl: requerido por Prisma query engine en Alpine
# dumb-init: reenvía señales UNIX al proceso Node correctamente
RUN apk add --no-cache openssl dumb-init

WORKDIR /app

# Node_modules de producción, planos y sin symlinks
COPY --from=builder /deploy/node_modules ./node_modules
COPY --from=builder /deploy/package.json ./package.json

# Artefactos de compilación y schema de Prisma
COPY --from=builder /app/apps/backend/dist       ./dist
COPY --from=builder /app/apps/backend/prisma     ./prisma

# Agentes (.md) y datos estáticos (dengue_context.json, etc.)
COPY --from=builder /app/apps/backend/agents     ./agents
COPY --from=builder /app/apps/backend/data       ./data

# Prisma CLI está en devDependencies; la instalamos globalmente para poder
# ejecutar "prisma migrate deploy" y "prisma generate" en producción.
RUN npm install -g prisma@5.22.0 --quiet

# Regenera el Prisma client para el OS de producción (Alpine linux, musl libc)
RUN prisma generate

ENV NODE_ENV=production
EXPOSE 3001

ENTRYPOINT ["dumb-init", "--"]

# IMPORTANTE: antes de desplegar por primera vez, crea las migraciones
# localmente con: pnpm --filter backend exec prisma migrate dev --name init
# Luego commitea la carpeta prisma/migrations/ al repositorio.
CMD ["sh", "-c", "prisma migrate deploy && node dist/main.js"]
