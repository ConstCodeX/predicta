# Predicta AI — Plataforma de Predictibilidad de Desastres (Perú)

Sistema de inteligencia geoespacial para la prevención y análisis del Fenómeno del Niño y otros eventos de emergencia en el Perú. Diseñado para gestores de riesgo, autoridades regionales y equipos de respuesta INDECI.

---

## Tabla de contenidos

1. [Levantar localmente (modo mock)](#levantar-localmente-modo-mock)
2. [Levantar con base de datos](#levantar-con-base-de-datos)
3. [Arquitectura del sistema](#arquitectura-del-sistema)
4. [Contratos de APIs externas (mock)](#contratos-de-apis-externas-mock)
5. [API Reference](#api-reference)
6. [Despliegue con Docker y Dokploy](#despliegue-con-docker-y-dokploy)
7. [Estructura del proyecto](#estructura-del-proyecto)

---

## Levantar localmente (modo mock)

**Sin base de datos ni API keys externas.** El backend sirve datos simulados desde archivos JSON que mapean los contratos de las APIs externas (INDECI, SENAMHI, IA).

### Requisitos

| Herramienta | Versión mínima |
|---|---|
| Node.js | 20 LTS |
| pnpm | 9+ |

```bash
# 1. Clonar e instalar dependencias
git clone <repo-url> && cd predictape
pnpm install

# 2. El .env del backend ya existe con valores de desarrollo
#    Si quieres personalizarlo:
#    cp apps/backend/.env.example apps/backend/.env

# 3. Levantar backend (puerto 3001)
pnpm --filter backend start:dev

# 4. Levantar frontend (puerto 5173) — en otra terminal
pnpm --filter frontend dev
```

El frontend queda disponible en `http://localhost:5173`.

**Credenciales por defecto:**
- Email: `admin@predicta.pe`
- Password: `admin123`

> En modo mock el backend no requiere PostgreSQL ni Groq API key. Todos los datos se leen desde `apps/backend/src/mocks/data/*.json`.

---

## Levantar con base de datos

Para trabajar con datos reales del INDECI (CSV SINPAD) necesitas PostgreSQL y opcionalmente una API key de Groq.

### Requisitos adicionales

| Herramienta | Versión mínima |
|---|---|
| Docker + Docker Compose | 24+ |
| PostgreSQL | 15+ |

### Pasos

```bash
# 1. Configurar variables de entorno
cp apps/backend/.env.example apps/backend/.env
# Editar .env: descomentar DATABASE_URL y GROQ_API_KEY

# 2. Levantar PostgreSQL con Docker
docker compose up -d db

# 3. Ejecutar migraciones de Prisma
pnpm --filter backend exec prisma migrate deploy

# 4. Levantar backend
pnpm --filter backend start:dev

# 5. Levantar frontend
pnpm --filter frontend dev
```

### Importar datos INDECI

1. Inicia sesión con rol SUPERADMIN
2. Ve a **Administración → CSV**
3. Sube el archivo `.csv` exportado del SINPAD
4. Haz clic en **Importar**

---

## Arquitectura del sistema

```
apps/
├── frontend/     Vite + React + TypeScript + Tailwind CSS v4
│   └── src/features/
│       ├── map/           Mapa MapLibre GL, capas, store Zustand
│       ├── predictions/   Panel de predicciones por tipo de riesgo
│       ├── heatmap/       Panel de mapa de calor histórico
│       ├── escenarios/    Análisis de escenarios por fenómeno
│       ├── chat/          Asistente IA conversacional
│       ├── data/          Explorador de datos históricos
│       ├── analytics/     Análisis estadístico por región
│       └── admin/         Panel SUPERADMIN
│
└── backend/      NestJS + TypeScript (gateway → APIs externas)
    └── src/
        ├── mocks/data/    JSON de contratos mock (ver sección siguiente)
        ├── app-config/    Configuración editable (in-memory en mock)
        ├── auth/          JWT + Guards (env vars en mock)
        ├── users/         CRUD usuarios (in-memory en mock)
        ├── emergencias/   Heatmap, timeline, CSV upload
        ├── predicciones/  Forecast IA (mock JSON)
        ├── riesgo/        Predicciones por tipo de riesgo (mock JSON)
        ├── escenarios/    Análisis de escenarios (mock JSON)
        └── analytics/     Estadísticas agregadas (mock JSON)
```

**Filosofía del backend — Gateway:**
El backend actúa como gateway hacia APIs externas especializadas (INDECI/SINPAD, SENAMHI, motor IA). En modo mock los servicios leen directamente de los JSON en `mocks/data/`. Cuando se integren las APIs reales, cada servicio reemplaza la lectura de JSON por una llamada HTTP al endpoint documentado en el campo `_contract` de cada archivo.

---

## Contratos de APIs externas (mock)

Los archivos en `apps/backend/src/mocks/data/` documentan los contratos de las APIs externas que el backend consumirá en producción. Cada archivo tiene un campo `_contract` con el endpoint real, la fuente y las notas de integración.

| Archivo | API externa | Descripción |
|---|---|---|
| `analytics-summary.json` | INDECI / SINPAD | Resumen estadístico de emergencias históricas |
| `predictions.json` | SENAMHI + Motor IA | Predicciones de riesgo por tipo de fenómeno y ventana temporal |
| `scenarios.json` | SENAMHI + INDECI Risk Engine | Análisis de zonas por escenario e intensidad |
| `heatmap.json` | INDECI / SINPAD | Densidad de emergencias por distrito para mapa de calor |
| `timeline.json` | INDECI / SINPAD | Frames temporales (año+mes) para animación del mapa |
| `emergencias.json` | INDECI / SINPAD | Listado paginado de reportes históricos |
| `forecast.json` | Predicta AI Engine | Forecast IA con alertas georreferenciadas, gráficos y métricas |

### Ejemplo de contrato (`analytics-summary.json`):

```json
{
  "_contract": {
    "source": "INDECI / SINPAD",
    "endpoint": "GET https://sinpad.indeci.gob.pe/api/v1/reportes/summary",
    "auth": "Bearer token (API key INDECI)",
    "notes": "Actualización diaria. Filtro por año disponible."
  },
  "kpis": { ... },
  "porFamiliaEvento": [ ... ]
}
```

---

## API Reference

Base URL: `http://localhost:3001/api` (dev)

Todos los endpoints requieren `Authorization: Bearer <jwt_token>` excepto `/v1/auth/login`.

### Autenticación

| Método | Endpoint | Body | Descripción |
|---|---|---|---|
| POST | `/v1/auth/login` | `{ email, password }` | Login → JWT |

### Emergencias

| Método | Endpoint | Query params | Descripción |
|---|---|---|---|
| GET | `/v1/emergencias` | `departamento, familiaEvento, evento, page, pageSize` | Listado paginado |
| GET | `/v1/emergencias/heatmap` | `familiaEvento, evento` | Densidad por zona |
| GET | `/v1/emergencias/timeline` | `familiaEvento, evento, anioDesde, anioHasta` | Frames para animación |
| POST | `/v1/emergencias/upload` | `multipart: file (.csv)` | Subir CSV INDECI |

### Predicciones

| Método | Endpoint | Body | Descripción |
|---|---|---|---|
| GET | `/v1/riesgo/tipos` | — | Lista de tipos disponibles |
| POST | `/v1/riesgo/predict` | `{ tipo, ventana_dias? }` | Predicción por tipo |

**Tipos disponibles:** `HIDRO_GEOLOGICO`, `FRIAJE_HELADA`, `INCENDIO`, `GEOFISICO`, `BIOLOGICO`, `ANTROPICO`, `SALUD_PUBLICA`, `AGUA_SANEAMIENTO`

### Escenarios

| Método | Endpoint | Body | Descripción |
|---|---|---|---|
| GET | `/v1/escenarios/tipos` | — | Lista de escenarios |
| POST | `/v1/escenarios/analyze` | `{ escenarioId, intensidad, departamento? }` | Analizar escenario |

**escenarioId disponibles:** `HELADAS`, `LLUVIAS_INTENSAS`, `HUAICOS`, `GRANIZADAS`, `SISMO`, `INCENDIO_FORESTAL`, `SEQUIA`, `EPIDEMIA`, `OLA_CALOR`  
**intensidad:** `normal` | `moderado` | `extremo`

### Forecast IA

| Método | Endpoint | Body | Descripción |
|---|---|---|---|
| POST | `/v1/ai/forecast` | `{ query, departamento?, familiaEvento?, anioDesde?, anioHasta? }` | Forecast con alertas y gráficos |

### Análisis

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/v1/analytics/summary` | Estadísticas globales (KPIs, por familia, año, depto, mes) |

### Configuración (SUPERADMIN)

| Método | Endpoint | Body | Descripción |
|---|---|---|---|
| GET | `/v1/config` | — | Listar parámetros |
| PUT | `/v1/config/:key` | `{ value, description? }` | Actualizar |
| DELETE | `/v1/config/:key` | — | Eliminar |

### Usuarios (SUPERADMIN)

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/v1/users` | Listar usuarios |
| POST | `/v1/users` | Crear usuario |
| PATCH | `/v1/users/:id/deactivate` | Desactivar |
| PATCH | `/v1/users/:id/reset-password` | Reset de contraseña |

---

## Conectar tu API real

Esta sección documenta **exactamente dónde y cómo** reemplazar los mocks por llamadas a una API real, endpoint por endpoint.

### Paso 1 — Variable de entorno base URL (frontend)

El frontend hace fetch directamente a `/api/...` (ruta relativa). El proxy de Vite redirige al backend local durante desarrollo.

**Archivo:** `apps/frontend/vite.config.ts`
```ts
server: {
  proxy: {
    '/api': 'http://localhost:3001',   // ← cambia aquí si tu API corre en otro host
  }
}
```

En producción, Nginx/Dokploy hace el proxy. No hay hardcoded URLs en el frontend.

---

### Paso 2 — Reemplazar mocks en el backend

Cada módulo del backend tiene un archivo donde lee el JSON mock. Reemplaza ese bloque por una llamada `HttpService` (Axios) a tu API real.

#### `POST /api/v1/riesgo/predict` — Predicciones por tipo de riesgo

**Archivo:** `apps/backend/src/riesgo/run-prediction.use-case.ts`

```ts
// ── MOCK (borrar) ──────────────────────────────────────────────
const raw = fs.readFileSync(path.join(__dirname, '../mocks/data/predictions.json'), 'utf8');
const { _contract: _c, ...entries } = JSON.parse(raw);
return entries[tipo] ?? entries['HIDRO_GEOLOGICO'];

// ── REAL API (reemplazar con) ──────────────────────────────────
const response = await this.httpService.axiosRef.post<PredictionResponse>(
  `${process.env.PREDICTION_API_URL}/predict`,
  { tipo, ventana_dias },
  { headers: { Authorization: `Bearer ${process.env.PREDICTION_API_KEY}` } }
);
return response.data;
```

**Campos esperados por el frontend** (`PredictionResponse`):
| Campo | Tipo | Descripción |
|---|---|---|
| `tipo` | `string` | ID del tipo (ej. `HIDRO_GEOLOGICO`) |
| `tipo_label` | `string` | Nombre legible |
| `ventana_dias` | `number` | Días de la ventana analizada |
| `resumen` | `string \| null` | Texto de análisis general |
| `ai_disponible` | `boolean` | Si el análisis usó IA o estadística |
| `predicciones[]` | array | Lista de distritos (ver abajo) |

**Campos por distrito** (`DistrictPrediction`):
| Campo | Tipo | Descripción |
|---|---|---|
| `distrito` | `string` | Nombre del distrito |
| `departamento` | `string` | Nombre del departamento |
| `probabilidad_pct` | `number` | 0–100, probabilidad de ocurrencia |
| `x_base` | `number` | Multiplicador respecto a línea base histórica |
| `lluvia_estimada_mm` | `number` | Lluvia acumulada estimada en mm |
| `dia_pico` | `string` | Fecha ISO de día pico (ej. `2026-08-12`) |
| `nivel` | `"bajo" \| "medio" \| "alto"` | Nivel de riesgo |

---

#### `GET /api/v1/riesgo/tipos` — Lista de tipos disponibles

**Archivo:** `apps/backend/src/riesgo/riesgo.controller.ts`

```ts
// ── MOCK ──────────────────────────────────────────────────────
return PREDICTION_TYPES_MOCK;

// ── REAL API ──────────────────────────────────────────────────
const { data } = await this.httpService.axiosRef.get(`${process.env.PREDICTION_API_URL}/tipos`);
return data;
```

**Campos esperados** (`PredictionType[]`):
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `string` | Clave única (`HIDRO_GEOLOGICO`, `INCENDIO`, etc.) |
| `label` | `string` | Nombre visible |
| `descripcion` | `string` | Descripción corta |
| `icono` | `string` | Emoji o código de icono |

---

#### `POST /api/v1/riesgo/seir-model` — Modelo epidémico Dengue

**Archivo:** `apps/backend/src/riesgo/riesgo.controller.ts` (endpoint `seir-model`)

```ts
// ── MOCK ──────────────────────────────────────────────────────
const preset = enos_intensidad === 'fuerte' ? 'critico'
             : enos_intensidad === 'moderado' ? 'moderado'
             : 'optimista';
return this.seirData[preset];

// ── REAL API ──────────────────────────────────────────────────
const { data } = await this.httpService.axiosRef.post(
  `${process.env.SEIR_API_URL}/model`,
  { region, ventana_semanas, parametros },
  { headers: { Authorization: `Bearer ${process.env.SEIR_API_KEY}` } }
);
return data;
```

**Request body esperado:**
```json
{
  "region": "PIURA — Piura / Sullana",
  "ventana_semanas": 16,
  "parametros": {
    "enos_intensidad": "neutro | moderado | fuerte",
    "anomalia_lluvias_pct": 0,
    "eficiencia_control_vectorial_pct": 80
  }
}
```

**Response esperada** (`SEIRModelResponse`) — campos que usa el frontend:
| Campo | Tipo | Descripción |
|---|---|---|
| `region` | `string` | Región analizada |
| `escenario` | `string` | Nombre del escenario (ej. `Optimista`) |
| `ventana_semanas` | `number` | Semanas de proyección |
| `kpis.casos_proyectados_total` | `number` | Total casos proyectados |
| `kpis.pico_semana` | `number` | Semana del pico epidémico |
| `kpis.maximo_semanal_casos` | `number` | Casos en la semana pico |
| `kpis.saturacion_hospitalaria_pct` | `number` | % saturación (>100 = colapso) |
| `kpis.nivel_riesgo` | `"bajo" \| "moderado" \| "critico"` | Nivel general |
| `kpis.impacto_economico_soles` | `number` | Impacto económico en S/ |
| `kpis.ahorro_preventivo_soles` | `number` | Ahorro si se actúa preventivamente |
| `kpis.rt_maximo` | `number` | Número reproductivo básico máximo |
| `kpis.camas_disponibles` | `number` | Camas hospitalarias disponibles |
| `proyeccion_semanal[]` | array | Una entrada por semana (ver abajo) |
| `humanitario` | object | Fallecidos, heridos, desplazados, etc. |
| `economico` | object | Impacto en cultivos e infraestructura |
| `distribucion_geografica[]` | array | Ciudades con `ciudad, lat, lng, casos, pct` |
| `alertas[]` | `string[]` | Textos de alerta para mostrar al usuario |

**Campos por semana** (`proyeccion_semanal[]`):
| Campo | Tipo | Descripción |
|---|---|---|
| `semana` | `number` | Número de semana (1–16) |
| `casos_proyectados` | `number` | Casos nuevos proyectados |
| `hospitalizados_requeridos` | `number` | Hospitalizaciones requeridas |
| `tasa_rt` | `number` | Rt de esa semana |
| `es_historico` | `boolean` | `true` = datos reales, `false` = proyección |

---

#### `POST /api/v1/ai/forecast` — Forecast IA

**Archivo:** `apps/backend/src/predicciones/infrastructure/controllers/prediccion.controller.ts`

```ts
// ── MOCK ──────────────────────────────────────────────────────
return this.mockForecast;

// ── REAL API (Groq / LLM) ─────────────────────────────────────
// Ya está parcialmente implementado en groq-llm.adapter.ts
// Solo descomentar y configurar GROQ_API_KEY en .env
```

---

### Paso 3 — Variables de entorno necesarias

Agregar a `apps/backend/.env`:

```env
# URLs de APIs externas (vacías = usa mock)
PREDICTION_API_URL=https://tu-api.com/v1
PREDICTION_API_KEY=tu-key
SEIR_API_URL=https://tu-seir-api.com/v1
SEIR_API_KEY=tu-key

# IA (ya existe en .env.example)
GROQ_API_KEY=tu-groq-key
```

### Paso 4 — Verificar contratos

Cada archivo JSON en `apps/backend/src/mocks/data/` tiene un campo `_contract` con el endpoint real documentado. Ese campo es el contrato que tu API debe cumplir.

```bash
# Ver todos los contratos definidos
grep -r '"endpoint"' apps/backend/src/mocks/data/
```

---

## Despliegue con Docker y Dokploy

```bash
# Build y levantar todos los servicios
docker compose up -d --build

# Ver logs
docker compose logs -f backend

# Ejecutar migraciones en producción
docker compose exec backend npx prisma migrate deploy
```

**Variables de entorno requeridas en producción:**

```env
JWT_SECRET=<secreto-seguro>
ADMIN_EMAIL=admin@tudominio.pe
ADMIN_PASSWORD=<password-seguro>
POSTGRES_PASSWORD=<password-db>
GROQ_API_KEY=<api-key-groq>
```

**Dokploy:** Apunta a `docker-compose.yml` en la raíz. Configura las variables desde el panel de Dokploy.

---

## Estructura del proyecto

```
predictape/
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── mocks/data/        # JSONs de contratos mock
│   │   │   ├── app-config/        # Config editable (in-memory / DB)
│   │   │   ├── auth/              # JWT, Guards
│   │   │   ├── users/             # CRUD usuarios
│   │   │   ├── emergencias/       # Heatmap, timeline, CSV
│   │   │   ├── predicciones/      # Forecast IA
│   │   │   ├── riesgo/            # Tipos predictivos
│   │   │   ├── escenarios/        # Fenómenos por intensidad
│   │   │   └── analytics/         # Estadísticas agregadas
│   │   ├── prisma/schema.prisma   # Schema DB (para integración real)
│   │   └── .env.example
│   └── frontend/
│       └── src/features/
│           ├── map/               # MapDashboard, store Zustand
│           ├── predictions/       # PredictionsPanel
│           ├── heatmap/           # HeatmapPanel
│           ├── escenarios/        # ScenariosPanel
│           ├── chat/              # AIChatPanel
│           ├── analytics/         # AnalyticsPanel
│           └── admin/             # AdminPanel
├── docker-compose.yml
└── README.md
```

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Vite 5, React 18, TypeScript, Tailwind CSS v4, Framer Motion |
| Mapa | MapLibre GL v4, react-map-gl v7 |
| Estado | Zustand |
| Backend | NestJS 10, TypeScript |
| Base de datos | PostgreSQL 15 + Prisma ORM (opcional en desarrollo) |
| IA | Groq Cloud API / LLaMA 3.1 (opcional en desarrollo) |
| Auth | JWT, bcryptjs |
| Contenedores | Docker, Docker Compose, Dokploy |

---

*Predicta AI — Construido para el concurso de innovación en gestión de riesgos de desastres, Perú 2026.*
