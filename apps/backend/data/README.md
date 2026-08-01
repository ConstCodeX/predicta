# data/ — CSVs y datos de entrada

Carpeta para todos los datos que alimentan al backend (crudos y de referencia).
Configurable con la variable de entorno `DATA_DIR` (por defecto `<cwd>/data`).

## Estructura

```
data/
├── csv/         # CSVs crudos versionados: INDECI histórico, SENAMHI, MINSA...
├── uploads/     # CSVs subidos en runtime por el usuario (NO se versionan)
└── datasets/    # Datos de referencia procesados (json/geojson, catálogos)
```

| Subcarpeta   | Contenido                                   | ¿Se versiona en git? |
|--------------|---------------------------------------------|----------------------|
| `csv/`       | CSVs fuente estables (INDECI, SENAMHI, etc.)| Sí                   |
| `uploads/`   | CSVs cargados por API en ejecución          | No (solo `.gitkeep`) |
| `datasets/`  | Datos de referencia derivados               | Según tamaño         |

## Variables de entorno

| Variable      | Descripción                        | Default        |
|---------------|------------------------------------|----------------|
| `DATA_DIR`    | Raíz de datos                      | `<cwd>/data`   |
| `CSV_DIR`     | CSVs fuente                        | `<DATA_DIR>/csv`     |
| `UPLOADS_DIR` | CSVs subidos en runtime            | `<DATA_DIR>/uploads` |

## Nota

Hoy la carga de CSV (`POST` de INDECI) usa multer en memoria y se parsea sin
tocar disco. Si quieres persistir el archivo subido, guárdalo en `uploads/`.
Los mocks de respuestas (JSON) siguen en `src/mocks/data/`, aparte de esta carpeta.

## Contexto de dengue para la IA

El agente `dengue-seir` NO parsea Excel en runtime. Se pre-agregan los datos a un
JSON liviano por departamento:

```
data/csv/Casos_Dengue.xlsx
data/csv/Defunciones_Dengue.xlsx          ──►  data/datasets/dengue_context.json
data/csv/DATA_MAESTRA_...Sheet1.csv
```

Regenéralo cuando cambien los CSVs (requiere `pip install pandas openpyxl`):

```
python scripts/build_dengue_context.py
```

El backend (`DengueContextService`) carga ese JSON al iniciar y, por cada región
consultada, inyecta los datos reales del departamento al prompt de Gemma.
