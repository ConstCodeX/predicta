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
   */
  @Get('heatmap')
  @UseGuards(JwtAuthGuard)
  heatmap(
    @Query('familiaEvento') familiaEvento?: string,
    @Query('evento') eventoFilter?: string,
  ) {
    // En mock retornamos el dataset completo (filtros reales vendran de la API INDECI)
    return {
      ...this.heatmapData,
      _filtros_aplicados: { familiaEvento: familiaEvento ?? null, evento: eventoFilter ?? null },
    };
  }
}
