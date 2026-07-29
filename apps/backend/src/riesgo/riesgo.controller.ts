import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RunPredictionUseCase } from './run-prediction.use-case';
import { PREDICTION_TYPES } from './prediction-types';

class PredictDto {
  @IsString()
  tipo!: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  ventana_dias?: number;
}

@Controller('v1/riesgo')
@UseGuards(JwtAuthGuard)
export class RiesgoController {
  constructor(private readonly runPrediction: RunPredictionUseCase) {}

  @Get('tipos')
  getTipos() {
    return Object.values(PREDICTION_TYPES).map(({ id, label, descripcion, icono }) => ({
      id,
      label,
      descripcion,
      icono,
    }));
  }

  @Post('predict')
  predict(@Body() body: PredictDto) {
    return this.runPrediction.execute(body.tipo, body.ventana_dias ?? 7);
  }
}
