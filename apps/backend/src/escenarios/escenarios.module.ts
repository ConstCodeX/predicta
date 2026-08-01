import { Module } from '@nestjs/common';
import { AnalyzeScenarioUseCase } from './analyze-scenario.use-case';
import { EscenariosController } from './escenarios.controller';

@Module({
  controllers: [EscenariosController],
  providers: [AnalyzeScenarioUseCase],
})
export class EscenariosModule {}
