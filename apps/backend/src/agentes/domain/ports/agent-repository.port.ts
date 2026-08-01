import { AgentDefinition } from '../agent.types';

/** Puerto de carga de definiciones de agente (archivos .md). */
export interface IAgentRepository {
  /** Carga agents/{id}.md. Lanza AgentNotFoundException si no existe. */
  load(agentId: string): Promise<AgentDefinition>;
  /** Lista los ids de agente disponibles. */
  list(): Promise<string[]>;
}

export const AGENT_REPOSITORY_PORT = Symbol('IAgentRepository');
