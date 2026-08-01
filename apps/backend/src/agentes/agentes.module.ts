import { Module } from '@nestjs/common';
import { LLM_ADAPTER_PORT } from '../predicciones/domain/ports/llm-adapter.port';
import { AGENT_REPOSITORY_PORT } from './domain/ports/agent-repository.port';
import { GeminiLLMAdapter } from './infrastructure/gemini-llm.adapter';
import { FsAgentRepository } from './infrastructure/fs-agent.repository';
import { RunAgentUseCase } from './application/run-agent.use-case';

/**
 * Módulo de agentes IA.
 * - LLM_ADAPTER_PORT  -> GeminiLLMAdapter (Gemma vía Google, token en env).
 * - AGENT_REPOSITORY_PORT -> FsAgentRepository (lee agents/*.md).
 * Exporta RunAgentUseCase para que otros módulos ejecuten agentes.
 */
@Module({
  providers: [
    GeminiLLMAdapter,
    { provide: LLM_ADAPTER_PORT, useExisting: GeminiLLMAdapter },
    { provide: AGENT_REPOSITORY_PORT, useClass: FsAgentRepository },
    RunAgentUseCase,
  ],
  exports: [RunAgentUseCase, GeminiLLMAdapter],
})
export class AgentesModule {}
