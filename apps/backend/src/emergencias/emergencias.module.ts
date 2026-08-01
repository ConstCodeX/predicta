import { Module } from '@nestjs/common';
import { ReporteController } from './infrastructure/controllers/reporte.controller';

@Module({
  controllers: [ReporteController],
})
export class EmergenciasModule {}
