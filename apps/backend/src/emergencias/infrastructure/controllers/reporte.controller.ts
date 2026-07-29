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
import { UploadINDECIHistoricalDataUseCase } from '../../application/use-cases/upload-indeci-historical-data/upload-indeci-historical-data.use-case';
import { ConsultarReportesUseCase } from '../../application/use-cases/consultar-reportes/consultar-reportes.use-case';
import { ObtenerReportePorIdUseCase } from '../../application/use-cases/obtener-reporte-por-id/obtener-reporte-por-id.use-case';

@Controller('v1/emergencias')
export class ReporteController {
  constructor(
    private readonly uploadHistoricalData: UploadINDECIHistoricalDataUseCase,
    private readonly consultarReportes: ConsultarReportesUseCase,
    private readonly obtenerPorId: ObtenerReportePorIdUseCase,
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
   * GET /api/v1/emergencias/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const reporte = await this.obtenerPorId.execute({ id });
    if (!reporte) throw new NotFoundException(`Reporte '${id}' no encontrado`);
    return reporte;
  }
}
