import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UnprocessableEntityException,
  ServiceUnavailableException,
  BadRequestException,
} from '@nestjs/common';
import { GenerateForecastUseCase } from '../../application/use-cases/generate-forecast/generate-forecast.use-case';
import { GenerateForecastRequestDto } from './generate-forecast.request.dto';
import {
  InvalidForecastResponseException,
  LLMUnavailableException,
  InsufficientHistoricalDataException,
} from '../../domain/exceptions/prediccion.exceptions';

@Controller('v1/ai')
export class PrediccionController {
  constructor(private readonly generateForecast: GenerateForecastUseCase) {}

  /**
   * POST /api/v1/ai/forecast
   *
   * Body:
   *   { query, departamento?, familiaEvento?, anioDesde?, anioHasta? }
   *
   * Respuesta validada contra ForecastResponse (esquema JSON estricto):
   *   { analisis_general, nivel_riesgo_global, alertas_mapa[] }
   */
  @Post('forecast')
  @HttpCode(HttpStatus.OK)
  async forecast(@Body() body: GenerateForecastRequestDto) {
    try {
      return await this.generateForecast.execute({
        query: body.query,
        departamento: body.departamento,
        familiaEvento: body.familiaEvento,
        anioDesde: body.anioDesde,
        anioHasta: body.anioHasta,
      });
    } catch (err) {
      if (err instanceof InsufficientHistoricalDataException) {
        throw new BadRequestException(err.message);
      }
      if (err instanceof InvalidForecastResponseException) {
        throw new UnprocessableEntityException(err.message);
      }
      if (err instanceof LLMUnavailableException) {
        throw new ServiceUnavailableException(err.message);
      }
      throw err;
    }
  }
}
