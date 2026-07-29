import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ILLMAdapter, LLMCompletionRequest } from '../../domain/ports/llm-adapter.port';
import { LLMUnavailableException } from '../../domain/exceptions/prediccion.exceptions';

@Injectable()
export class GroqLLMAdapter implements ILLMAdapter {
  private readonly logger = new Logger(GroqLLMAdapter.name);
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = config.get<string>('GROQ_API_KEY') ?? '';
    const baseURL =
      config.get<string>('LLM_BASE_URL') ?? 'https://api.groq.com/openai/v1';

    this.model = config.get<string>('LLM_MODEL') ?? 'gemma2-9b-it';

    this.client = new OpenAI({ apiKey, baseURL });

    this.logger.log(`LLM configurado: model=${this.model}, baseURL=${baseURL}`);
  }

  async complete(request: LLMCompletionRequest): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: request.systemPrompt },
          { role: 'user', content: request.userMessage },
        ],
        max_tokens: request.maxTokens ?? 2048,
        temperature: request.temperature ?? 0.2,
        // response_format fuerza JSON en modelos que lo soportan (Llama3, Mixtral, Gemma2)
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new LLMUnavailableException('El modelo no retornó contenido');
      }

      this.logger.debug(
        `Tokens usados: prompt=${response.usage?.prompt_tokens}, completion=${response.usage?.completion_tokens}`,
      );

      return content;
    } catch (err) {
      if (err instanceof LLMUnavailableException) throw err;

      const message = (err as Error).message ?? String(err);
      this.logger.error(`Error en llamada LLM: ${message}`);
      throw new LLMUnavailableException(message);
    }
  }
}
