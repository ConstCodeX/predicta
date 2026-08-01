import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { GenerateForecastRequestDto } from './generate-forecast.request.dto';
import type { ForecastResponse } from '../../domain/value-objects/forecast-response.vo';

@Controller('v1/ai')
export class PrediccionController {
  private readonly mockForecast: ForecastResponse;

  constructor() {
    const raw = fs.readFileSync(
      path.join(__dirname, '../../../mocks/data/forecast.json'),
      'utf-8',
    );
    const { _contract: _c, ...payload } = JSON.parse(raw);
    this.mockForecast = payload as ForecastResponse;
  }

  /**
   * POST /api/v1/ai/forecast
   * En modo mock devuelve el forecast estático del archivo JSON.
   * Contract: POST https://api.predicta.pe/v1/ai/forecast { query, departamento?, familiaEvento?, anioDesde?, anioHasta? }
   */
  @Post('forecast')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  forecast(@Body() _body: GenerateForecastRequestDto): ForecastResponse {
    return this.mockForecast;
  }
}
