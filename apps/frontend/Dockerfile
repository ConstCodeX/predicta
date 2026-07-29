# ──────────────────────────────────────────────────────────────────────────────
# Predicta AI — Frontend Vite + React (multi-stage → Nginx)
# Build context: repo root (docker-compose build context: .)
# ──────────────────────────────────────────────────────────────────────────────

# ── Stage 1: builder — instala deps y compila Vite ────────────────────────────
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10 --activate

WORKDIR /app

# Manifiestos primero → mejor cache de capas Docker
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/frontend/package.json ./apps/frontend/

RUN pnpm install --frozen-lockfile --filter frontend

COPY apps/frontend ./apps/frontend

# Build Vite → dist/
RUN pnpm --filter frontend build

# ── Stage 2: runner — Nginx sirve los archivos estáticos ─────────────────────
FROM nginx:1.27-alpine AS runner

# Elimina la config default de Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Config personalizada (SPA fallback + proxy /api + gzip)
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Archivos estáticos compilados por Vite
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
