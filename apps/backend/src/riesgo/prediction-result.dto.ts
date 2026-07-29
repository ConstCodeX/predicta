export type NivelRiesgo = 'sin_dato' | 'bajo' | 'medio' | 'alto';

export interface DistrictPrediction {
  distrito: string;
  departamento: string;
  probabilidad_pct: number;
  x_base: number;
  lluvia_estimada_mm: number;
  dia_pico: string;
  nivel: NivelRiesgo;
}

export interface PredictionResponse {
  tipo: string;
  tipo_label: string;
  ventana_dias: number;
  generado_en: string;
  resumen: string;
  predicciones: DistrictPrediction[];
}
