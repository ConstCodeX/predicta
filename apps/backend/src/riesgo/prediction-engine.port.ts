import type { PredictionType } from './prediction-types';
import type { PredictionResponse } from './prediction-result.dto';

export const PREDICTION_ENGINE_PORT = 'PREDICTION_ENGINE_PORT';

export interface HistorialDistrict {
  distrito: string;
  departamento: string;
  eventosAnual: number;
  mesMaximo: number;
  frecuenciaMes: Record<number, number>;
}

export interface PredictionContext {
  tipo: PredictionType;
  ventanaDias: number;
  fechaActual: string;
  historialAgregado: HistorialDistrict[];
}

export interface IPredictionEngine {
  predict(ctx: PredictionContext): Promise<PredictionResponse>;
}
