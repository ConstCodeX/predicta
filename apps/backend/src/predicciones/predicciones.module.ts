import { Module } from '@nestjs/common';
import { PrediccionController } from './infrastructure/controllers/prediccion.controller';

@Module({
  controllers: [PrediccionController],
})
export class PrediccionesModule {}
