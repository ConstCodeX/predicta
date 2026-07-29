import {
  Controller,
  Get,
  Inject,
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
import { ILLMAdapter, LLM_ADAPTER_PORT } from '../../../predicciones/domain/ports/llm-adapter.port';
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
    @Inject(LLM_ADAPTER_PORT) private readonly llm: ILLMAdapter,
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
   * Filtros: familiaEvento, evento, anioDesde, anioHasta.
   */
  @Get('timeline')
  @UseGuards(JwtAuthGuard)
  async timeline(
    @Query('familiaEvento') familiaEvento?: string,
    @Query('evento') eventoFilter?: string,
    @Query('anioDesde') anioDesdeStr?: string,
    @Query('anioHasta') anioHastaStr?: string,
  ) {
    const anioDesde = anioDesdeStr ? parseInt(anioDesdeStr, 10) : 2019;
    const anioHasta = anioHastaStr ? parseInt(anioHastaStr, 10) : new Date().getFullYear();

    const baseWhere = {
      anio: { gte: anioDesde, lte: anioHasta },
      distrito: { not: null as null },
      ...(familiaEvento ? { familiaEvento } : {}),
      ...(eventoFilter ? { evento: eventoFilter } : {}),
    };

    // Main groupBy: frames
    const groups = await this.prisma.reporteEmergencia.groupBy({
      by: ['anio', 'mes', 'departamento', 'distrito', 'familiaEvento'],
      where: baseWhere,
      _count: { id: true },
      orderBy: [{ anio: 'asc' }, { mes: 'asc' }],
    });

    // Distinct familias for the current filter combination
    const familiaGroups = await this.prisma.reporteEmergencia.groupBy({
      by: ['familiaEvento'],
      where: {
        anio: { gte: anioDesde, lte: anioHasta },
        familiaEvento: { not: null },
        ...(eventoFilter ? { evento: eventoFilter } : {}),
      },
      orderBy: { familiaEvento: 'asc' },
    });

    // Distinct eventos for the current familia filter
    const eventoGroups = await this.prisma.reporteEmergencia.groupBy({
      by: ['evento'],
      where: {
        anio: { gte: anioDesde, lte: anioHasta },
        ...(familiaEvento ? { familiaEvento } : {}),
      },
      orderBy: { evento: 'asc' },
    });

    // Build frame map
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

    const familias = familiaGroups
      .map((g) => g.familiaEvento)
      .filter(Boolean) as string[];

    const eventos = eventoGroups.map((g) => g.evento);

    return {
      frames,
      familias,
      eventos,
      total: groups.reduce((s, g) => s + g._count.id, 0),
    };
  }

  /**
   * GET /api/v1/emergencias/heatmap
   *
   * Devuelve densidad de ocurrencias por departamento+distrito para el mapa de calor.
   * Si la IA está disponible, también genera un comentario breve.
   */
  @Get('heatmap')
  @UseGuards(JwtAuthGuard)
  async heatmap(
    @Query('familiaEvento') familiaEvento?: string,
    @Query('evento') eventoFilter?: string,
    @Query('anioDesde') anioDesdeStr?: string,
    @Query('anioHasta') anioHastaStr?: string,
  ) {
    const anioDesde = anioDesdeStr ? parseInt(anioDesdeStr, 10) : 2019;
    const anioHasta = anioHastaStr ? parseInt(anioHastaStr, 10) : new Date().getFullYear();

    const groups = await this.prisma.reporteEmergencia.groupBy({
      by: ['departamento', 'distrito'],
      where: {
        anio: { gte: anioDesde, lte: anioHasta },
        ...(familiaEvento ? { familiaEvento } : {}),
        ...(eventoFilter ? { evento: eventoFilter } : {}),
        distrito: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const points = groups.map((g) => ({
      departamento: g.departamento,
      distrito: g.distrito!,
      count: g._count.id,
    }));

    const total = points.reduce((s, p) => s + p.count, 0);
    const max = points[0]?.count ?? 0;

    let commentary: string | null = null;
    let ai_disponible = false;
    try {
      const top5 = points
        .slice(0, 5)
        .map((p) => `${p.distrito} (${p.departamento}): ${p.count} eventos`)
        .join(', ');
      const tipoLabel = familiaEvento ?? eventoFilter ?? 'todos los tipos';
      commentary = await this.llm.complete({
        systemPrompt: 'Eres un analista de riesgos en Perú. Responde en español, máximo 2 oraciones, sin formato markdown.',
        userMessage: `Mapa de calor "${tipoLabel}" (${anioDesde}-${anioHasta}): ${total} eventos en total. Zonas más afectadas: ${top5}. Indica brevemente el patrón geográfico observado y su implicancia.`,
        maxTokens: 150,
        temperature: 0.3,
      });
      ai_disponible = true;
    } catch {
      // IA no disponible — retornamos sin comentario
    }

    return { points, total, max, commentary, ai_disponible };
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
