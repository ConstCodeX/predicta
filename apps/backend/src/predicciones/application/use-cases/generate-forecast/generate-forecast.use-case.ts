import { Injectable, Inject, Logger } from '@nestjs/common';
import { ILLMAdapter, LLM_ADAPTER_PORT } from '../../../domain/ports/llm-adapter.port';
import {
  IHistoricalDataPort,
  HISTORICAL_DATA_PORT,
  HistoricalEventSummary,
} from '../../../domain/ports/historical-data.port';
import {
  ForecastResponse,
  parseForecastResponse,
} from '../../../domain/value-objects/forecast-response.vo';
import { InsufficientHistoricalDataException } from '../../../domain/exceptions/prediccion.exceptions';
import { FORECAST_SYSTEM_PROMPT } from '../../../infrastructure/prompts/forecast.system-prompt';
import { GenerateForecastCommand } from './generate-forecast.command';

const MIN_EVENTS_FOR_FORECAST = 1;

@Injectable()
export class GenerateForecastUseCase {
  private readonly logger = new Logger(GenerateForecastUseCase.name);

  constructor(
    @Inject(HISTORICAL_DATA_PORT)
    private readonly historicalData: IHistoricalDataPort,
    @Inject(LLM_ADAPTER_PORT)
    private readonly llm: ILLMAdapter,
  ) {}

  async execute(command: GenerateForecastCommand): Promise<ForecastResponse> {
    const currentYear = new Date().getFullYear();

    // 1. Consultar histórico agregado de INDECI
    const events = await this.historicalData.findRelevantEvents({
      departamento: command.departamento,
      familiaEvento: command.familiaEvento,
      anioDesde: command.anioDesde ?? currentYear - 15,
      anioHasta: command.anioHasta ?? currentYear,
    });

    if (events.length < MIN_EVENTS_FOR_FORECAST) {
      throw new InsufficientHistoricalDataException(
        `departamento=${command.departamento ?? 'todos'}, familia=${command.familiaEvento ?? 'todas'}`,
      );
    }

    this.logger.log(
      `Forecast: ${events.length} grupos de eventos. Query: "${command.query}"`,
    );

    // 2. Construir contexto estructurado para el LLM
    const context = this.buildContext(events, command, currentYear);

    // 3. Llamar al LLM
    const rawResponse = await this.llm.complete({
      systemPrompt: FORECAST_SYSTEM_PROMPT,
      userMessage: this.buildUserMessage(command.query, context),
      maxTokens: 3000,
      temperature: 0.2,
    });

    this.logger.debug(`Respuesta LLM (primeros 200 chars): ${rawResponse.slice(0, 200)}`);

    // 4. Parsear y validar la respuesta contra el esquema
    return parseForecastResponse(rawResponse);
  }

  private buildContext(
    events: HistoricalEventSummary[],
    command: GenerateForecastCommand,
    currentYear: number,
  ): string {
    const anioDesde = command.anioDesde ?? currentYear - 15;
    const anioHasta = command.anioHasta ?? currentYear;
    const total = events.reduce((sum, e) => sum + e.ocurrencias, 0);

    // Agrupar por departamento para estadísticas
    const byDept = new Map<string, { total: number; eventos: Map<string, number> }>();
    for (const e of events) {
      const dept = byDept.get(e.departamento) ?? { total: 0, eventos: new Map() };
      dept.total += e.ocurrencias;
      dept.eventos.set(e.evento, (dept.eventos.get(e.evento) ?? 0) + e.ocurrencias);
      byDept.set(e.departamento, dept);
    }

    const lines: string[] = [
      `=== RESUMEN HISTÓRICO INDECI (${anioDesde}–${anioHasta}) ===`,
      `Total de registros de emergencias: ${total}`,
      `Departamentos afectados: ${byDept.size}`,
      '',
      '--- DETALLE POR DEPARTAMENTO ---',
    ];

    // Ordenar por número total de eventos (descendente)
    const sorted = Array.from(byDept.entries()).sort((a, b) => b[1].total - a[1].total);

    for (const [dept, stats] of sorted) {
      lines.push(`\n${dept} (${stats.total} ocurrencias):`);
      const topEventos = Array.from(stats.eventos.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      for (const [evento, count] of topEventos) {
        lines.push(`  • ${evento}: ${count} casos`);
      }
    }

    // Year-by-year totals (for LINE chart and trend analysis)
    const byYear = new Map<number, number>();
    for (const e of events) {
      byYear.set(e.anio, (byYear.get(e.anio) ?? 0) + e.ocurrencias);
    }
    const sortedYears = Array.from(byYear.entries()).sort((a, b) => a[0] - b[0]);
    lines.push('', '--- TENDENCIA ANUAL (total eventos — usa estos datos para gráfico LINE) ---');
    for (const [year, count] of sortedYears) {
      lines.push(`${year}: ${count} eventos`);
    }

    // Top 5 event types overall (for PIE chart)
    const byEvento = new Map<string, number>();
    for (const e of events) {
      byEvento.set(e.evento, (byEvento.get(e.evento) ?? 0) + e.ocurrencias);
    }
    const topEventos = Array.from(byEvento.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    const totalEventos = Array.from(byEvento.values()).reduce((s, v) => s + v, 0);
    lines.push('', '--- DISTRIBUCIÓN POR TIPO DE EVENTO (usa para gráfico PIE o BAR) ---');
    for (const [ev, count] of topEventos) {
      const pct = Math.round((count / totalEventos) * 100);
      lines.push(`${ev}: ${count} ocurrencias (${pct}%)`);
    }

    lines.push('', '--- DETALLE POR AÑO Y DEPARTAMENTO (top 20 grupos) ---');
    const topGroups = [...events].sort((a, b) => b.ocurrencias - a.ocurrencias).slice(0, 20);
    for (const e of topGroups) {
      const distrito = e.distrito ? ` (${e.distrito})` : '';
      lines.push(
        `${e.anio} | ${e.departamento}${distrito} | ${e.evento} | ${e.ocurrencias} ocurrencias`,
      );
    }

    return lines.join('\n');
  }

  private buildUserMessage(query: string, context: string): string {
    return `${context}

=== CONSULTA DEL OPERADOR ===
${query}

Genera el pronóstico de riesgo basándote en los datos históricos anteriores.`;
  }
}
