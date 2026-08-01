import { BadRequestException, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { ESCENARIOS, type EscenarioType, type Intensidad } from './escenarios.types';

export interface ZonaEscenario {
  departamento: string;
  distrito: string;
  promedio_anual: number;
  maximo_anual: number;
  anios_con_eventos: number;
  nivel: 'normal' | 'moderado' | 'extremo';
  count: number;
}

export interface ScenarioAnalysisResult {
  escenario: EscenarioType;
  intensidad: Intensidad;
  zonas_afectadas: ZonaEscenario[];
  total_zonas: number;
  resumen_estadistico: {
    total_historico: number;
    departamentos_afectados: number;
  };
  commentary: string | null;
  ai_disponible: boolean;
}

@Injectable()
export class AnalyzeScenarioUseCase {
  private readonly data: Record<string, Omit<ScenarioAnalysisResult, 'escenario'>>;

  constructor() {
    const raw = fs.readFileSync(
      path.join(__dirname, '../mocks/data/scenarios.json'),
      'utf-8',
    );
    const { _contract: _c, ...entries } = JSON.parse(raw);
    this.data = entries;
  }

  execute(
    escenarioId: string,
    intensidad: Intensidad,
    departamento?: string,
  ): ScenarioAnalysisResult {
    const esc = ESCENARIOS[escenarioId];
    if (!esc) throw new BadRequestException(`Escenario desconocido: ${escenarioId}`);

    const key = `${escenarioId}_${intensidad}`;
    const entry = this.data[key];

    if (!entry) {
      return {
        escenario: esc,
        intensidad,
        zonas_afectadas: [],
        total_zonas: 0,
        resumen_estadistico: { total_historico: 0, departamentos_afectados: 0 },
        commentary: null,
        ai_disponible: false,
      };
    }

    let zonas = entry.zonas_afectadas;

    if (departamento) {
      zonas = zonas.filter(
        (z) => z.departamento.toLowerCase() === departamento.toLowerCase(),
      );
    }

    const deptos = new Set(zonas.map((z) => z.departamento));

    return {
      escenario: esc,
      intensidad,
      zonas_afectadas: zonas,
      total_zonas: zonas.length,
      resumen_estadistico: {
        total_historico: entry.resumen_estadistico.total_historico,
        departamentos_afectados: deptos.size,
      },
      commentary: entry.commentary,
      ai_disponible: entry.ai_disponible,
    };
  }
}
