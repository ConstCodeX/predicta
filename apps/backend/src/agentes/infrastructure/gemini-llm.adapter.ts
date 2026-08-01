import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import {
  ILLMAdapter,
  LLMCompletionRequest,
} from '../../predicciones/domain/ports/llm-adapter.port';
import { LLMUnavailableException } from '../../predicciones/domain/exceptions/prediccion.exceptions';

/**
 * Adapter para Gemma vía el SDK oficial de Google GenAI (@google/genai).
 *
 * npm install @google/genai
 *
 * Config por variables de entorno:
 *   GEMINI_API_KEY     Token de Google AI Studio (obligatorio para activar la IA).
 *   LLM_MODEL          Modelo (por defecto "gemma-4-31b-it").
 *   GEMINI_USE_SEARCH  "true" añade la tool googleSearch (solo modelos que la soporten).
 *   GEMINI_THINKING    "true" activa thinkingConfig (solo modelos que lo soporten).
 *
 * Nota: los modelos Gemma no admiten `systemInstruction` ni rol `system`, por lo
 * que el system prompt del agente se antepone al mensaje de usuario en un único
 * turno `user`.
 */
@Injectable()
export class GeminiLLMAdapter implements ILLMAdapter {
  private readonly logger = new Logger(GeminiLLMAdapter.name);
  private readonly ai: GoogleGenAI | null;
  private readonly model: string;
  private readonly useSearch: boolean;
  private readonly useThinking: boolean;
  private readonly enabled: boolean;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY') ?? '';
    this.model = this.config.get<string>('LLM_MODEL') ?? 'gemma-4-31b-it';
    this.useSearch = this.config.get<string>('GEMINI_USE_SEARCH') === 'true';
    this.useThinking = this.config.get<string>('GEMINI_THINKING') === 'true';

    this.enabled = apiKey.length > 0;
    this.ai = this.enabled ? new GoogleGenAI({ apiKey }) : null;

    if (this.enabled) {
      this.logger.log(
        `Gemma configurado (@google/genai): model=${this.model}, search=${this.useSearch}, thinking=${this.useThinking}`,
      );
    } else {
      this.logger.warn(
        'GEMINI_API_KEY no definido — la IA está deshabilitada, se usarán fallbacks.',
      );
    }
  }

  /** True cuando hay token y el cliente está listo. */
  isEnabled(): boolean {
    return this.enabled;
  }

  async complete(request: LLMCompletionRequest): Promise<string> {
    if (!this.ai) {
      throw new LLMUnavailableException('GEMINI_API_KEY no configurado');
    }

    const model = request.model ?? this.model;

    // Gemma no soporta system role: se fusiona el prompt en un solo turno user.
    const text = `${request.systemPrompt}\n\n---\n\n${request.userMessage}`;
    const contents = [{ role: 'user', parts: [{ text }] }];

    const config: Record<string, unknown> = {
      temperature: request.temperature ?? 0.2,
      maxOutputTokens: request.maxTokens ?? 4096,
    };
    if (this.useSearch) config.tools = [{ googleSearch: {} }];
    if (this.useThinking) config.thinkingConfig = { thinkingBudget: -1 };

    try {
      return await this.stream(model, config, contents);
    } catch (err) {
      // Si el modelo rechaza tools/thinking, reintenta con config mínima.
      if (this.useSearch || this.useThinking) {
        this.logger.warn(
          `Reintentando sin tools/thinking: ${(err as Error).message}`,
        );
        const minimal = {
          temperature: request.temperature ?? 0.2,
          maxOutputTokens: request.maxTokens ?? 4096,
        };
        try {
          return await this.stream(model, minimal, contents);
        } catch (err2) {
          throw this.wrap(err2);
        }
      }
      throw this.wrap(err);
    }
  }

  private async stream(
    model: string,
    config: Record<string, unknown>,
    contents: unknown,
  ): Promise<string> {
    const response = await this.ai!.models.generateContentStream({
      model,
      config,
      contents,
    } as never);

    let out = '';
    for await (const chunk of response) {
      if (chunk.text) out += chunk.text;
    }

    if (!out) {
      throw new LLMUnavailableException('El modelo no retornó contenido');
    }
    this.logger.debug(`Gemma respondió ${out.length} chars`);
    return out;
  }

  private wrap(err: unknown): LLMUnavailableException {
    if (err instanceof LLMUnavailableException) return err;
    const message = (err as Error).message ?? String(err);
    this.logger.error(`Error en llamada Gemma: ${message}`);
    return new LLMUnavailableException(message);
  }
}
