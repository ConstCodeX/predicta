/**
 * Contrato de salida del agente `dengue-seir`.
 * Debe coincidir con SEIRModelResponse del frontend
 * (apps/frontend/src/features/seir-model/seir-types.ts).
 * Se anexa al prompt para forzar la forma exacta del JSON.
 */
export const SEIR_OUTPUT_CONTRACT = `{
  "region": "string",
  "escenario": "string",
  "generado_en": "ISO-8601 string",
  "ventana_semanas": "number (12 o 16)",
  "parametros_usados": {
    "anomalia_lluvias_pct": "number",
    "anomalia_temperatura_c": "number",
    "enos_intensidad": "'neutro' | 'moderado' | 'fuerte'",
    "racionamiento_agua_pct": "number",
    "eficiencia_control_vectorial_pct": "number",
    "desabastecimiento_insumos_pct": "number",
    "serotipo_dominante": "'DEN-1' | 'DEN-2' | 'DEN-3' | 'DEN-4'"
  },
  "kpis": {
    "casos_proyectados_total": "number",
    "pico_semana": "number",
    "maximo_semanal_casos": "number",
    "saturacion_hospitalaria_pct": "number",
    "nivel_riesgo": "'bajo' | 'moderado' | 'critico'",
    "impacto_economico_soles": "number",
    "impacto_economico_usd": "number",
    "ahorro_preventivo_soles": "number",
    "rt_maximo": "number",
    "camas_disponibles": "number"
  },
  "proyeccion_semanal": [
    {
      "semana": "number",
      "casos_proyectados": "number",
      "hospitalizados_requeridos": "number",
      "tasa_rt": "number",
      "es_historico": "boolean (true para S1-S4 histórico, false para proyección)"
    }
  ],
  "humanitario": {
    "fallecidos_estimados": "number",
    "heridos_graves": "number",
    "personas_desplazadas": "number",
    "personas_en_riesgo": "number",
    "acceso_agua_potable_pct": "number",
    "personal_salud_por_1000hab": "number",
    "albergues_requeridos": "number"
  },
  "economico": {
    "impacto_total_soles": "number",
    "costo_atencion_soles": "number",
    "inversion_preventiva_soles": "number",
    "cultivos": {
      "arroz_has": "number",
      "mango_has": "number",
      "platano_has": "number",
      "total_valor_soles": "number"
    },
    "infraestructura": {
      "carreteras_afectadas_km": "number",
      "puentes_danados": "number",
      "viviendas_afectadas": "number"
    }
  },
  "distribucion_geografica": [
    { "ciudad": "string", "lat": "number", "lng": "number", "casos": "number", "pct": "number" }
  ],
  "alertas": ["string"],
  "notas_metodologicas": "string",
  "explicacion_pronostico": "string — párrafo de 4-6 oraciones en español explicando: (1) de qué datos reales partió el modelo, (2) qué factores climáticos/operacionales más influyeron en el resultado, (3) cómo se construyó la curva epidémica (nivel base, ajuste ENOS, Rt), (4) qué significa el nivel de riesgo obtenido y qué acciones se recomiendan. Lenguaje técnico pero comprensible para funcionarios de salud pública."
}`;
