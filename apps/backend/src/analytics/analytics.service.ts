import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const [
      totalReportes,
      conFecha,
      totalDuplicados,
      distritosUnicos,
      departamentosUnicos,
      porFamiliaEvento,
      porAnio,
      porDepartamento,
      porMes,
      porSecuencia,
    ] = await Promise.all([
      this.prisma.reporteEmergencia.count(),
      this.prisma.reporteEmergencia.count({ where: { fecha: { not: null } } }),
      this.prisma.reporteEmergencia.count({ where: { duplicado: true } }),
      this.prisma.reporteEmergencia.findMany({
        where: { distrito: { not: null } },
        select: { distrito: true },
        distinct: ['distrito'],
      }),
      this.prisma.reporteEmergencia.findMany({
        select: { departamento: true },
        distinct: ['departamento'],
      }),
      this.prisma.reporteEmergencia.groupBy({
        by: ['familiaEvento'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 12,
      }),
      this.prisma.reporteEmergencia.groupBy({
        by: ['anio'],
        _count: { id: true },
        orderBy: { anio: 'asc' },
      }),
      this.prisma.reporteEmergencia.groupBy({
        by: ['departamento'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 15,
      }),
      this.prisma.reporteEmergencia.groupBy({
        by: ['mes'],
        where: { mes: { not: null } },
        _count: { id: true },
        orderBy: { mes: 'asc' },
      }),
      this.prisma.reporteEmergencia.groupBy({
        by: ['secuencia'],
        where: { secuencia: { not: null } },
        _count: { id: true },
        orderBy: { secuencia: 'asc' },
        take: 20,
      }),
    ]);

    const reportesSeguimiento = porSecuencia
      .filter((r) => (r.secuencia ?? 0) > 1)
      .reduce((acc, r) => acc + r._count.id, 0);

    const primerosReportes = porSecuencia
      .filter((r) => r.secuencia === 1)
      .reduce((acc, r) => acc + r._count.id, 0);

    return {
      kpis: {
        totalReportes,
        conFechaExacta: conFecha,
        pctConFecha: totalReportes > 0 ? Math.round((conFecha / totalReportes) * 1000) / 10 : 0,
        distritos: distritosUnicos.length,
        departamentos: departamentosUnicos.length,
        duplicados: totalDuplicados,
        pctDuplicados: totalReportes > 0 ? Math.round((totalDuplicados / totalReportes) * 1000) / 10 : 0,
        reportesSeguimiento,
        primerosReportes,
        pctSeguimiento: totalReportes > 0 ? Math.round((reportesSeguimiento / totalReportes) * 1000) / 10 : 0,
      },
      porFamiliaEvento: porFamiliaEvento.map((r) => ({
        familia: r.familiaEvento ?? '(sin clasificar)',
        count: r._count.id,
      })),
      porAnio: porAnio.map((r) => ({ anio: r.anio, count: r._count.id })),
      porDepartamento: porDepartamento.map((r) => ({
        departamento: r.departamento,
        count: r._count.id,
      })),
      porMes: porMes.map((r) => ({
        mes: r.mes ?? 0,
        count: r._count.id,
      })),
    };
  }
}
