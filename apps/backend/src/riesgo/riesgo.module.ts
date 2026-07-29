import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LLM_ADAPTER_PORT } from '../predicciones/domain/ports/llm-adapter.port';
import { PREDICTION_ENGINE_PORT } from './prediction-engine.port';
import { GroqLLMAdapter } from '../predicciones/infrastructure/adapters/groq-llm.adapter';
import { LLMPredictionEngine } from './llm-prediction-engine.adapter';
import { RunPredictionUseCase } from './run-prediction.use-case';
import { RiesgoController } from './riesgo.controller';

@Module({
  imports: [PrismaModule],
  controllers: [RiesgoController],
  providers: [
    { provide: LLM_ADAPTER_PORT, useClass: GroqLLMAdapter },
    { provide: PREDICTION_ENGINE_PORT, useClass: LLMPredictionEngine },
    RunPredictionUseCase,
  ],
})
export class RiesgoModule {}
