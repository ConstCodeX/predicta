# Predicta AI — Plataforma de Predictibilidad de Desastres (Perú)

Sistema de inteligencia geoespacial para la prevención y análisis del Fenómeno del Niño y otros eventos de emergencia en el Perú. Diseñado para gestores de riesgo, autoridades regionales y equipos de respuesta INDECI.

---

## Tabla de contenidos

1. [Visión general](#visión-general)
2. [Arquitectura del sistema](#arquitectura-del-sistema)
3. [Requisitos previos](#requisitos-previos)
4. [Variables de entorno](#variables-de-entorno)
5. [Configuración del modelo LLM](#configuración-del-modelo-llm)
6. [Instalación y desarrollo local](#instalación-y-desarrollo-local)
7. [Despliegue con Docker y Dokploy](#despliegue-con-docker-y-dokploy)
8. [Importación de datos INDECI (CSV)](#importación-de-datos-indeci-csv)
9. [Guía de herramientas del mapa](#guía-de-herramientas-del-mapa)
10. [Modelos predictivos](#modelos-predictivos)
11. [Escenarios de riesgo](#escenarios-de-riesgo)
12. [Administración SUPERADMIN](#administración-superadmin)
13. [Estructura del proyecto](#estructura-del-proyecto)
14. [API Reference](#api-reference)

---

## Visión general

Predicta AI ingiere datos históricos de emergencias del INDECI (formato CSV oficial), los almacena en PostgreSQL y los expone a través de:

- **Mapa interactivo** con marcadores por alerta, mapa de calor y línea de tiempo animada
- **Motor predictivo** con análisis estadístico (Poisson) y síntesis LLM (Groq/LLaMA)
- **Escenarios de riesgo** configurables por tipo de fenómeno, intensidad y departamento
- **Asistente IA** conversacional para consultas libres sobre datos históricos
- **Panel de administración** para gestión de usuarios, datos y configuración del modelo

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
└── backend/      NestJS + TypeScript + Prisma + PostgreSQL
    └── src/
        ├── app-config/    Configuración editable (AppConfigService @Global)
        ├── auth/          JWT + Guards
        ├── users/         CRUD usuarios, roles (USER / SUPERADMIN)
        ├── emergencias/   Ingestión CSV, historial, heatmap
        ├── predicciones/  Motor LLM (ILLMAdapter / GroqLLMAdapter)
        ├── riesgo/        Casos de uso de predicción por tipo
        ├── escenarios/    Análisis de escenarios de fenómenos
        └── analytics/     Endpoints de estadísticas agregadas
```

**Arquitectura hexagonal en backend:**
- `Domain` — entidades, value objects, puertos (interfaces)
- `Application` — casos de uso (AnalyzeScenarioUseCase, RunPredictionUseCase)
- `Infrastructure` — controladores REST, repositorios Prisma, adapters de IA

---

## Requisitos previos

| Herramienta | Versión mínima |
|---|---|
| Node.js | 20 LTS |
| pnpm | 9+ |
| Docker + Docker Compose | 24+ |
| PostgreSQL | 15+ (o usar el contenedor Docker) |

---

## Variables de entorno

Crea `apps/backend/.env` con los siguientes valores:

```env
# Base de datos
DATABASE_URL="postgresql://predicta:predicta@localhost:5432/predictape"

# JWT
JWT_SECRET="cambia-este-secreto-por-uno-seguro"

# Groq LLM (obtén tu clave en console.groq.com)
GROQ_API_KEY="gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
GROQ_MODEL="llama-3.1-8b-instant"
```

> **Nota:** Si `GROQ_API_KEY` no está configurada o la IA no responde, el sistema usa automáticamente el **fallback estadístico Poisson** — el servidor nunca falla. El campo `ai_disponible: false` en la respuesta indica cuándo se usó el fallback.

---

## Configuración del modelo LLM

Predicta usa Groq con LLaMA 3.1 (8B) por defecto. Para cambiar el modelo:

1. Establece `GROQ_MODEL` en `.env` con el identificador del modelo deseado:
   - `llama-3.1-8b-instant` (rápido, recomendado)
   - `llama-3.3-70b-versatile` (más preciso, más lento)
   - `mixtral-8x7b-32768` (buena relación calidad/velocidad)

2. Reinicia el backend.

### Prompts editables desde la UI

Los prompts del sistema que usa la IA son editables en **Administración → Config IA** (requiere rol SUPERADMIN). Los prompts configurables son:

| Clave | Descripción |
|---|---|
| `prompt.predict.system` | Prompt de sistema para análisis predictivo por distrito |
| `prompt.heatmap.commentary` | Prompt para el comentario del mapa de calor |

Si se elimina un prompt desde la UI, el sistema revierte al prompt predeterminado del código automáticamente.

---

## Instalación y desarrollo local

```bash
# Clonar y entrar al proyecto
git clone <repo-url> && cd predictape

# Instalar dependencias (monorepo pnpm)
pnpm install

# Levantar la base de datos con Docker
docker compose up -d postgres

# Migrar la base de datos
pnpm --filter backend prisma migrate deploy

# Iniciar backend (puerto 3000)
pnpm --filter backend dev

# Iniciar frontend (puerto 5173)
pnpm --filter frontend dev
```

El frontend hace proxy hacia `http://localhost:3000` — configurado en `vite.config.ts`.

### Crear el primer SUPERADMIN

```bash
# Desde apps/backend
npx ts-node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
prisma.user.create({
  data: {
    email: 'admin@predicta.pe',
    name: 'Administrador',
    password: bcrypt.hashSync('cambia-tu-clave', 10),
    role: 'SUPERADMIN',
  }
}).then(console.log).finally(() => prisma.\$disconnect());
"
```

---

## Despliegue con Docker y Dokploy

```bash
# Build y levantar todos los servicios
docker compose up -d --build

# Ver logs del backend
docker compose logs -f backend

# Ejecutar migraciones en producción
docker compose exec backend npx prisma migrate deploy
```

**Estructura Docker Compose:**
- `postgres` — PostgreSQL 15 con volumen persistente
- `backend` — NestJS en puerto 3000 (interno)
- `frontend` — Nginx sirviendo el build de Vite en puerto 80

**Dokploy:** Apunta a `docker-compose.yml` en la raíz del repositorio. Configura las variables de entorno desde el panel de Dokploy (equivalen a `apps/backend/.env`).

---

## Importación de datos INDECI (CSV)

Los datos históricos de emergencias provienen del **SINPAD/INDECI** en formato CSV oficial.

### Columnas esperadas

| Columna | Descripción |
|---|---|
| `DEPARTAMENTO` | Nombre del departamento en mayúsculas |
| `DISTRITO` | Nombre del distrito |
| `FAMILIA EVENTO` | Categoría INDECI (ver familias soportadas) |
| `EVENTO` | Tipo específico de evento |
| `AÑO` | Año del evento (numérico) |
| `MES` | Mes del evento (1–12) |

### Familias INDECI soportadas

`HIDROMETEOROLOGICO`, `MOVIMIENTO DE MASA`, `BAJAS TEMPERATURAS`, `INCENDIO`, `GEOFISICO`, `BIOLOGICO`, `ANTROPICO`, `TECNOLOGICO`

### Procedimiento de importación

1. Inicia sesión con rol **SUPERADMIN**
2. Ve a **Administración → CSV**
3. Selecciona el archivo `.csv` exportado del SINPAD
4. Haz clic en **Importar**

El sistema realiza validación de columnas, normaliza los textos y hace upsert de registros para evitar duplicados en importaciones sucesivas.

> Para conjuntos grandes de datos (>50,000 filas), el proceso puede tardar 30–60 segundos. La UI muestra el progreso.

---

## Guía de herramientas del mapa

El mapa es la pantalla principal de Predicta. La barra vertical flotante izquierda contiene las herramientas:

### Predicciones (ícono estrella)

Genera predicciones de riesgo para los próximos 30, 60 o 90 días por tipo de riesgo:

| Tipo | Datos base | Descripción |
|---|---|---|
| HIDRO_GEOLOGICO | HIDROMETEOROLOGICO + MOVIMIENTO DE MASA | Lluvias, huaicos, deslizamientos |
| HELADAS_FRIAJE | BAJAS TEMPERATURAS | Friaje, heladas en sierra |
| INCENDIOS | INCENDIO | Incendios forestales y urbanos |
| GEOFISICO | GEOFISICO | Sismos, tsunamis |
| SALUD_PUBLICA | BIOLOGICO + HIDROMETEOROLOGICO | Dengue, desabastecimiento medicamentos |
| AGUA_SANEAMIENTO | HIDROMETEOROLOGICO + MOVIMIENTO DE MASA + ANTROPICO | Escasez hídrica, contaminación |

Los distritos con mayor riesgo aparecen como marcadores en el mapa. El color indica el nivel: rojo (alto), naranja (medio), azul (bajo).

### Mapa de calor (ícono llama)

Visualiza la densidad histórica de eventos por zona:
1. Selecciona familia de evento y/o tipo específico
2. Ajusta el rango de años
3. Haz clic en **Generar** — el mapa muestra un heatmap de concentración

### Línea de tiempo (ícono reloj)

Animación histórica mes a mes del heatmap de emergencias:
1. Filtra por familia de evento (el tipo de evento se actualiza automáticamente)
2. Define el rango de años
3. Presiona **▶** para reproducir o arrastra el slider

El mapa de calor cambia de color conforme avanzan los meses. La escala de color es consistente a través de toda la línea de tiempo (el máximo se calcula sobre todos los frames al cargar).

### Escenarios (ícono mira)

Analiza zonas en riesgo según un fenómeno específico y su intensidad:

1. Selecciona el **tipo de escenario**: Heladas, Lluvias Intensas, Huaicos, Granizadas, Sismo, Incendio Forestal, Sequía, Epidemia/Dengue, Ola de Calor
2. Elige la **intensidad**: Normal / Moderado / Extremo
3. Filtra opcionalmente por **departamento**
4. Haz clic en **Analizar escenario**

El resultado muestra las zonas históricamente más afectadas en el mapa de calor, con estadísticas de promedio anual y máximo histórico por distrito. Si la IA está disponible, incluye un análisis textual del patrón de riesgo.

### Asistente IA (ícono chat)

Chat conversacional con acceso a los datos históricos de emergencias. Puedes hacer preguntas como:
- "¿Cuáles son los distritos con más heladas en Puno?"
- "¿En qué meses hay más riesgo de huaicos en Cusco?"
- "¿Cómo ha evolucionado el dengue en los últimos 10 años?"

---

## Modelos predictivos

### Motor principal: LLM (Groq/LLaMA)

Cuando la IA está disponible, el sistema:
1. Consulta los últimos 5 años de datos históricos filtrados por tipo de predicción
2. Construye un contexto JSON con eventos por distrito
3. Envía al LLM el prompt del sistema (editable desde la UI) + los datos
4. Parsea la respuesta JSON con probabilidades y descripciones por distrito
5. Retorna `ai_disponible: true`

### Fallback estadístico: Distribución de Poisson

Si el LLM falla por cualquier razón (timeout, API key inválida, cuota agotada):

```
λ = (eventos_anuales / 12) × (ventana_días / 30) × factor_estacional
P(ocurrencia) = (1 - e^(-λ)) × 100
```

El factor estacional ajusta la probabilidad según el mes actual (ej. verano vs. invierno para heladas).

El servidor **nunca lanza un error** por fallo de IA — retorna `ai_disponible: false` con predicciones estadísticas válidas.

---

## Escenarios de riesgo

Los escenarios cruzan datos históricos de múltiples familias de eventos INDECI para identificar zonas con patrones recurrentes. Cada escenario tiene umbrales de inclusión según la intensidad seleccionada:

| Escenario | Familias base | Umbral extremo (eventos/año) |
|---|---|---|
| Heladas | BAJAS TEMPERATURAS | 10+ |
| Lluvias Intensas | HIDROMETEOROLOGICO | 18+ |
| Huaicos | MOVIMIENTO DE MASA | 8+ |
| Granizadas | HIDROMETEOROLOGICO + BAJAS TEMPERATURAS | 6+ |
| Sismo | GEOFISICO | 5+ |
| Incendio Forestal | INCENDIO | 10+ |
| Sequía | HIDROMETEOROLOGICO | 5+ |
| Epidemia/Dengue | BIOLOGICO | 8+ |
| Ola de Calor | HIDROMETEOROLOGICO | 5+ |

Los resultados se visualizan como heatmap en el mapa principal con código de color por nivel (normal/moderado/extremo).

---

## Administración SUPERADMIN

Acceso desde **Administración** en la barra de navegación superior (visible solo para SUPERADMIN).

### CSV
Importación masiva de datos INDECI. Ver [sección de importación](#importación-de-datos-indeci-csv).

### Usuarios
- Listado de todos los usuarios registrados
- Cambio de rol (USER / SUPERADMIN)
- Desactivación de cuentas

### Config IA
Edición en tiempo real de los prompts del sistema:
- Los cambios se guardan en la tabla `app_config` (PostgreSQL)
- El botón **Resetear** elimina el registro de DB y revierte al default del código
- Sin necesidad de reiniciar el servidor

---

## Estructura del proyecto

```
predictape/
├── apps/
│   ├── backend/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── src/
│   │       ├── app.module.ts
│   │       ├── app-config/       # Configuración editable DB (@Global)
│   │       ├── auth/             # JWT, Guards, estrategias
│   │       ├── users/            # Gestión de usuarios
│   │       ├── emergencias/      # CSV, historial, heatmap, timeline
│   │       ├── predicciones/     # ILLMAdapter, GroqLLMAdapter
│   │       ├── riesgo/           # Tipos predictivos, Poisson fallback
│   │       ├── escenarios/       # Análisis de fenómenos por intensidad
│   │       └── analytics/        # Estadísticas agregadas
│   └── frontend/
│       ├── index.html
│       ├── vite.config.ts
│       └── src/
│           ├── App.tsx
│           ├── components/       # TopNav, UI atoms
│           └── features/
│               ├── map/          # MapDashboard, MapToolbar, store
│               ├── predictions/  # PredictionsPanel
│               ├── heatmap/      # HeatmapPanel
│               ├── escenarios/   # ScenariosPanel
│               ├── chat/         # AIChatPanel
│               ├── data/         # DataExplorerPanel
│               ├── analytics/    # AnalyticsPanel
│               ├── auth/         # LoginPage, useAuthStore
│               ├── admin/        # AdminPanel, CsvUpload, PromptConfig
│               └── config/       # PromptConfigPanel
├── docker-compose.yml
└── README.md
```

---

## API Reference

Base URL: `http://localhost:3000` (dev) | tu dominio en producción

Todos los endpoints requieren `Authorization: Bearer <jwt_token>` excepto `/v1/auth/login`.

### Autenticación

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/v1/auth/login` | Login con email/password → JWT |
| GET | `/v1/auth/me` | Perfil del usuario actual |

### Emergencias

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/v1/emergencias` | Historial paginado con filtros |
| GET | `/v1/emergencias/heatmap` | Densidad por zona (familiaEvento, anioDesde/Hasta) |
| GET | `/v1/emergencias/timeline` | Frames mes a mes para animación |
| POST | `/v1/emergencias/upload-csv` | Importar CSV INDECI (multipart/form-data) |

### Predicciones

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/v1/riesgo/predict` | Predicción por tipo y ventana temporal |
| GET | `/v1/riesgo/tipos` | Lista de tipos de predicción disponibles |

### Escenarios

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/v1/escenarios/tipos` | Lista de escenarios disponibles |
| POST | `/v1/escenarios/analyze` | Analizar escenario `{ escenarioId, intensidad, departamento? }` |

### Análisis IA

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/v1/ai/forecast` | Forecast de alertas para el mapa |
| POST | `/v1/ai/chat` | Pregunta libre al asistente |

### Configuración (SUPERADMIN)

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/v1/config` | Listar todos los parámetros |
| PUT | `/v1/config/:key` | Actualizar valor `{ value, description? }` |
| DELETE | `/v1/config/:key` | Eliminar (revierte al default del código) |

### Usuarios (SUPERADMIN)

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/v1/users` | Listar usuarios |
| PATCH | `/v1/users/:id` | Actualizar rol o estado |
| DELETE | `/v1/users/:id` | Eliminar usuario |

---

## Tecnologías clave

| Capa | Tecnología |
|---|---|
| Frontend | Vite 5, React 18, TypeScript, Tailwind CSS v4, Framer Motion |
| Mapa | MapLibre GL v4, react-map-gl v7 |
| Estado | Zustand |
| Backend | NestJS 10, TypeScript, Prisma ORM |
| Base de datos | PostgreSQL 15 |
| IA | Groq Cloud API, LLaMA 3.1, OpenAI SDK compatible |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Contenedores | Docker, Docker Compose, Dokploy |

---

*Predicta AI — Construido para el concurso de innovación en gestión de riesgos de desastres, Perú 2026.*
