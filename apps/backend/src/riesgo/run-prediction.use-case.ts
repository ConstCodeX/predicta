import { BadRequestException, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PREDICTION_TYPES } from './prediction-types';
import type { PredictionResponse } from './prediction-result.dto';

@Injectable()
export class RunPredictionUseCase {
  private readonly data: Record<string, PredictionResponse>;

  constructor() {
    const raw = fs.readFileSync(
      path.join(__dirname, '../mocks/data/predictions.json'),
      'utf-8',
    );
    const { _contract: _c, ...entries } = JSON.parse(raw);
    this.data = entries as Record<string, PredictionResponse>;
  }

  execute(tipoId: string, ventanaDias: number): PredictionResponse {
    const tipo = PREDICTION_TYPES[tipoId];
    if (!tipo) {
      throw new BadRequestException(`Tipo de predicción desconocido: ${tipoId}`);
    }

    const base = this.data[tipoId];
    if (!base) {
      return {
        tipo: tipoId,
        tipo_label: tipo.label,
        ventana_dias: ventanaDias,
        generado_en: new Date().toISOString(),
        resumen: 'No se encontraron datos históricos para este tipo de riesgo.',
        predicciones: [],
        ai_disponible: false,
      };
    }

    return { ...base, ventana_dias: ventanaDias, generado_en: new Date().toISOString() };
  }
}
