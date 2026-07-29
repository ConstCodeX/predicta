import { Injectable } from '@nestjs/common';
import { Prisma, type ReporteEmergencia as PrismaRecord } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  IReporteRepository,
  ReporteFilters,
  PaginationOptions,
  PaginatedResult,
} from '../../domain/ports/reporte.repository.port';
import { ReporteEmergencia } from '../../domain/entities/reporte.entity';

@Injectable()
export class PrismaReporteRepository implements IReporteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(reporte: ReporteEmergencia): Promise<ReporteEmergencia> {
    const record = await this.prisma.reporteEmergencia.create({
      data: this.toRecord(reporte),
    });
    return this.toDomain(record);
  }

  async saveBatch(reportes: ReporteEmergencia[]): Promise<number> {
    const result = await this.prisma.reporteEmergencia.createMany({
      data: reportes.map((r) => this.toRecord(r)),
      skipDuplicates: false,
    });
    return result.count;
  }

  async findAll(
    filters: ReporteFilters,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<ReporteEmergencia>> {
    const where = this.buildWhere(filters);
    const skip = (pagination.page - 1) * pagination.pageSize;

    const [records, total] = await this.prisma.$transaction([
      this.prisma.reporteEmergencia.findMany({
        where,
        skip,
        take: pagination.pageSize,
        orderBy: [{ anio: 'desc' }, { departamento: 'asc' }],
      }),
      this.prisma.reporteEmergencia.count({ where }),
    ]);

    return {
      data: records.map((r) => this.toDomain(r)),
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: Math.ceil(total / pagination.pageSize),
    };
  }

  async findById(id: string): Promise<ReporteEmergencia | null> {
    const record = await this.prisma.reporteEmergencia.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  async count(filters: ReporteFilters): Promise<number> {
    return this.prisma.reporteEmergencia.count({ where: this.buildWhere(filters) });
  }

  private buildWhere(filters: ReporteFilters): Prisma.ReporteEmergenciaWhereInput {
    const where: Prisma.ReporteEmergenciaWhereInput = {};
    if (filters.departamento)
      where.departamento = { contains: filters.departamento, mode: 'insensitive' };
    if (filters.familiaEvento)
      where.familiaEvento = { contains: filters.familiaEvento, mode: 'insensitive' };
    if (filters.evento) where.evento = { contains: filters.evento, mode: 'insensitive' };
    if (filters.tipoReporte)
      where.tipoReporte = { contains: filters.tipoReporte, mode: 'insensitive' };
    if (filters.anioDesde !== undefined || filters.anioHasta !== undefined) {
      where.anio = {
        ...(filters.anioDesde !== undefined && { gte: filters.anioDesde }),
        ...(filters.anioHasta !== undefined && { lte: filters.anioHasta }),
      };
    }
    return where;
  }

  private toRecord(r: ReporteEmergencia): Prisma.ReporteEmergenciaCreateManyInput {
    return {
      fecha: r.fecha ?? null,
      hora: r.hora ?? null,
      anio: r.anio,
      mes: r.mes ?? null,
      semanaEpi: r.semanaEpi ?? null,
      tipoReporte: r.tipoReporte ?? null,
      numReporte: r.numReporte ?? null,
      secuencia: r.secuencia ?? null,
      esUltimoReporte: r.esUltimoReporte,
      evento: r.evento,
      familiaEvento: r.familiaEvento ?? null,
      departamento: r.departamento,
      distrito: r.distrito ?? null,
      titulo: r.titulo ?? null,
      idEvento: r.idEvento ?? null,
      urlDetalle: r.urlDetalle ?? null,
      urlPdf: r.urlPdf ?? null,
      tienePdf: r.tienePdf,
      urlIcono: r.urlIcono ?? null,
      colorFondo: r.colorFondo ?? null,
      pagina: r.pagina ?? null,
      duplicado: r.duplicado,
      parseOk: r.parseOk,
      notas: r.notas ?? null,
    };
  }

  private toDomain(record: PrismaRecord): ReporteEmergencia {
    return ReporteEmergencia.reconstitute({
      id: record.id,
      fecha: record.fecha ?? undefined,
      hora: record.hora ?? undefined,
      anio: record.anio,
      mes: record.mes ?? undefined,
      semanaEpi: record.semanaEpi ?? undefined,
      tipoReporte: record.tipoReporte ?? undefined,
      numReporte: record.numReporte ?? undefined,
      secuencia: record.secuencia ?? undefined,
      esUltimoReporte: record.esUltimoReporte,
      evento: record.evento,
      familiaEvento: record.familiaEvento ?? undefined,
      departamento: record.departamento,
      distrito: record.distrito ?? undefined,
      titulo: record.titulo ?? undefined,
      idEvento: record.idEvento ?? undefined,
      urlDetalle: record.urlDetalle ?? undefined,
      urlPdf: record.urlPdf ?? undefined,
      tienePdf: record.tienePdf,
      urlIcono: record.urlIcono ?? undefined,
      colorFondo: record.colorFondo ?? undefined,
      pagina: record.pagina ?? undefined,
      duplicado: record.duplicado,
      parseOk: record.parseOk,
      notas: record.notas ?? undefined,
      createdAt: record.createdAt,
    });
  }
}
