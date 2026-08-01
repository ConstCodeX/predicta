# Agente de consultas — especificación

Agente que recibe **un distrito**, consulta el clima actual en Open-Meteo, cruza
con las tablas históricas, y devuelve el JSON del dashboard.

**Regla base**: nunca inventar un número. Si un campo no sale de una tabla, de
la API o de un modelo entrenado, devolverlo como `null` y explicar por qué en
`notas`. Cada valor lleva su `origen`: `dato`, `modelo`, `supuesto`,
`modelo+supuesto`, `derivado` o `sin_dato`.

---

## 1. Entrada

```jsonc
{
  "distrito": {                    // al menos uno; se resuelve en cascada
    "ubigeo": "200104",            // preferido, 6 dígitos
    "nombre": "CATACAOS",
    "provincia": "PIURA",
    "departamento": "PIURA"
  },
  "enfermedad": "DENGUE",          // opcional: DENGUE | IRA | null
  "evento": "INUNDACION",          // opcional: ver §3
  "horizonte_dias": 7,             // eventos físicos
  "horizonte_semanas": 12,         // epidemiológico
  "escenario": "moderado"          // optimista | moderado | critico
}
```

### Cascada de resolución

Siempre de mayor a menor granularidad. **Registrar con qué nivel se resolvió.**

1. `ubigeo` exacto — con cero a la izquierda: `10101` → `010101`
2. `nombre` + `departamento`
3. `nombre` + `provincia`
4. `nombre` solo → si hay varios, marcar `distrito(ambiguo)`
5. `provincia` → devolver el distrito capital, advertir en `notas`
6. `departamento` → ídem

⚠️ **98 nombres de distrito se repiten entre departamentos.** `SANTA ROSA`
existe en 10, `SAN ANTONIO` en 5. Nunca resolver solo por nombre.

⚠️ El geojson es de ~2007: faltan distritos creados después (Veintiséis de
Octubre, Mi Perú, Neshuya, Constitución). Si no aparece, subir a provincia.

Implementado en `analisis/modelo_dashboard.py::resolver()`.

---

## 2. Fuentes

Clave de cruce: **`ubigeo` de 6 dígitos**.

| Fuente | Filas | Qué aporta | Clave |
|---|---|---|---|
| **Open-Meteo** (API en vivo) | — | Clima actual y pronóstico 16 días | lat/lon |
| `DATA_MAESTRA_UNIFICADA_RIESGOS_PERU - Sheet1.csv` | 1,891 | Población, camas, agua, riesgos | `UBIGEO` |
| `emergencias_2003_2020.parquet` | 96,447 | Emergencias oficiales, 30 columnas de daño | `UBIGEO_DISTRITO` |
| `data_coen_limpio.parquet` | 36,650 | Reportes COEN 2019-2026 | `departamento`+`distrito` |
| `dengue.csv` | 757,890 | Un caso por fila, distrito × semana, 2000-2023 | `ubigeo` |
| `openmeteo.parquet` | 206,496 | Clima histórico diario, 2003-2026 | `ubigeo` |
| `icen.txt` | 917 | Índice El Niño mensual, 1950-2026 | `anio`+`mes` |
| `distritos_area.csv` | 1,826 | Área km², para volumen de agua | `ubigeo` |
| `distritos_centroides.csv` | 1,826 | lat/lon para la API | `ubigeo` |
| `reglas_eventos.csv` | 78 | P(B\|A), lift, días entre eventos | `antes`+`despues` |
| `criticidad_damnificados.csv` | — | Reglas ordenadas por daño esperado | `antes`+`despues` |
| `umbrales_lluvia.csv` | — | Umbral operativo por departamento | `departamento` |
| `indeci.db` | 489 | SQLite, 12 categorías del portal | `categoria` |
| `Hackathon_data/Defunciones_Dengue.xlsx` | 25 | **Letalidad oficial por departamento** | `geo` |
| `Hackathon_data/Casos_Dengue.xlsx` | 26 | **Casos 2021-2026 (SE 28) por departamento** | `geo` |

⚠️ Los dos Excel son **departamentales**, no distritales, pero llegan a **2026**
mientras `dengue.csv` corta en 2023. Usarlos para calibrar el nivel actual y
para letalidad; nunca para desagregar a distrito.

### Columnas de la data maestra

```
POBLACION_TOTAL, POBLACION_MENOR_5, POBLACION_MAYOR_60
CAMAS_HOSPITALARIAS_TOTALES        31,205 nacionales; 72% de distritos con 0
CANT_EESS_TOTALES
PORCENTAJE_DEFICIT_AGUA_POTABLE    déficit de agua potable, real
CANT_RESERVORIOS_AGUA              proxy de almacenamiento domiciliario
CANT_PTAP_AGUA_TRATADA
PORCENTAJE_ANEMIA, PORCENTAJE_DESNUTRICION_INFANTIL
SUSCEPTIBILIDAD_INUNDACION_FEN     escala 1-5
NIVEL_RIESGO_INUNDACION_CONSOLIDADO   Bajo|Medio|Alto|Muy alto
SCORE_RIESGO_MOV_MASA_FEN, NIVEL_RIESGO_INCENDIO_FORESTAL
RED_VIAL_NACIONAL_KM, CANT_PUENTES, RED_AGUA_KM
```

### Columnas de daño (emergencias 2003-2020)

```
FALLECIDOS, DESAPARECIDOS, HERIDOS, DAMNIFICADOS, AFECTADOS
VIVIENDAS_DESTRUIDAS, VIVIENDAS_AFECTADAS
HAS_CULTIVO_DESTRUIDO, HAS_CULTIVO_AFECTADO
CENTROS_SALUD_DESTRUIDOS, CENTROS_SALUD_AFECTADOS
CARRETERA_AFECTADA_KM, CARRETERA_COLAPSADA_KM, PUENTE_COLAPSADO
AGUA_AFECTADA, DESAGUE_AFECTADO, CANAL_REGADIO_AFECTADO
PERDIDA_VACUNO, PERDIDA_CAPRINO, ...
COSTO_AYUDA_SOLES, PESO_AYUDA_KG
```

---

## 3. Vocabulario de eventos

⚠️ **Las dos fuentes usan taxonomías distintas.** Mapear siempre.

| Oficial (2003-2020) | COEN (2019-2026) |
|---|---|
| `HUAYCO` | `HUAICO` |
| `DERRUMBE DE CERRO` | `DERRUMBE` |
| `INCENDIO URB. E INDUST.` | `INCENDIO URBANO` |
| `LLUVIA INTENSA` | `LLUVIAS INTENSAS` |
| `INUNDACIÓN` | `INUNDACION` |
| `ALUD` | `ALUD/ALUVION` |
| `MAREJADA` | `OLEAJE ANOMALO` |
| `BAJAS TEMPERATURAS` | `HELADA` / `FRIAJE` / `DESCENSO DE TEMPERATURA` |

Grupos:

- **agua**: `LLUVIA INTENSA`, `INUNDACIÓN`, `HUAYCO`, `DESLIZAMIENTO`, `DERRUMBE DE CERRO`, `ALUD`, `EROSIÓN`
- **frío**: `HELADA`, `FRIAJE`, `DESCENSO DE TEMPERATURA` — **excluir `GRANIZADA`**
- **fuego**: `INCENDIO FORESTAL`

---

## 4. Flujo del agente

```
1. Resolver el distrito            → ubigeo, lat/lon, nivel
2. Consultar Open-Meteo            → clima_actual.py
3. Leer el clima contra su historia → percentiles del propio distrito
4. Caracterizar el agua            → mm, volumen m³, categoría, retorno
5. Estimar eventos                 → pipeline.py (dosis-respuesta + RF)
6. Estimar impacto                 → modelo_dashboard.py
7. Estimar epidemiología           → modelo_dengue.py (si aplica)
8. Cruzar exposición y capacidad   → data maestra
9. Armar el JSON con orígenes y notas
```

### Paso 2-3: clima actual

```bash
python analisis/clima_actual.py --ubigeo <U> --json
```

Devuelve, para **hoy** y para el pronóstico:

| Variable | Unidad | Para qué sirve |
|---|---|---|
| lluvia | mm | volumen de agua, gatillo de inundación |
| horas de lluvia | h | intensidad vs duración |
| prob. de lluvia | % | confianza del pronóstico |
| temp. máxima / mínima / media | °C | dengue (>24 °C), helada (<0 °C) |
| sensación máxima | °C | golpe de calor |
| humedad relativa | % | criaderos del vector |
| viento y ráfagas | km/h | propagación de incendio |
| radiación | MJ/m² | evaporación |
| evapotranspiración ET0 | mm | déficit hídrico, sequía |

Y **cada variable con su percentil contra la historia del distrito**. Eso es lo
que permite decir si 18 mm es extremo o rutina — en Lima es histórico, en
Iquitos es un martes.

También devuelve `ultimos_30_dias` con lluvia acumulada y días secos: es la
**saturación del suelo**, y en el modelo pesa más que la lluvia del día
(`lluv30` fue la variable más importante, 0.141).

### Paso 4: agua

```
volumen_m3 = mm × area_km2 × 1000
```

`area_km2` de `distritos_area.csv`. Validado: 1,286,117 km² contra 1,285,216
oficiales, 0.1 % de error.

Categoría por percentil local: sin lluvia · normal (≥0.50) · fuerte (≥0.90) ·
muy fuerte (≥0.98) · extrema (≥0.995).

### Paso 5: eventos

```bash
python analisis/pipeline.py --ubigeo <U> --json
```

Devuelve tres lecturas. **Para el dashboard usar `p_modelo_rf`**:

- `p_evento_hidro_7d` — curva dosis-respuesta **nacional** por percentil, base 5.3 %
- `p_por_mm_absolutos` — la misma en mm; discrimina 6.6× contra 2.1×
- `p_modelo_rf` — Random Forest **por distrito**, usa la historia local

Difieren legítimamente. Independencia (Áncash) tiene tasa base histórica de
**14.6 %**, así que el RF da 31 % mientras la curva nacional da 0.93 %.
**No mostrarlas juntas sin explicar.**

### Paso 6: impacto

```bash
python analisis/modelo_dashboard.py --predecir --ubigeo <U> --json
```

Devuelve `si_ocurre` (magnitud condicional) y `esperado` (× probabilidad).

⚠️ **Los regresores subestiman**: predicen 8.4 afectados cuando el real medio es
78.6. Sirven para ordenar prioridades, no para dimensionar la respuesta.
Decirlo en `notas` cada vez que se usen.

### Paso 7: epidemiología

```bash
python analisis/modelo_dengue.py --proyectar --ubigeo <U> --escenario <E> --json
```

**Solo confiable desde la semana 8.** A 1-4 semanas pierde contra repetir el
último dato observado. Devolver siempre `horizonte_confiable_desde_sem: 8`.

La **semana del pico** se reporta como rango, no como número: el modelo acierta
el nivel pero no el timing (correlación 0.022 a 12 semanas).

`%alarma` y `%grave` se **calculan de `dengue.csv`**, no se asumen. Nacional:
10.7 % y 0.4 %; varía por distrito (Ucayali: 17.3 % y 0.7 %).

### Paso 8: capacidad

```
camas       = DATA_MAESTRA.CAMAS_HOSPITALARIAS_TOTALES   (dato)
internados  = casos × (%alarma × frac_internada + %grave × 1.0)
camas_dia   = internados × dias_estancia / 7
saturacion  = 100 × camas_dia / camas
```

Si `camas == 0` → `saturacion: null`, nunca infinito. **72 % de los distritos
tienen cero camas**: en ese caso agregar a nivel provincia y advertirlo.

Nivel de riesgo: `CRITICO` ≥100 % · `ALTO` ≥60 % · `MEDIO` ≥30 % · `BAJO` <30 %

---

## 5. JSON de salida

```jsonc
{
  "consulta": {
    "distrito": "CATACAOS",
    "provincia": "PIURA",
    "departamento": "PIURA",
    "ubigeo": "200104",
    "resuelto_por": "ubigeo",
    "lat": -5.2686, "lon": -80.6789,
    "enfermedad": "DENGUE",
    "evento": "INUNDACION",
    "escenario": "moderado",
    "generado": "2026-08-01T14:30:00"
  },

  "clima_actual": {
    "fuente": "Open-Meteo (ECMWF)",
    "lluvia":              {"valor": 18.2, "unidad": "mm",    "percentil": 0.97, "origen": "dato"},
    "horas_lluvia":        {"valor": 6.0,  "unidad": "h",     "origen": "dato"},
    "prob_lluvia":         {"valor": 85,   "unidad": "%",     "origen": "dato"},
    "temp_maxima":         {"valor": 31.4, "unidad": "C",     "percentil": 0.88, "origen": "dato"},
    "temp_minima":         {"valor": 22.1, "unidad": "C",     "percentil": 0.91, "origen": "dato"},
    "temp_media":          {"valor": 26.3, "unidad": "C",     "percentil": 0.90, "origen": "dato"},
    "sensacion_maxima":    {"valor": 34.0, "unidad": "C",     "origen": "dato"},
    "humedad_relativa":    {"valor": 78.5, "unidad": "%",     "origen": "dato"},
    "viento":              {"valor": 14.2, "unidad": "km/h",  "origen": "dato"},
    "rafagas":             {"valor": 38.5, "unidad": "km/h",  "origen": "dato"},
    "radiacion":           {"valor": 21.3, "unidad": "MJ/m2", "origen": "dato"},
    "evapotranspiracion":  {"valor": 4.8,  "unidad": "mm",    "origen": "dato"}
  },

  "pronostico_7d": {
    "lluvia_total_mm":     {"valor": 42.5, "origen": "dato"},
    "lluvia_max_dia_mm":   {"valor": 18.2, "origen": "dato"},
    "dia_mas_lluvioso":    {"valor": "2026-08-04", "origen": "dato"},
    "dias_con_lluvia":     {"valor": 4,    "origen": "dato"},
    "temp_max_maxima":     {"valor": 32.1, "origen": "dato"},
    "temp_min_minima":     {"valor": 20.8, "origen": "dato"},
    "rafaga_max_kmh":      {"valor": 45.0, "origen": "dato"},
    "humedad_media_pct":   {"valor": 76.2, "origen": "dato"},
    "serie": [
      {"fecha": "2026-08-01", "lluvia_mm": 2.1, "temp_max": 30.2, "temp_min": 21.5}
    ]
  },

  "contexto_30d": {
    "lluvia_acumulada_mm": {"valor": 96.4, "percentil": 0.93, "origen": "dato"},
    "dias_secos":          {"valor": 18,   "origen": "dato"},
    "temp_media":          {"valor": 25.8, "origen": "dato"},
    "comentario": "Suelo saturado: la lluvia de 30 días está en el percentil 0.93 del distrito. Es la variable con más peso en el modelo."
  },

  "agua": {
    "mm_acumulado_7d":      {"valor": 42.5,     "origen": "dato"},
    "volumen_m3":           {"valor": 12750000, "origen": "dato"},
    "volumen_hm3":          {"valor": 12.75,    "origen": "dato"},
    "area_km2":             {"valor": 300.0,    "origen": "dato"},
    "percentil_local":      {"valor": 0.97,     "origen": "dato"},
    "categoria":            {"valor": "muy fuerte", "origen": "dato"},
    "periodo_retorno_anios":{"valor": 0.09,     "origen": "dato"}
  },

  "eventos": {
    "p_evento_hidro_7d": {"valor": 0.184, "origen": "modelo", "modelo": "RandomForest por distrito"},
    "tasa_base_distrito":{"valor": 0.146, "origen": "dato", "comentario": "frecuencia histórica de semanas con evento"},
    "encadenados": [
      {"evento": "INUNDACION", "p_condicional": 0.015, "lift": 5.7,
       "dias_mediana": 5, "dias_p25_p75": "3-7", "origen": "dato"},
      {"evento": "DESLIZAMIENTO", "p_condicional": 0.022, "lift": 4.5,
       "dias_mediana": 5, "dias_p25_p75": "2-6", "origen": "dato"}
    ]
  },

  "impacto": {
    "fallecidos":             {"si_ocurre": 0.13, "esperado": 0.024, "origen": "modelo"},
    "desaparecidos":          {"si_ocurre": 0.02, "esperado": 0.004, "origen": "modelo"},
    "heridos":                {"si_ocurre": 0.10, "esperado": 0.018, "origen": "modelo"},
    "damnificados":           {"si_ocurre": 0.32, "esperado": 0.059, "origen": "modelo"},
    "afectados":              {"si_ocurre": 7.63, "esperado": 1.404, "origen": "modelo"},
    "viviendas_destruidas":   {"si_ocurre": 0.28, "esperado": 0.052, "origen": "modelo"},
    "viviendas_afectadas":    {"si_ocurre": 1.62, "esperado": 0.298, "origen": "modelo"},
    "has_cultivo_destruido":  {"si_ocurre": 0.11, "esperado": 0.020, "origen": "modelo"},
    "has_cultivo_afectado":   {"si_ocurre": 0.08, "esperado": 0.015, "origen": "modelo"},
    "centros_salud_afectados":{"si_ocurre": 0.00, "esperado": 0.000, "origen": "modelo"},
    "costo_ayuda_soles":      {"si_ocurre": 373.3,"esperado": 68.7,  "origen": "modelo"}
  },

  "epidemiologia": {
    "casos_proyectados_12sem": {"valor": 31747, "origen": "modelo",
                                "horizonte_confiable_desde_sem": 8},
    "pico_semanal":            {"valor": 18494, "origen": "modelo"},
    "semana_pico":             {"valor": 10, "rango": [8, 12], "origen": "modelo"},
    "rt_actual":               {"valor": 1.42, "origen": "modelo"},
    "incidencia_100mil":       {"valor": 283.2, "origen": "dato"},
    "pct_con_alarma":          {"valor": 10.7,  "origen": "dato"},
    "pct_grave":               {"valor": 0.4,   "origen": "dato"},
    "defunciones_historicas":  {"valor": 3,     "origen": "dato"},
    "letalidad_pct":           {"valor": 0.05,  "origen": "dato"},
    "serie_semanal": [{"semana_rel": 1, "casos": 1240}]
  },

  "capacidad": {
    "camas_disponibles":  {"valor": 1135, "origen": "dato"},
    "establecimientos":   {"valor": 187,  "origen": "dato"},
    "internados_en_pico": {"valor": 612,  "origen": "modelo+supuesto"},
    "saturacion_pct":     {"valor": 30.8, "origen": "modelo+supuesto"},
    "nivel_riesgo":       {"valor": "MEDIO", "origen": "derivado"}
  },

  "exposicion": {
    "poblacion_total":          {"valor": 78000, "origen": "dato"},
    "poblacion_menor_5":        {"valor": 8100,  "origen": "dato"},
    "poblacion_mayor_60":       {"valor": 9400,  "origen": "dato"},
    "deficit_agua_potable_pct": {"valor": 42.3,  "origen": "dato"},
    "reservorios_agua":         {"valor": 12,    "origen": "dato"},
    "ptap_agua_tratada":        {"valor": 1,     "origen": "dato"},
    "anemia_pct":               {"valor": 40.1,  "origen": "dato"},
    "desnutricion_infantil_pct":{"valor": 18.7,  "origen": "dato"},
    "riesgo_inundacion":        {"valor": "Alto","origen": "dato"},
    "riesgo_mov_masa":          {"valor": "Medio","origen": "dato"},
    "riesgo_incendio_forestal": {"valor": "Bajo","origen": "dato"}
  },

  "economia": {
    "ayuda_indeci_esperada_soles": {"valor": 88, "origen": "modelo",
                              "comentario": "transferencia de ayuda INDECI, NO costo del desastre"},
    "impacto_directo_soles":  {"valor": null, "origen": "sin_dato"},
    "costo_atencion_soles":   {"valor": null, "origen": "sin_dato"},
    "inversion_preventiva_soles": {"valor": null, "origen": "sin_dato"},
    "ahorro_preventivo_soles":{"valor": null, "origen": "sin_dato"},
    "cultivos_por_tipo":      {"valor": null, "origen": "sin_dato"},
    "_prueba_nulo": "Se regresó COSTO_AYUDA_SOLES contra los 8 componentes de daño en 18,306 eventos: R2 = 0.001. La ayuda INDECI no guarda relación con el daño físico."
  },

  "supuestos_usados": {
    "frac_alarma_internada": 0.30,
    "frac_grave_internada": 1.00,
    "dias_estancia": 4.0,
    "costo_soles_por_caso": 850.0,
    "costo_soles_por_internado": 4200.0
  },

  "notas": [
    "Resuelto por ubigeo exacto.",
    "La lluvia de los últimos 30 días está en el percentil 0.93: el suelo llega saturado.",
    "La proyección de dengue es confiable desde la semana 8; antes conviene mostrar el último dato observado.",
    "La semana del pico se reporta como rango: el modelo acierta el nivel, no el timing.",
    "Los valores de impacto subestiman la magnitud real; sirven para priorizar, no para dimensionar."
  ],

  "advertencias": []
}
```

---

## 6. Reglas que el agente debe respetar

**Incertidumbre**

1. Todo valor lleva `origen`. Si es `supuesto` o `modelo+supuesto`, el supuesto
   va en `supuestos_usados`.
2. Los regresores de impacto **subestiman** (8.4 contra 78.6 afectados reales).
   Decirlo en `notas` cuando se usen.
3. Solo **24 distritos** tienen clima histórico cargado y **13** tienen clima y
   dengue. Si el distrito no está, decirlo y ofrecer el agregado provincial.
   El clima **actual** de Open-Meteo sí funciona para cualquier distrito.

**Geografía**

4. Nunca resolver por nombre de distrito sin departamento.
5. Ubigeo siempre a 6 dígitos con `zfill(6)`.
6. Si se resolvió por provincia o departamento, decirlo en `notas`: la
   predicción usa el punto de referencia, no el distrito exacto.

**Eventos**

7. Mapear la taxonomía antes de cruzar las dos fuentes (§3).
8. Para frío, **excluir `GRANIZADA`**: es el 49 % de "bajas temperaturas" y pica
   en diciembre-marzo, al revés que la helada.
9. `data_coen_limpio` tiene 52 % de reportes de seguimiento. Para **contar
   emergencias**, colapsar por distrito+evento con ventana de 15 días.

**Prohibido**

10. No mostrar serotipo: no está en ninguna fuente.
11. No mostrar Rt mayor a 8 para dengue — el rango creíble es 0.5 a 6.
12. No presentar la curva nacional y el RF por distrito como el mismo número.
13. No sumar `CARRETERA_AFECTADA_KM` sin limpiar: hay unidades inconsistentes,
    con valores hasta 613,000.
14. No usar `edad` de `dengue.csv` sin filtrar `edad <= 110`: hay 14 filas con
    edades imposibles, hasta 71,963,641.
15. Si `camas == 0`, `saturacion` es `null`, nunca infinito.
16. **No inventar impacto económico.** `impacto_directo_soles`, `costo_atencion`,
    `inversion_preventiva`, `ahorro_preventivo` y valor de cultivos van en `null`.
    Ver §10.
17. **Apagar la sección de huaico/deslizamiento** cuando
    `NIVEL_RIESGO_MOV_MASA_FEN == "Bajo"` y no hay eventos de ese tipo en el
    histórico del distrito. Es «no corresponde a la geografía», no «no ocurrirá».
    Mostrar ceros ahí miente por omisión.
18. **Verificar que la probabilidad sea monótona** en 7 < 15 < 30 días. Son tres
    clasificadores independientes y pueden salir invertidos (pasó en Tambopata:
    72.2 % a 15 d contra 71.1 % a 30 d). Si se invierte, reportarlo, no ocultarlo.
19. **Rt se reporta como p90, nunca como máximo.** El máximo crudo llega a 23-58
    porque divide entre semanas de casi cero casos.
20. **No redondear los impactos fraccionarios a cero.** 0.11 damnificados es un
    valor esperado correcto; redondearlo da falsa precisión en sentido contrario.
21. Distinguir siempre **camas totales** de **camas disponibles**. No hay dato de
    ocupación: `camas_disponibles` va en `null`.

---

## 7. Herramientas

```bash
cd analisis

python clima_actual.py --ubigeo 200104 --json          # clima en vivo
python pipeline.py --ubigeo 200104 --json              # agua + eventos + impacto
python modelo_dengue.py --proyectar --ubigeo 200104 --json
python modelo_dashboard.py --predecir --ubigeo 200104 --json
python reglas.py --con-dengue                          # encadenamientos
python criticidad.py --metrica damnificados            # ordenado por daño
python umbrales_lluvia.py --peligro lluvia             # umbral por departamento
python inventario.py                                   # qué fuentes hay hoy
```

Todos aceptan `--autotest` y `--sin-red` donde aplica. Ante un fallo, correr el
autotest antes de reportar: distingue problema de datos de problema de código.

---

## 8. Cómo debe razonar el agente

No basta con devolver números. El agente tiene que **leer el clima y explicar
qué significa** para ese distrito.

**Ejemplo de razonamiento esperado:**

> Catacaos tiene 18.2 mm hoy, percentil 0.97 de su historia — es de los días
> más lluviosos que registra. Los últimos 30 días acumulan 96.4 mm, percentil
> 0.93, así que el suelo ya está saturado y esa es la variable que más pesa en
> el modelo. Sobre 300 km² la lluvia de los próximos 7 días son 12.75 hm³ de
> agua. Con esas condiciones el modelo da 18.4 % de probabilidad de evento
> hidro-geológico, contra una tasa base histórica del distrito de 14.6 %.
> Si ocurre inundación, el encadenamiento hacia deslizamiento tiene lift 4.5×
> con mediana de 5 días. El 42.3 % del distrito tiene déficit de agua potable,
> lo que fuerza almacenamiento domiciliario y alimenta criaderos: por eso el
> eslabón de dengue a 8-12 semanas es relevante acá.

Ese párrafo va en el campo `resumen_ejecutivo` del JSON.

**Lo que el agente NO debe hacer**: presentar la probabilidad sin la tasa base,
mostrar impacto sin advertir que subestima, o proyectar dengue a 2 semanas.

---

## 9. Consultas de ejemplo

**"¿Qué riesgo hay en Catacaos esta semana?"**
→ `clima_actual.py` + `pipeline.py`
→ Bloques `clima_actual`, `pronostico_7d`, `agua`, `eventos`, `impacto`, `exposicion`.

**"¿Cómo viene el dengue en este distrito?"**
→ `modelo_dengue.py --proyectar`
→ Bloques `epidemiologia`, `capacidad`, `economia`. Advertir el horizonte de 8 semanas.

**"Si hay un huaico acá, ¿qué sigue?"**
→ `reglas_eventos.csv` con `antes == HUAICO`, ordenado por `criticidad_damnificados.csv`.
→ Bloque `eventos.encadenados`.

**"¿Está lloviendo más de lo normal?"**
→ `clima_actual.py --json`
→ Bloques `clima_actual` y `contexto_30d`, con los percentiles. Responder con
   el percentil, no con los milímetros sueltos.

---

## 10. Campos derivados — fórmula y tabla origen

Estos **no salen directo de una tabla**: se calculan. Cada uno lleva su fórmula
para que sea auditable y su marca de origen.

| Campo | Fórmula | Tabla origen | Origen |
|---|---|---|---|
| `anomalia_lluvias_pct` | `100 × (lluvia_365d / mediana_anual − 1)` | `openmeteo.parquet` | derivado |
| `volumen_hm3` | `mm × area_km2 × 1000 / 1e6` | `distritos_area.csv` | derivado |
| `rt` | `exp(r × Tg)`, `Tg = 20 d`, `r` = log-crecimiento semanal suavizado a 3 sem | `dengue.csv` | derivado |
| `fallecidos_estimados` | `damnificados × tasa/1000` (ver tabla ↓) | `emergencias_2003_2020` | derivado |
| `heridos_estimados` | `damnificados × tasa/1000` (ver tabla ↓) | `emergencias_2003_2020` | derivado |
| `personas_desplazadas` | `= DAMNIFICADOS` | `emergencias_2003_2020` | dato |
| `familias_sin_techo` | `damnificados / 3.8` | ídem | derivado |
| `acceso_agua_potable_pct` | `100 − PORCENTAJE_DEFICIT_AGUA_POTABLE` | data maestra | derivado |
| `prob_interrupcion_agua_pct` | frecuencia de `AGUA_AFECTADA > 0` en eventos hídricos | `emergencias_2003_2020` | derivado |
| `saturacion_pct` | `casos × (%alarma × 0.30 + %grave) × 4 / 7 / camas × 100` | dengue + maestra | modelo+supuesto |

### Tasas de letalidad empíricas por tipo de evento

Por cada **1,000 damnificados**, medidas sobre 36,939 eventos hídricos 2003-2020:

| Evento | n | Fallecidos | Heridos |
|---|---|---|---|
| `DESLIZAMIENTO` | 3,657 | 6.11 | 11.91 |
| `HUAYCO` | 2,270 | 2.91 | 9.03 |
| `LLUVIA INTENSA` | 25,231 | 0.78 | 4.14 |
| `INUNDACIÓN` | 5,781 | 0.28 | 0.56 |

**Usar esto en vez del regresor de `FALLECIDOS`**, que colapsa a cero en la
mayoría de distritos y devuelve `0.00` como si fuera una predicción.

Letalidad de **dengue**: de `Defunciones_Dengue.xlsx` por departamento. Nacional
0.097 %. Si el departamento no aparece, usar el nacional como piso, nunca 0.

### Por qué lo económico va en `null`

Se regresó `COSTO_AYUDA_SOLES` (positivo, sin intercepto) contra los ocho
componentes de daño — damnificados, afectados, viviendas destruidas y afectadas,
hectáreas destruidas y afectadas, carretera afectada, puentes — sobre los 18,306
eventos con costo mayor a cero.

```
R² = 0.001
```

Los coeficientes implícitos que salen son absurdos: S/ 9.11 por damnificado,
S/ 1.63 por kilómetro de carretera. **La ayuda INDECI no guarda relación con el
daño físico.** Cualquier cifra de impacto económico tendría que venir de precios
externos citados como supuesto explícito, jamás presentarse como resultado.

### Sin dato en ninguna fuente

`serotipo_dominante` · `eficiencia_control_vectorial_pct` ·
`desabastecimiento_insumos_pct` · `cultivos` por tipo y valor ·
`personal_salud_por_1000hab` (RENIPRESS lista establecimientos, no dotación) ·
`albergues_requeridos` (la capacidad por albergue es constante externa) ·
`ahorro`/`inversion_preventiva` · `camas_disponibles`.

Devolverlos como `null` con `origen: "sin_dato"` y la razón en `notas`.
Nunca omitir la clave: si desaparece del JSON, el dashboard asume que está cubierta.

---

## 11. Salida de ejemplo validada

`ejemplo_nuevo_chimbote.json` — Nuevo Chimbote (021809), corrido de punta a punta
con estas reglas. Sirve como contrato: si el agente produce algo con esa forma,
está bien.

`dashboard_nuevo_chimbote.html` — el mismo JSON renderizado, con cada valor
mostrando su marca de origen y las secciones nulas visibles en gris en vez de
ocultas.
