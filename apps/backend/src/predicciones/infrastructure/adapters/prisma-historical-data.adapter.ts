import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  IHistoricalDataPort,
  HistoricalDataFilters,
  HistoricalEventSummary,
} from '../../domain/ports/historical-data.port';

@Injectable()
export class PrismaHistoricalDataAdapter implements IHistoricalDataPort {
  constructor(private readonly prisma: PrismaService) {}

  async findRelevantEvents(
    filters: HistoricalDataFilters,
  ): Promise<HistoricalEventSummary[]> {
    // groupBy agrega los eventos para que el contexto del LLM sea conciso
    // y no explote el context window con miles de filas crudas
    const results = await this.prisma.reporteEmergencia.groupBy({
      by: ['departamento', 'evento', 'familiaEvento', 'anio', 'distrito'],
      where: this.buildWhere(filters),
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 200,
    });

    return results.map((r) => ({
      departamento: r.departamento,
      evento: r.evento,
      familiaEvento: r.familiaEvento ?? undefined,
      anio: r.anio,
      distrito: r.distrito ?? undefined,
      ocurrencias: r._count.id,
    }));
  }

  private buildWhere(
    filters: HistoricalDataFilters,
  ): Prisma.ReporteEmergenciaWhereInput {
    const where: Prisma.ReporteEmergenciaWhereInput = {};
    if (filters.departamento)
      where.departamento = { contains: filters.departamento, mode: 'insensitive' };
    if (filters.familiaEvento)
      where.familiaEvento = { contains: filters.familiaEvento, mode: 'insensitive' };
    if (filters.anioDesde !== undefined || filters.anioHasta !== undefined) {
      where.anio = {
        ...(filters.anioDesde !== undefined && { gte: filters.anioDesde }),
        ...(filters.anioHasta !== undefined && { lte: filters.anioHasta }),
      };
    }
    return where;
  }
}
