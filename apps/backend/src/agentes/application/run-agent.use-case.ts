import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  ILLMAdapter,
  LLM_ADAPTER_PORT,
} from '../../predicciones/domain/ports/llm-adapter.port';
import {
  AGENT_REPOSITORY_PORT,
  IAgentRepository,
} from '../domain/ports/agent-repository.port';
import {
  AgentBadResponseException,
  RunAgentInput,
  RunAgentResult,
} from '../domain/agent.types';

/**
 * Ejecuta un agente definido en un .md:
 *   1. Carga las instrucciones (system prompt) desde agents/{agentId}.md.
 *   2. Envía el payload del frontend a Gemma como mensaje de usuario.
 *   3. Parsea la respuesta como JSON con los elementos que el frontend mostrará.
 */
@Injectable()
export class RunAgentUseCase {
  private readonly logger = new Logger(RunAgentUseCase.name);

  constructor(
    @Inject(AGENT_REPOSITORY_PORT) private readonly agents: IAgentRepository,
    @Inject(LLM_ADAPTER_PORT) private readonly llm: ILLMAdapter,
  ) {}

  async execute<T = unknown>(input: RunAgentInput): Promise<RunAgentResult<T>> {
    const agent = await this.agents.load(input.agentId);

    const payloadJson = JSON.stringify(input.payload, null, 2);
    const contractBlock = input.outputContract
      ? `\n\nContrato de salida OBLIGATORIO (responde EXACTAMENTE con esta forma de JSON):\n${input.outputContract}`
      : '';

    const userMessage =
      `Datos de entrada (JSON):\n${payloadJson}` +
      contractBlock +
      `\n\nResponde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, ` +
      `sin explicaciones y sin bloques de código markdown.`;

    const raw = await this.llm.complete({
      systemPrompt: agent.instructions,
      userMessage,
      temperature: agent.meta.temperature ?? 0.2,
      maxTokens: agent.meta.max_tokens ?? 4096,
      model: agent.meta.model,
    });

    const data = this.parseJson<T>(raw);

    return {
      data,
      agentId: agent.id,
      model: agent.meta.model ?? 'default',
      generado_en: new Date().toISOString(),
    };
  }

  /** Extrae y parsea el primer objeto JSON del texto del modelo. */
  private parseJson<T>(raw: string): T {
    // Quita fences ```json ... ``` si el modelo los añadió.
    const cleaned = raw
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    const candidate =
      start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;

    try {
      return JSON.parse(candidate) as T;
    } catch (err) {
      this.logger.error(
        `No se pudo parsear JSON del agente: ${(err as Error).message}`,
      );
      throw new AgentBadResponseException(
        'El agente no devolvió un JSON válido',
      );
    }
  }
}
