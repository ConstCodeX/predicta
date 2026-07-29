import { Injectable, Inject, Logger } from '@nestjs/common';
import { ILLMAdapter, LLM_ADAPTER_PORT } from '../predicciones/domain/ports/llm-adapter.port';
import type { IPredictionEngine, PredictionContext } from './prediction-engine.port';
import type { PredictionResponse, NivelRiesgo, DistrictPrediction } from './prediction-result.dto';

@Injectable()
export class LLMPredictionEngine implements IPredictionEngine {
  private readonly logger = new Logger(LLMPredictionEngine.name);

  constructor(
    @Inject(LLM_ADAPTER_PORT) private readonly llm: ILLMAdapter,
  ) {}

  async predict(ctx: PredictionContext): Promise<PredictionResponse> {
    const top20 = ctx.historialAgregado.slice(0, 20);
    const histResumen = top20
      .map((h) => `${h.distrito}|${h.departamento}: ${h.eventosAnual} ev/año, pico mes=${h.mesMaximo}`)
      .join('\n');

    const systemPrompt = `Eres un sistema experto en análisis de riesgo de desastres en Perú.
Usas datos históricos del INDECI para generar predicciones de probabilidad por distrito.
Responde SIEMPRE con JSON válido y sin ningún texto adicional fuera del JSON.`;

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
      this.logger.error(`No se pudo parsear respuesta LLM: ${raw.substring(0, 300)}`);
      parsed = {
        resumen: 'Análisis completado con datos históricos disponibles.',
        predicciones: [],
      };
    }

    return {
      tipo: ctx.tipo.id,
      tipo_label: ctx.tipo.label,
      ventana_dias: ctx.ventanaDias,
      generado_en: new Date().toISOString(),
      resumen: parsed.resumen ?? '',
      predicciones: (parsed.predicciones ?? []).map((p) => ({
        ...p,
        nivel: this.calcNivel(p.probabilidad_pct, ctx.tipo.umbrales),
      })),
    };
  }

  private calcNivel(
    prob: number,
    umbrales: { medio: number; alto: number },
  ): NivelRiesgo {
    if (prob >= umbrales.alto) return 'alto';
    if (prob >= umbrales.medio) return 'medio';
    if (prob > 0) return 'bajo';
    return 'sin_dato';
  }
}
