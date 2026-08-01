import { Body, Controller, Get, Logger, Post, UseGuards } from '@nestjs/common';
import { IsIn, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import * as fs from 'fs';
import * as path from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RunPredictionUseCase } from './run-prediction.use-case';
import { PREDICTION_TYPES } from './prediction-types';
import { RunAgentUseCase } from '../agentes/application/run-agent.use-case';
import { SEIR_OUTPUT_CONTRACT } from './seir-agent.contract';
import { DengueContextService } from './dengue-context.service';

class PredictDto {
  @IsString()
  tipo!: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  ventana_dias?: number;

  @IsOptional()
  @IsString()
  departamento?: string;
}

class SEIRParamsDto {
  @IsNumber() @Min(-50) @Max(500) @Type(() => Number) anomalia_lluvias_pct!: number;
  @IsNumber() @Min(-3)  @Max(5)   @Type(() => Number) anomalia_temperatura_c!: number;
  @IsIn(['neutro', 'moderado', 'fuerte']) enos_intensidad!: 'neutro' | 'moderado' | 'fuerte';
  @IsNumber() @Min(0) @Max(100) @Type(() => Number) racionamiento_agua_pct!: number;
  @IsNumber() @Min(0) @Max(100) @Type(() => Number) eficiencia_control_vectorial_pct!: number;
  @IsNumber() @Min(0) @Max(100) @Type(() => Number) desabastecimiento_insumos_pct!: number;
  @IsIn(['DEN-1', 'DEN-2', 'DEN-3', 'DEN-4']) serotipo_dominante!: 'DEN-1' | 'DEN-2' | 'DEN-3' | 'DEN-4';
}

class SEIRModelDto {
  @IsOptional() @IsString() region?: string;
  @IsOptional() @IsNumber() @Type(() => Number) ventana_semanas?: number;
  parametros!: SEIRParamsDto;
}

@Controller('v1/riesgo')
@UseGuards(JwtAuthGuard)
export class RiesgoController {
  private readonly logger = new Logger(RiesgoController.name);
  private readonly seirData: Record<string, unknown>;

  constructor(
    private readonly runPrediction: RunPredictionUseCase,
    private readonly runAgent: RunAgentUseCase,
    private readonly dengueContext: DengueContextService,
  ) {
    const raw = fs.readFileSync(
      path.join(__dirname, '../mocks/data/seir-model.json'),
      'utf-8',
    );
    const { _contract: _c, ...entries } = JSON.parse(raw);
    this.seirData = entries as Record<string, unknown>;
  }

  @Get('tipos')
  getTipos() {
    return Object.values(PREDICTION_TYPES).map(({ id, label, descripcion, icono }) => ({
      id, label, descripcion, icono,
    }));
  }

  @Post('predict')
  predict(@Body() body: PredictDto) {
    return this.runPrediction.execute(body.tipo, body.ventana_dias ?? 30, body.departamento);
  }

  /**
   * POST /api/v1/riesgo/seir-model
   * Modelo Dengue. Ejecuta el agente `dengue-seir` (Gemma) con el payload del
   * frontend y devuelve el JSON que espera el dashboard. Si Gemma no está
   * configurado o falla, cae al mock determinista por preset.
   */
  @Post('seir-model')
  async seirModel(@Body() body: SEIRModelDto) {
    const region = body.region ?? 'PIURA';
    const contexto = this.dengueContext.getContext(region);

    const payload = {
      region,
      ventana_semanas: body.ventana_semanas ?? 16,
      parametros: body.parametros,
      // Datos reales (MINSA-CDC + DATA_MAESTRA) para aterrizar la proyección.
      datos_reales: contexto,
    };

    try {
      const { data } = await this.runAgent.execute<Record<string, unknown>>({
        agentId: 'dengue-seir',
        payload,
        outputContract: SEIR_OUTPUT_CONTRACT,
      });

      // Aseguramos los campos que el frontend usa de forma no negociable.
      return {
        ...data,
        region: (data['region'] as string) ?? payload.region,
        ventana_semanas:
          (data['ventana_semanas'] as number) ?? payload.ventana_semanas,
        parametros_usados: data['parametros_usados'] ?? body.parametros,
        generado_en: new Date().toISOString(),
        generado_por: 'agente:dengue-seir',
      };
    } catch (err) {
      this.logger.warn(
        `Agente dengue-seir no disponible (${(err as Error).message}). Usando mock.`,
      );
      return this.seirMock(body);
    }
  }

  /** Fallback determinista basado en presets de mocks/data/seir-model.json. */
  private seirMock(body: SEIRModelDto) {
    const intensidad = body.parametros?.enos_intensidad ?? 'neutro';
    const preset =
      intensidad === 'fuerte' ? 'critico' :
      intensidad === 'moderado' ? 'moderado' : 'optimista';

    const base = this.seirData[preset] as Record<string, unknown>;

    return {
      ...base,
      region: body.region ?? base['region'],
      generado_en: new Date().toISOString(),
      ventana_semanas: body.ventana_semanas ?? base['ventana_semanas'],
      parametros_usados: body.parametros,
      generado_por: 'mock',
    };
  }
}
