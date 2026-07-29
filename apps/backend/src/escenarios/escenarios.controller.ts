import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ESCENARIOS, type Intensidad } from './escenarios.types';
import { AnalyzeScenarioUseCase } from './analyze-scenario.use-case';

class AnalyzeDto {
  @IsString()
  escenarioId!: string;

  @IsIn(['normal', 'moderado', 'extremo'])
  intensidad!: Intensidad;

  @IsOptional()
  @IsString()
  departamento?: string;
}

@Controller('v1/escenarios')
@UseGuards(JwtAuthGuard)
export class EscenariosController {
  constructor(private readonly analyzeUseCase: AnalyzeScenarioUseCase) {}

  @Get('tipos')
  getTipos() {
    return Object.values(ESCENARIOS).map((e) => ({
      id: e.id,
      label: e.label,
      descripcion: e.descripcion,
      icono: e.icono,
    }));
  }

  @Post('analyze')
  analyze(@Body() body: AnalyzeDto) {
    return this.analyzeUseCase.execute(body.escenarioId, body.intensidad, body.departamento);
  }
}
