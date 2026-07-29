import { ReporteEmergencia } from '../entities/reporte.entity';

export interface ReporteFilters {
  departamento?: string;
  familiaEvento?: string;
  evento?: string;
  tipoReporte?: string;
  anioDesde?: number;
  anioHasta?: number;
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface IReporteRepository {
  save(reporte: ReporteEmergencia): Promise<ReporteEmergencia>;
  saveBatch(reportes: ReporteEmergencia[]): Promise<number>;
  findAll(
    filters: ReporteFilters,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<ReporteEmergencia>>;
  findById(id: string): Promise<ReporteEmergencia | null>;
  count(filters: ReporteFilters): Promise<number>;
}

export const REPORTE_REPOSITORY_PORT = Symbol('IReporteRepository');
