import {
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';

@Controller('v1/emergencias')
export class ReporteController {
  private readonly heatmapData: Record<string, unknown>;
  private readonly timelineData: Record<string, unknown>;
  private readonly emergenciasData: Record<string, unknown>;

  constructor() {
    const read = (name: string) => {
      const raw = fs.readFileSync(
        path.join(__dirname, '../../../mocks/data', name),
        'utf-8',
      );
      const { _contract: _c, ...payload } = JSON.parse(raw);
      return payload;
    };
    this.heatmapData = read('heatmap.json');
    this.timelineData = read('timeline.json');
    this.emergenciasData = read('emergencias.json');
  }

  /**
   * POST /api/v1/emergencias/upload
   * En modo mock devuelve resultado simulado sin procesar el CSV.
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
  uploadCSV(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se proporcionó ningún archivo');
    return {
      total: 1000,
      imported: 987,
      discarded: 13,
      errors: [],
      mock: true,
      message: 'Modo mock: CSV recibido pero no procesado. Los datos reales provendrán de la API INDECI/SINPAD.',
    };
  }

  /**
   * GET /api/v1/emergencias
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Query('departamento') departamento?: string,
    @Query('familiaEvento') familiaEvento?: string,
    @Query('evento') evento?: string,
    @Query('page') pageStr?: string,
    @Query('pageSize') pageSizeStr?: string,
  ) {
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const pageSize = pageSizeStr ? parseInt(pageSizeStr, 10) : 20;

    let data = (this.emergenciasData['data'] as unknown[]) ?? [];

    if (departamento) {
      data = (data as Record<string, string>[]).filter(
        (r) => r['departamento']?.toLowerCase() === departamento.toLowerCase(),
      );
    }
    if (familiaEvento) {
      data = (data as Record<string, string>[]).filter(
        (r) => r['familiaEvento']?.toLowerCase() === familiaEvento.toLowerCase(),
      );
    }
    if (evento) {
      data = (data as Record<string, string>[]).filter(
        (r) => r['evento']?.toLowerCase() === evento.toLowerCase(),
      );
    }

    const total = data.length;
    const start = (page - 1) * pageSize;
    return { total, page, pageSize, data: data.slice(start, start + pageSize) };
  }

  /**
   * GET /api/v1/emergencias/timeline
   */
  @Get('timeline')
  @UseGuards(JwtAuthGuard)
  timeline(
    @Query('familiaEvento') familiaEvento?: string,
    @Query('evento') eventoFilter?: string,
  ) {
    const data = this.timelineData as {
      frames: { anio: number; mes: number; events: { familiaEvento: string; evento?: string; count: number }[] }[];
      familias: string[];
      eventos: string[];
      total: number;
    };

    let frames = data.frames;

    if (familiaEvento) {
      frames = frames.map((f) => ({
        ...f,
        events: f.events.filter(
          (e) => e.familiaEvento?.toLowerCase() === familiaEvento.toLowerCase(),
        ),
      })).filter((f) => f.events.length > 0);
    }

    if (eventoFilter) {
      frames = frames.map((f) => ({
        ...f,
        events: f.events.filter(
          (e) => e.evento?.toLowerCase() === eventoFilter.toLowerCase(),
        ),
      })).filter((f) => f.events.length > 0);
    }

    return {
      frames,
      familias: data.familias,
      eventos: data.eventos,
      total: data.total,
    };
  }

  /**
   * GET /api/v1/emergencias/heatmap
   * Computes aggregation dynamically from emergencias records with filters applied.
   */
  @Get('heatmap')
  @UseGuards(JwtAuthGuard)
  heatmap(
    @Query('familiaEvento') familiaEvento?: string,
    @Query('evento') eventoFilter?: string,
    @Query('anioDesde') anioDesde?: string,
    @Query('anioHasta') anioHasta?: string,
  ) {
    const rawBase = (this.heatmapData as { points: { departamento: string; distrito: string; count: number }[]; commentary: string; ai_disponible: boolean }).points;

    // If no filters, return pre-aggregated mock (fast path)
    if (!familiaEvento && !eventoFilter && !anioDesde && !anioHasta) {
      return this.heatmapData;
    }

    // Build a filtered subset by combining heatmapData with emergencias per-record info
    // We scale counts from the base dataset proportionally to match filtered distribution
    type EmergRecord = { departamento: string; distrito: string; familiaEvento: string; evento: string; anio: number };
    const allRecs = (this.emergenciasData['data'] as EmergRecord[]) ?? [];

    let filtered = allRecs;
    if (familiaEvento) filtered = filtered.filter((r) => r.familiaEvento?.toLowerCase() === familiaEvento.toLowerCase());
    if (eventoFilter)  filtered = filtered.filter((r) => r.evento?.toLowerCase()        === eventoFilter.toLowerCase());
    if (anioDesde)     filtered = filtered.filter((r) => r.anio >= parseInt(anioDesde, 10));
    if (anioHasta)     filtered = filtered.filter((r) => r.anio <= parseInt(anioHasta, 10));

    if (filtered.length === 0) {
      // No per-record match — return proportionally scaled base points
      const scaleFactor = 0.3;
      const scaled = rawBase.map((p) => ({ ...p, count: Math.round(p.count * scaleFactor) })).filter((p) => p.count > 0);
      const max = scaled[0]?.count ?? 0;
      return { points: scaled, total: scaled.reduce((s, p) => s + p.count, 0), max, commentary: null, ai_disponible: false };
    }

    // Aggregate filtered per-record results
    const agg: Record<string, { departamento: string; distrito: string; count: number }> = {};
    for (const r of filtered) {
      const key = `${r.departamento}::${r.distrito ?? 'GENERAL'}`;
      if (!agg[key]) agg[key] = { departamento: r.departamento, distrito: r.distrito ?? 'GENERAL', count: 0 };
      agg[key].count++;
    }

    // Supplement with base heatmap data scaled to match the filtered distribution
    const filteredDepts = new Set(filtered.map((r) => r.departamento));
    const total_filtered = filtered.length;
    for (const bp of rawBase) {
      if (!filteredDepts.has(bp.departamento)) continue;
      const key = `${bp.departamento}::${bp.distrito}`;
      if (!agg[key]) agg[key] = { departamento: bp.departamento, distrito: bp.distrito, count: 0 };
      agg[key].count += Math.round(bp.count * (total_filtered / 145230) * 100);
    }

    const points = Object.values(agg).sort((a, b) => b.count - a.count);
    const max = points[0]?.count ?? 0;
    const total = points.reduce((s, p) => s + p.count, 0);

    return {
      points,
      total,
      max,
      commentary: `Distribución filtrada por ${familiaEvento ?? 'todas las familias'}${anioDesde ? `, desde ${anioDesde}` : ''}${anioHasta ? ` hasta ${anioHasta}` : ''}.`,
      ai_disponible: false,
    };
  }
}
