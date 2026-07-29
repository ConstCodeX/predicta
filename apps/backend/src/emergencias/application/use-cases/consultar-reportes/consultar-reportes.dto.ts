export interface ConsultarReportesQuery {
  departamento?: string;
  familiaEvento?: string;
  evento?: string;
  tipoReporte?: string;
  anioDesde?: number;
  anioHasta?: number;
  page?: number;
  pageSize?: number;
}
