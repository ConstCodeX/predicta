export interface GenerateForecastCommand {
  query: string;
  departamento?: string;
  familiaEvento?: string;
  anioDesde?: number;
  anioHasta?: number;
}
