import { Injectable, Inject, Logger } from '@nestjs/common';
import { ILLMAdapter, LLM_ADAPTER_PORT } from '../predicciones/domain/ports/llm-adapter.port';
import { AppConfigService } from '../app-config/app-config.service';
import type { IPredictionEngine, PredictionContext } from './prediction-engine.port';
import type { PredictionResponse, NivelRiesgo, DistrictPrediction } from './prediction-result.dto';

const DEFAULT_SYSTEM_PROMPT = `Eres un sistema experto en análisis de riesgo de desastres en Perú.
Usas datos históricos del INDECI para generar predicciones de probabilidad por distrito.
Responde SIEMPRE con JSON válido y sin ningún texto adicional fuera del JSON.`;

@Injectable()
export class LLMPredictionEngine implements IPredictionEngine {
  private readonly logger = new Logger(LLMPredictionEngine.name);

  constructor(
    @Inject(LLM_ADAPTER_PORT) private readonly llm: ILLMAdapter,
    private readonly appConfig: AppConfigService,
  ) {}

  async predict(ctx: PredictionContext): Promise<PredictionResponse> {
    const systemPrompt = await this.appConfig.get('prompt.predict.system', DEFAULT_SYSTEM_PROMPT);

    const top20 = ctx.historialAgregado.slice(0, 20);
    const histResumen = top20
      .map((h) => `${h.distrito}|${h.departamento}: ${h.eventosAnual} ev/año, pico mes=${h.mesMaximo}`)
      .join('\n');

    const userMessage = `Fecha: ${ctx.fechaActual}
Tipo de riesgo: ${ctx.tipo.label} — ${ctx.tipo.descripcion}
Familias INDECI incluidas: ${ctx.tipo.familiasEvento.join(', ')}
Ventana: próximos ${ctx.ventanaDias} días

Historial INDECI por distrito (más afectados primero):
${histResumen}

Instrucciones:
- Calcula probabilidad_pct entre 0 y 100 (error esperado ±0.64 pp)
- x_base = multiplicador vs. frecuencia histórica (1.0=normal, 2.0=doble, etc.)
- lluvia_estimada_mm = mm estimados en la ventana (0 si el tipo no es pluvial)
- dia_pico = fecha ISO YYYY-MM-DD del día de mayor riesgo en la ventana
- nivel: "bajo" si prob<${ctx.tipo.umbrales.medio}, "medio" si <${ctx.tipo.umbrales.alto}, "alto" si mayor
- Incluye máximo 25 distritos ordenados por probabilidad descendente

Responde SOLO con este JSON:
{
  "resumen": "2 oraciones resumiendo el panorama de riesgo",
  "predicciones": [
    { "distrito": "NOMBRE", "departamento": "NOMBRE", "probabilidad_pct": 9.1, "x_base": 1.0, "lluvia_estimada_mm": 1, "dia_pico": "YYYY-MM-DD", "nivel": "bajo" }
  ]
}`;

    try {
      const raw = await this.llm.complete({
        systemPrompt,
        userMessage,
        maxTokens: 3000,
        temperature: 0.15,
      });

      let parsed: { resumen: string; predicciones: DistrictPrediction[] };
      try {
        const start = raw.indexOf('{');
        const end = raw.lastIndexOf('}');
        const jsonStr = start >= 0 && end > start ? raw.slice(start, end + 1) : raw;
        parsed = JSON.parse(jsonStr) as typeof parsed;
      } catch {
        this.logger.warn(`No se pudo parsear respuesta LLM, usando fallback estadístico`);
        return this.statisticalFallback(ctx);
      }

      return {
        tipo: ctx.tipo.id,
        tipo_label: ctx.tipo.label,
        ventana_dias: ctx.ventanaDias,
        generado_en: new Date().toISOString(),
        resumen: parsed.resumen ?? null,
        predicciones: (parsed.predicciones ?? []).map((p) => ({
          ...p,
          nivel: this.calcNivel(p.probabilidad_pct, ctx.tipo.umbrales),
        })),
        ai_disponible: true,
      };
    } catch (err) {
      this.logger.warn(`IA no disponible, usando fallback estadístico: ${(err as Error).message}`);
      return this.statisticalFallback(ctx);
    }
  }

  private statisticalFallback(ctx: PredictionContext): PredictionResponse {
    const total = ctx.historialAgregado.reduce((s, h) => s + h.eventosAnual, 0);
    const avg = total / Math.max(1, ctx.historialAgregado.length);
    const currentMonth = new Date().getMonth() + 1;

    const predicciones = ctx.historialAgregado
      .slice(0, 25)
      .map((h): DistrictPrediction => {
        const lambdaWindow = (h.eventosAnual / 12) * (ctx.ventanaDias / 30);
        const monthCount = h.frecuenciaMes[currentMonth] ?? 0;
        const avgMonth = h.eventosAnual / 12;
        const seasonal = avgMonth > 0 ? Math.min(3, Math.max(0.3, monthCount / avgMonth)) : 1;
        const prob = (1 - Math.exp(-lambdaWindow * seasonal)) * 100;
        const x_base = avg > 0 ? h.eventosAnual / avg : 1;

        const peakDate = new Date();
        peakDate.setDate(peakDate.getDate() + Math.ceil(ctx.ventanaDias / 2));

        return {
          distrito: h.distrito,
          departamento: h.departamento,
          probabilidad_pct: Math.min(99, Math.round(prob * 10) / 10),
          x_base: Math.round(x_base * 10) / 10,
          lluvia_estimada_mm: 0,
          dia_pico: peakDate.toISOString().split('T')[0]!,
          nivel: this.calcNivel(prob, ctx.tipo.umbrales),
        };
      })
      .sort((a, b) => b.probabilidad_pct - a.probabilidad_pct);

    return {
      tipo: ctx.tipo.id,
      tipo_label: ctx.tipo.label,
      ventana_dias: ctx.ventanaDias,
      generado_en: new Date().toISOString(),
      resumen: null,
      predicciones,
      ai_disponible: false,
    };
  }

  private calcNivel(prob: number, umbrales: { medio: number; alto: number }): NivelRiesgo {
    if (prob >= umbrales.alto) return 'alto';
    if (prob >= umbrales.medio) return 'medio';
    if (prob > 0) return 'bajo';
    return 'sin_dato';
  }
}
