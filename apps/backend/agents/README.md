# Agentes IA (Gemma / Google Gemini)

Cada archivo `*.md` de esta carpeta define **un agente**. El backend los carga por
nombre de archivo: el agente `dengue-seir` vive en `dengue-seir.md`.

## Cómo funciona

1. El backend recibe la petición del frontend (ej. `POST /v1/riesgo/seir-model`).
2. `RunAgentUseCase` carga el `.md` del agente y lo usa como **system prompt**.
3. Envía el payload del frontend + el contrato de salida como mensaje de usuario.
4. Gemma responde **solo con JSON**, que se devuelve al frontend tal cual.

## Formato del archivo

Frontmatter YAML opcional + cuerpo Markdown con las instrucciones:

```md
---
model: gemma-4-31b-it      # opcional, override del LLM_MODEL global
temperature: 0.2           # opcional
max_tokens: 4096           # opcional
---

Eres un epidemiólogo experto en dengue...
(instrucciones + contrato JSON exacto que debe devolver el agente)
```

El backend usa el SDK oficial `@google/genai` (`npm install @google/genai`).

- Archivos que empiezan con `_` (ej. `_TEMPLATE.md`) y `README.md` se ignoran.
- El directorio es configurable con la variable de entorno `AGENTS_DIR`
  (por defecto `<cwd>/agents`).
- `docs/` contiene la especificación completa de referencia
  (`AGENTE_CONSULTAS.md`, `MUESTRARIO_DATA.md`); no son agentes ejecutables,
  son la fuente de las reglas que resume `dengue-seir.md`.

## Variables de entorno relevantes

| Variable            | Descripción                                            |
|---------------------|--------------------------------------------------------|
| `GEMINI_API_KEY`    | Token de Google AI Studio. Sin esto la IA se apaga.    |
| `LLM_MODEL`         | Modelo por defecto (ej. `gemma-4-31b-it`).             |
| `GEMINI_USE_SEARCH` | `true` añade la tool googleSearch (si el modelo la soporta). |
| `GEMINI_THINKING`   | `true` activa thinkingConfig (si el modelo lo soporta).|
| `AGENTS_DIR`        | Ruta a esta carpeta de agentes.                        |

Si Gemma no está configurado o falla, cada endpoint cae a su **fallback** (mock
determinista) sin romper el frontend.
