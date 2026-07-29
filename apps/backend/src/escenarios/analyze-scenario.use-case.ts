import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ILLMAdapter, LLM_ADAPTER_PORT } from '../predicciones/domain/ports/llm-adapter.port';
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
  private readonly logger = new Logger(AnalyzeScenarioUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(LLM_ADAPTER_PORT) private readonly llm: ILLMAdapter,
  ) {}

  async execute(
    escenarioId: string,
    intensidad: Intensidad,
    departamento?: string,
  ): Promise<ScenarioAnalysisResult> {
    const esc = ESCENARIOS[escenarioId];
    if (!esc) throw new BadRequestException(`Escenario desconocido: ${escenarioId}`);

    // Get all historical data grouped by district + year
    const byYearDistrict = await this.prisma.reporteEmergencia.groupBy({
      by: ['departamento', 'distrito', 'anio'],
      where: {
        OR: [
          { familiaEvento: { in: esc.familias } },
          { evento: { in: esc.eventos } },
        ],
        distrito: { not: null },
        ...(departamento ? { departamento: { equals: departamento, mode: 'insensitive' } } : {}),
      },
      _count: { id: true },
    });

    // Aggregate per district
    const districtMap = new Map<
      string,
      { distrito: string; departamento: string; byYear: Record<number, number> }
    >();

    for (const g of byYearDistrict) {
      if (!g.distrito) continue;
      const key = `${g.departamento}|${g.distrito}`;
      if (!districtMap.has(key)) {
        districtMap.set(key, { distrito: g.distrito, departamento: g.departamento, byYear: {} });
      }
      districtMap.get(key)!.byYear[g.anio] = g._count.id;
    }

    // Compute stats and apply intensity filter
    const zonas: ZonaEscenario[] = [];

    for (const [, d] of districtMap) {
      const counts = Object.values(d.byYear);
      if (counts.length === 0) continue;

      const aniosConEventos = counts.length;
      const totalHistorico = counts.reduce((s, c) => s + c, 0);
      const totalAnios = Math.max(...Object.keys(d.byYear).map(Number)) - Math.min(...Object.keys(d.byYear).map(Number)) + 1;
      const promedioAnual = totalHistorico / Math.max(1, totalAnios);
      const maximoAnual = Math.max(...counts);

      let nivel: ZonaEscenario['nivel'] = 'normal';
      let include = false;

      if (intensidad === 'normal') {
        include = promedioAnual >= esc.umbrales.normal;
        nivel = promedioAnual >= esc.umbrales.moderado ? 'moderado' : 'normal';
      } else if (intensidad === 'moderado') {
        include = promedioAnual >= esc.umbrales.moderado || maximoAnual >= esc.umbrales.moderado;
        nivel = maximoAnual >= esc.umbrales.extremo || promedioAnual >= esc.umbrales.extremo
          ? 'extremo' : 'moderado';
      } else {
        // extremo = análisis de peor caso: muestra TODAS las zonas con historial
        // para que el planificador vea dónde el impacto sería mayor si ocurre el evento
        include = promedioAnual >= esc.umbrales.normal;
        if (maximoAnual >= esc.umbrales.extremo || promedioAnual >= esc.umbrales.extremo) {
          nivel = 'extremo';
        } else if (promedioAnual >= esc.umbrales.moderado || maximoAnual >= esc.umbrales.moderado) {
          nivel = 'moderado';
        } else {
          nivel = 'normal';
        }
      }

      if (include) {
        zonas.push({
          departamento: d.departamento,
          distrito: d.distrito,
          promedio_anual: Math.round(promedioAnual * 10) / 10,
          maximo_anual: maximoAnual,
          anios_con_eventos: aniosConEventos,
          nivel,
          count: Math.round(promedioAnual * 10),
        });
      }
    }

    zonas.sort((a, b) => b.promedio_anual - a.promedio_anual);

    const totalHistorico = byYearDistrict.reduce((s, g) => s + g._count.id, 0);
    const deptos = new Set(zonas.map((z) => z.departamento));

    // AI commentary
    let commentary: string | null = null;
    let ai_disponible = false;
    try {
      const top5 = zonas
        .slice(0, 5)
        .map((z) => `${z.distrito} (${z.departamento}): ${z.promedio_anual} ev/año, máx ${z.maximo_anual}`)
        .join('; ');

      commentary = await this.llm.complete({
        systemPrompt: 'Eres un experto en gestión de riesgos de desastres en Perú. Responde en español, máximo 2 oraciones claras, sin markdown.',
        userMessage: `Escenario: ${esc.label} (intensidad: ${intensidad}). Total histórico: ${totalHistorico} eventos, ${zonas.length} zonas en riesgo en ${deptos.size} departamentos. Zonas más afectadas: ${top5}. Resume el patrón de riesgo.`,
        maxTokens: 180,
        temperature: 0.3,
      });
      ai_disponible = true;
    } catch (err) {
      this.logger.warn(`IA no disponible para escenario commentary: ${(err as Error).message}`);
    }

    return {
      escenario: esc,
      intensidad,
      zonas_afectadas: zonas.slice(0, 60),
      total_zonas: zonas.length,
      resumen_estadistico: {
        total_historico: totalHistorico,
        departamentos_afectados: deptos.size,
      },
      commentary,
      ai_disponible,
    };
  }
}
