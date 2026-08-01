import { Module } from '@nestjs/common';
import { RunPredictionUseCase } from './run-prediction.use-case';
import { RiesgoController } from './riesgo.controller';

@Module({
  controllers: [RiesgoController],
  providers: [RunPredictionUseCase],
})
export class RiesgoModule {}
