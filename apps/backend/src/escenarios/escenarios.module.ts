import { Module } from '@nestjs/common';
import { LLM_ADAPTER_PORT } from '../predicciones/domain/ports/llm-adapter.port';
import { GroqLLMAdapter } from '../predicciones/infrastructure/adapters/groq-llm.adapter';
import { AnalyzeScenarioUseCase } from './analyze-scenario.use-case';
import { EscenariosController } from './escenarios.controller';

@Module({
  controllers: [EscenariosController],
  providers: [
    { provide: LLM_ADAPTER_PORT, useClass: GroqLLMAdapter },
    AnalyzeScenarioUseCase,
  ],
})
export class EscenariosModule {}
