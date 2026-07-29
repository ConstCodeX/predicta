# Despliegue en Dokploy

Guía paso a paso para desplegar Predicta AI en un servidor con Dokploy conectado a GitHub.

---

## Requisitos previos

- Servidor con Dokploy instalado y accesible (con IP pública o dominio).
- Repositorio en GitHub con el código de este proyecto.
- API key de [Groq](https://console.groq.com) (gratuita).
- Migraciones de Prisma creadas **localmente** antes del primer despliegue:

```bash
# En tu máquina local, una sola vez:
pnpm --filter backend exec prisma migrate dev --name init

# Commitea las migraciones y sube al repo:
git add apps/backend/prisma/migrations/
git commit -m "feat: add initial prisma migration"
git push origin main
```

---

## Método 1 — Docker Compose (recomendado)

Dokploy despliega los tres servicios (PostgreSQL, backend, frontend) desde el
`docker-compose.yml` de la raíz con una sola configuración.

### Paso 1 — Crear el proyecto

1. Entra al panel de Dokploy → **Projects** → **Create Project**.
2. Nombre: `predictape` (o el que prefieras).

### Paso 2 — Añadir servicio Compose

Dentro del proyecto creado:

1. Clic en **Create Service** → **Compose**.
2. Selecciona **GitHub** como proveedor.
3. Conecta tu cuenta de GitHub si no lo has hecho.
4. Selecciona el repositorio `predictape`.
5. Rama: `main`.
6. **Compose Path**: `docker-compose.yml` (raíz del repo).
7. Clic en **Create**.

### Paso 3 — Variables de entorno

En la pestaña **Environment** del servicio Compose, añade las siguientes variables
(Dokploy las inyecta en todos los contenedores del stack):

| Variable | Valor |
|---|---|
| `POSTGRES_DB` | `predictape` |
| `POSTGRES_USER` | `postgres` |
| `POSTGRES_PASSWORD` | _(contraseña segura, min. 16 chars)_ |
| `GROQ_API_KEY` | `gsk_...` _(tu clave de Groq)_ |
| `LLM_BASE_URL` | `https://api.groq.com/openai/v1` |
| `LLM_MODEL` | `gemma2-9b-it` |

Para generar una contraseña segura:
```bash
openssl rand -base64 32
```

### Paso 4 — Dominio (opcional)

1. En la pestaña **Domains** del servicio Compose, añade un dominio apuntado
   al servidor (p.ej. `predictape.tudominio.com`).
2. Dokploy configura Traefik y emite el certificado Let's Encrypt automáticamente.
3. Si usas HTTPS, descomenta la línea `- "443:443"` en `docker-compose.yml`.

### Paso 5 — Desplegar

1. Pestaña **Deployments** → **Deploy**.
2. Dokploy clona el repo, construye las imágenes y levanta los contenedores.
3. El primer build tarda ~3-5 minutos (descarga de capas base).
4. Los deploys posteriores son más rápidos gracias al cache de Docker.

### Verificar que funciona

```
# Frontend en el navegador:
http://<IP-del-servidor>

# API del backend (desde el mismo servidor o a través del proxy):
curl http://<IP-del-servidor>/api/v1/emergencias
```

---

## Método 2 — Servicios individuales + Base de datos gestionada

Útil si quieres escalar cada servicio de forma independiente o gestionar la
base de datos desde el panel de Dokploy en lugar de como contenedor.

### Paso 1 — Crear el proyecto

**Projects** → **Create Project** → nombre `predictape`.

---

### Paso 2 — Crear la base de datos PostgreSQL

Dentro del proyecto:

1. **Create Service** → **Database** → **PostgreSQL**.
2. Configura:
   - **Database name**: `predictape`
   - **Username**: `postgres`
   - **Password**: _(contraseña segura)_
   - **Version**: `16`
3. Clic en **Create**.
4. Una vez creada, copia la **Internal Connection URL** (interna al servidor Dokploy).
   Tiene esta forma:
   ```
   postgresql://postgres:<password>@<host-interno>:5432/predictape
   ```
   La necesitarás en el paso siguiente como valor de `DATABASE_URL`.

---

### Paso 3 — Desplegar el Backend (NestJS)

1. **Create Service** → **Application**.
2. Configura:
   - **Name**: `backend`
   - **Provider**: GitHub → selecciona el repositorio.
   - **Branch**: `main`
   - **Build Type**: `Dockerfile`
   - **Dockerfile Path**: `apps/backend/Dockerfile`
   - **Build Context**: `.` _(raíz del repo — obligatorio para el monorepo)_
3. En la pestaña **Environment**, añade:

   | Variable | Valor |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `3001` |
   | `DATABASE_URL` | _(Internal Connection URL del paso 2)_ |
   | `GROQ_API_KEY` | `gsk_...` |
   | `LLM_BASE_URL` | `https://api.groq.com/openai/v1` |
   | `LLM_MODEL` | `gemma2-9b-it` |

4. En **Ports** → exponer el puerto `3001` (solo internamente; el frontend hace
   de proxy).
5. Clic en **Deploy**.

---

### Paso 4 — Desplegar el Frontend (Vite + Nginx)

1. **Create Service** → **Application**.
2. Configura:
   - **Name**: `frontend`
   - **Provider**: GitHub → mismo repositorio.
   - **Branch**: `main`
   - **Build Type**: `Dockerfile`
   - **Dockerfile Path**: `apps/frontend/Dockerfile`
   - **Build Context**: `.` _(raíz del repo)_
3. En **Ports**: exponer el puerto `80`.
4. En **Domains**: añade tu dominio o usa la IP del servidor.

> **Importante**: el `nginx.conf` del frontend hace proxy de `/api/` hacia
> `http://backend:3001`. En el método de servicios individuales, `backend` debe
> ser el **nombre exacto del servicio** en Dokploy para que la resolución DNS
> interna funcione. Si le diste otro nombre, edita `apps/frontend/nginx.conf`
> y cambia `proxy_pass http://backend:3001;` por el nombre correcto.

5. Clic en **Deploy**.

---

## Flujo de actualizaciones (ambos métodos)

Después del primer despliegue, cada actualización sigue este flujo:

```
git push origin main
         │
         ▼
  Dokploy detecta el push (webhook)
         │
         ▼
  Reconstruye la imagen con cache de Docker
         │
         ▼
  Aplica nuevas migraciones (prisma migrate deploy)
         │
         ▼
  Reemplaza el contenedor con zero-downtime
```

Dokploy puede configurarse para **auto-deploy** al hacer push, o para
despliegues manuales desde el panel (pestaña **Deployments** → **Deploy**).

Para activar auto-deploy:
- En el servicio → **General** → habilita **Auto Deploy** → configura el webhook
  de GitHub con la URL que proporciona Dokploy.

---

## Variables de entorno — referencia completa

| Variable | Requerida | Defecto | Descripción |
|---|---|---|---|
| `POSTGRES_DB` | Si | `predictape` | Nombre de la base de datos |
| `POSTGRES_USER` | Si | `postgres` | Usuario de PostgreSQL |
| `POSTGRES_PASSWORD` | **Si** | — | Contraseña (nunca dejar vacía) |
| `NODE_ENV` | Si | — | Debe ser `production` |
| `PORT` | Si | `3001` | Puerto del backend |
| `DATABASE_URL` | **Si** | — | URL completa de conexión a PostgreSQL |
| `GROQ_API_KEY` | **Si** | — | API key de Groq para el LLM |
| `LLM_BASE_URL` | No | `https://api.groq.com/openai/v1` | URL del proveedor LLM |
| `LLM_MODEL` | No | `gemma2-9b-it` | Modelo a usar |

---

## Solución de problemas comunes

**El backend falla al iniciar con error de Prisma**

```
Error: P1001: Can't reach database server
```

Causa: el backend inició antes de que PostgreSQL estuviera listo.
Solución: en el método Compose, el `healthcheck` lo gestiona automáticamente.
En el método individual, espera a que la base de datos esté en estado `Running`
antes de hacer el primer deploy del backend.

---

**Error `prisma migrate deploy` — No migration files found**

Significa que olvidaste crear las migraciones localmente antes de desplegar.
Ejecuta en tu máquina:

```bash
pnpm --filter backend exec prisma migrate dev --name init
git add apps/backend/prisma/migrations/
git commit -m "feat: add initial prisma migration"
git push
```

Luego vuelve a desplegar desde Dokploy.

---

**El frontend devuelve 502 Bad Gateway en `/api/`**

Causa: Nginx no puede conectar con el servicio backend.
Comprueba:
1. Que el backend esté en estado `Running` en Dokploy.
2. Que el nombre del servicio backend en `nginx.conf` coincida con el nombre
   real del servicio en Dokploy.
3. Los logs del backend: **Deployments** → clic en el deploy → **Logs**.

---

**CSV upload falla con `413 Request Entity Too Large`**

El `nginx.conf` ya está configurado con `client_max_body_size 50M`. Si el error
persiste, revisa si hay un proxy adicional (Traefik, Cloudflare) que limite el
tamaño de la petición.

---

## Comandos útiles en el servidor

```bash
# Ver logs en tiempo real (Método Compose)
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db

# Entrar al contenedor del backend (para debugging)
docker compose exec backend sh

# Ejecutar migraciones manualmente
docker compose exec backend prisma migrate deploy

# Ver el estado de la base de datos
docker compose exec db psql -U postgres -d predictape -c "\dt"

# Reiniciar un servicio sin rebuildar
docker compose restart backend
```
