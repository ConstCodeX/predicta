export interface PredictionType {
  id: string;
  label: string;
  descripcion: string;
  icono: string;
}

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

export const NIVEL_COLOR: Record<NivelRiesgo, string> = {
  sin_dato: 'oklch(0.38 0 0)',
  bajo:    '#fbbf24',
  medio:   '#f97316',
  alto:    '#ef4444',
};

export const NIVEL_BG: Record<NivelRiesgo, string> = {
  sin_dato: 'rgba(255,255,255,0.04)',
  bajo:    'rgba(251,191,36,0.08)',
  medio:   'rgba(249,115,22,0.10)',
  alto:    'rgba(239,68,68,0.12)',
};

export const NIVEL_LABEL: Record<NivelRiesgo, string> = {
  sin_dato: 'sin dato',
  bajo:    'bajo',
  medio:   'medio',
  alto:    'alto',
};
