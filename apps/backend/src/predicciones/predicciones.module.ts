import { Module } from '@nestjs/common';
import { LLM_ADAPTER_PORT } from './domain/ports/llm-adapter.port';
import { HISTORICAL_DATA_PORT } from './domain/ports/historical-data.port';
import { GroqLLMAdapter } from './infrastructure/adapters/groq-llm.adapter';
import { PrismaHistoricalDataAdapter } from './infrastructure/adapters/prisma-historical-data.adapter';
import { GenerateForecastUseCase } from './application/use-cases/generate-forecast/generate-forecast.use-case';
import { PrediccionController } from './infrastructure/controllers/prediccion.controller';

@Module({
  controllers: [PrediccionController],
  providers: [
    { provide: LLM_ADAPTER_PORT, useClass: GroqLLMAdapter },
    { provide: HISTORICAL_DATA_PORT, useClass: PrismaHistoricalDataAdapter },
    GenerateForecastUseCase,
  ],
})
export class PrediccionesModule {}
