import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IPredictionEngine, PREDICTION_ENGINE_PORT } from './prediction-engine.port';
import { PREDICTION_TYPES } from './prediction-types';
import type { PredictionResponse } from './prediction-result.dto';

@Injectable()
export class RunPredictionUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PREDICTION_ENGINE_PORT) private readonly engine: IPredictionEngine,
  ) {}

  async execute(tipoId: string, ventanaDias: number): Promise<PredictionResponse> {
    const tipo = PREDICTION_TYPES[tipoId];
    if (!tipo) {
      throw new BadRequestException(`Tipo de predicción desconocido: ${tipoId}`);
    }

    const rawGroups = await this.prisma.reporteEmergencia.groupBy({
      by: ['departamento', 'distrito', 'mes'],
      where: {
        familiaEvento: { in: tipo.familiasEvento },
        distrito: { not: null },
      },
      _count: { id: true },
      orderBy: { departamento: 'asc' },
    });

    const districtMap = new Map<
      string,
      {
        distrito: string;
        departamento: string;
        eventosAnual: number;
        mesMaximo: number;
        frecuenciaMes: Record<number, number>;
      }
    >();

    for (const g of rawGroups) {
      if (!g.distrito) continue;
      const key = `${g.departamento}|${g.distrito}`;
      const mes = g.mes ?? 0;
      const count = g._count.id;

      if (!districtMap.has(key)) {
        districtMap.set(key, {
          distrito: g.distrito,
          departamento: g.departamento,
          eventosAnual: 0,
          mesMaximo: mes,
          frecuenciaMes: {},
        });
      }

      const entry = districtMap.get(key)!;
      entry.eventosAnual += count;
      entry.frecuenciaMes[mes] = (entry.frecuenciaMes[mes] ?? 0) + count;

      const prevMax = entry.frecuenciaMes[entry.mesMaximo] ?? 0;
      if ((entry.frecuenciaMes[mes] ?? 0) >= prevMax) {
        entry.mesMaximo = mes;
      }
    }

    const historial = [...districtMap.values()]
      .sort((a, b) => b.eventosAnual - a.eventosAnual)
      .slice(0, 50);

    if (historial.length === 0) {
      return {
        tipo: tipoId,
        tipo_label: tipo.label,
        ventana_dias: ventanaDias,
        generado_en: new Date().toISOString(),
        resumen: 'No se encontraron datos históricos para este tipo de riesgo en la base de datos.',
        predicciones: [],
      };
    }

    return this.engine.predict({
      tipo,
      ventanaDias,
      fechaActual: new Date().toISOString().split('T')[0]!,
      historialAgregado: historial,
    });
  }
}
