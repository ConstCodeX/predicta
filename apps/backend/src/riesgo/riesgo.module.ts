import { Module } from '@nestjs/common';
import { RunPredictionUseCase } from './run-prediction.use-case';
import { RiesgoController } from './riesgo.controller';
import { DengueContextService } from './dengue-context.service';
import { AgentesModule } from '../agentes/agentes.module';

@Module({
  imports: [AgentesModule],
  controllers: [RiesgoController],
  providers: [RunPredictionUseCase, DengueContextService],
})
export class RiesgoModule {}
