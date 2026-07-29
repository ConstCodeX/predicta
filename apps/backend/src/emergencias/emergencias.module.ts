import { Module } from '@nestjs/common';
import { REPORTE_REPOSITORY_PORT } from './domain/ports/reporte.repository.port';
import { CSV_PARSER_PORT } from './domain/ports/csv-parser.port';
import { PrismaReporteRepository } from './infrastructure/repositories/prisma-reporte.repository';
import { IndecCSVParserAdapter } from './infrastructure/adapters/indeci-csv-parser.adapter';
import { UploadINDECIHistoricalDataUseCase } from './application/use-cases/upload-indeci-historical-data/upload-indeci-historical-data.use-case';
import { ConsultarReportesUseCase } from './application/use-cases/consultar-reportes/consultar-reportes.use-case';
import { ObtenerReportePorIdUseCase } from './application/use-cases/obtener-reporte-por-id/obtener-reporte-por-id.use-case';
import { ReporteController } from './infrastructure/controllers/reporte.controller';

@Module({
  controllers: [ReporteController],
  providers: [
    { provide: REPORTE_REPOSITORY_PORT, useClass: PrismaReporteRepository },
    { provide: CSV_PARSER_PORT, useClass: IndecCSVParserAdapter },
    UploadINDECIHistoricalDataUseCase,
    ConsultarReportesUseCase,
    ObtenerReportePorIdUseCase,
  ],
})
export class EmergenciasModule {}
