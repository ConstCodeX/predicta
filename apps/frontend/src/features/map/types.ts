export type NivelRiesgoGlobal = 'ALTO' | 'MEDIO' | 'BAJO';

export type TipoAlerta =
  | 'DESABASTECIMIENTO'
  | 'LLUVIAS_EXTREMAS'
  | 'INUNDACION'
  | 'MOVIMIENTO_MASA';

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
