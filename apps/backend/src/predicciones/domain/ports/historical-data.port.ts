export interface HistoricalDataFilters {
  departamento?: string;
  familiaEvento?: string;
  anioDesde?: number;
  anioHasta?: number;
}

export interface HistoricalEventSummary {
  departamento: string;
  evento: string;
  familiaEvento?: string;
  anio: number;
  distrito?: string;
  ocurrencias: number;
}

export interface IHistoricalDataPort {
  findRelevantEvents(filters: HistoricalDataFilters): Promise<HistoricalEventSummary[]>;
}

export const HISTORICAL_DATA_PORT = Symbol('IHistoricalDataPort');
