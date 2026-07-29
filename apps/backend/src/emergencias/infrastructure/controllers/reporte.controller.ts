import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { PrismaService } from '../../../prisma/prisma.service';
import { UploadINDECIHistoricalDataUseCase } from '../../application/use-cases/upload-indeci-historical-data/upload-indeci-historical-data.use-case';
import { ConsultarReportesUseCase } from '../../application/use-cases/consultar-reportes/consultar-reportes.use-case';
import { ObtenerReportePorIdUseCase } from '../../application/use-cases/obtener-reporte-por-id/obtener-reporte-por-id.use-case';

@Controller('v1/emergencias')
export class ReporteController {
  constructor(
    private readonly uploadHistoricalData: UploadINDECIHistoricalDataUseCase,
    private readonly consultarReportes: ConsultarReportesUseCase,
    private readonly obtenerPorId: ObtenerReportePorIdUseCase,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * POST /api/v1/emergencias/upload
   *
   * Sube un CSV histórico del INDECI (SINPAD).
   * Campo multipart: "file" (.csv, máx 50 MB).
   * Retorna: { total, imported, discarded, errors[] }
   */
  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!/\.csv$/i.test(file.originalname)) {
          return cb(new BadRequestException('Solo se permiten archivos .csv'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadCSV(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se proporcionó ningún archivo');

    return this.uploadHistoricalData.execute({ fileBuffer: file.buffer });
  }

  /**
   * GET /api/v1/emergencias
   *
   * Consulta paginada. Filtros opcionales:
   * departamento, familiaEvento, evento, tipoReporte,
   * anioDesde, anioHasta, page, pageSize.
   */
  @Get()
  async findAll(
    @Query('departamento') departamento?: string,
    @Query('familiaEvento') familiaEvento?: string,
    @Query('evento') evento?: string,
    @Query('tipoReporte') tipoReporte?: string,
    @Query('anioDesde') anioDesdeStr?: string,
    @Query('anioHasta') anioHastaStr?: string,
    @Query('page') pageStr?: string,
    @Query('pageSize') pageSizeStr?: string,
  ) {
    return this.consultarReportes.execute({
      departamento,
      familiaEvento,
      evento,
      tipoReporte,
      anioDesde: anioDesdeStr ? parseInt(anioDesdeStr, 10) : undefined,
      anioHasta: anioHastaStr ? parseInt(anioHastaStr, 10) : undefined,
      page: pageStr ? parseInt(pageStr, 10) : 1,
      pageSize: pageSizeStr ? parseInt(pageSizeStr, 10) : 20,
    });
  }

  /**
   * GET /api/v1/emergencias/timeline
   *
   * Devuelve eventos agrupados por anio+mes para animación temporal.
   * Filtros opcionales: familiaEvento, anioDesde, anioHasta.
   */
  @Get('timeline')
  @UseGuards(JwtAuthGuard)
  async timeline(
    @Query('familiaEvento') familiaEvento?: string,
    @Query('anioDesde') anioDesdeStr?: string,
    @Query('anioHasta') anioHastaStr?: string,
  ) {
    const anioDesde = anioDesdeStr ? parseInt(anioDesdeStr, 10) : 2019;
    const anioHasta = anioHastaStr ? parseInt(anioHastaStr, 10) : new Date().getFullYear();

    const groups = await this.prisma.reporteEmergencia.groupBy({
      by: ['anio', 'mes', 'departamento', 'distrito', 'familiaEvento'],
      where: {
        anio: { gte: anioDesde, lte: anioHasta },
        ...(familiaEvento ? { familiaEvento } : {}),
        distrito: { not: null },
      },
      _count: { id: true },
      orderBy: [{ anio: 'asc' }, { mes: 'asc' }],
    });

    // Build frame map: key = "anio-mes"
    const frameMap = new Map<
      string,
      { anio: number; mes: number; events: { departamento: string; distrito: string; familiaEvento: string; count: number }[] }
    >();

    for (const g of groups) {
      const mes = g.mes ?? 0;
      const key = `${g.anio}-${mes}`;
      if (!frameMap.has(key)) {
        frameMap.set(key, { anio: g.anio, mes, events: [] });
      }
      if (g.distrito && g.familiaEvento) {
        frameMap.get(key)!.events.push({
          departamento: g.departamento,
          distrito: g.distrito,
          familiaEvento: g.familiaEvento,
          count: g._count.id,
        });
      }
    }

    const frames = [...frameMap.values()].sort(
      (a, b) => a.anio - b.anio || a.mes - b.mes,
    );

    const familias = [...new Set(
      groups.map((g) => g.familiaEvento).filter(Boolean) as string[],
    )];

    return { frames, familias, total: groups.reduce((s, g) => s + g._count.id, 0) };
  }

  /**
   * GET /api/v1/emergencias/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const reporte = await this.obtenerPorId.execute({ id });
    if (!reporte) throw new NotFoundException(`Reporte '${id}' no encontrado`);
    return reporte;
  }
}
