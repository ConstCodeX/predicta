import { Injectable, Inject } from '@nestjs/common';
import {
  IReporteRepository,
  REPORTE_REPOSITORY_PORT,
} from '../../../domain/ports/reporte.repository.port';
import { ReporteEmergencia } from '../../../domain/entities/reporte.entity';
import { ObtenerReportePorIdQuery } from './obtener-reporte-por-id.dto';

@Injectable()
export class ObtenerReportePorIdUseCase {
  constructor(
    @Inject(REPORTE_REPOSITORY_PORT)
    private readonly reporteRepo: IReporteRepository,
  ) {}

  async execute(query: ObtenerReportePorIdQuery): Promise<ReporteEmergencia | null> {
    return this.reporteRepo.findById(query.id);
  }
}
