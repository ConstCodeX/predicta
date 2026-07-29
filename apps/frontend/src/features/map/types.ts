export type NivelRiesgoGlobal = 'ALTO' | 'MEDIO' | 'BAJO';

// Tipos para alertas de pronóstico IA
export type TipoAlertaForecast =
  | 'DESABASTECIMIENTO'
  | 'LLUVIAS_EXTREMAS'
  | 'INUNDACION'
  | 'MOVIMIENTO_MASA'
  | 'SALUD_PUBLICA'
  | 'AGUA_SANEAMIENTO';

// Tipos basados en las familias reales del INDECI
export type TipoAlertaFamilia =
  | 'HIDROMETEOROLOGICO'
  | 'MOVIMIENTO_DE_MASA'
  | 'BAJAS_TEMPERATURAS'
  | 'INCENDIO'
  | 'GEOFISICO'
  | 'BIOLOGICO'
  | 'ANTROPICO'
  | 'TECNOLOGICO';

export type TipoAlerta = TipoAlertaForecast | TipoAlertaFamilia;

export interface AlertaMapa {
  departamento: string;
  distrito?: string | null;
  tipo_alerta: TipoAlerta;
  /** Entero 1 (leve) → 5 (crítico) */
  severidad: number;
  /** Entero 0-100 */
  probabilidad_porcentaje: number;
  descripcion: string;
  acciones_sugeridas: string[];
}

export interface ForecastResponse {
  analisis_general: string;
  nivel_riesgo_global: NivelRiesgoGlobal;
  alertas_mapa: AlertaMapa[];
}

export interface ForecastQuery {
  query: string;
  departamento?: string;
  familiaEvento?: string;
  anioDesde?: number;
  anioHasta?: number;
}
