import { Injectable, Inject } from '@nestjs/common';
import {
  IReporteRepository,
  REPORTE_REPOSITORY_PORT,
  PaginatedResult,
} from '../../../domain/ports/reporte.repository.port';
import { ReporteEmergencia } from '../../../domain/entities/reporte.entity';
import { ConsultarReportesQuery } from './consultar-reportes.dto';

@Injectable()
export class ConsultarReportesUseCase {
  constructor(
    @Inject(REPORTE_REPOSITORY_PORT)
    private readonly reporteRepo: IReporteRepository,
  ) {}

  async execute(query: ConsultarReportesQuery): Promise<PaginatedResult<ReporteEmergencia>> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));

    return this.reporteRepo.findAll(
      {
        departamento: query.departamento,
        familiaEvento: query.familiaEvento,
        evento: query.evento,
        tipoReporte: query.tipoReporte,
        anioDesde: query.anioDesde,
        anioHasta: query.anioHasta,
      },
      { page, pageSize },
    );
  }
}
