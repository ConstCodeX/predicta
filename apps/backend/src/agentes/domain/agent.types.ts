/**
 * Definición de un agente cargado desde un archivo Markdown (agents/{id}.md).
 *
 * Convención del archivo .md:
 *   - Frontmatter YAML opcional entre `---` con claves: model, temperature,
 *     max_tokens, json_mode.
 *   - El cuerpo Markdown es el system prompt / instrucciones del agente
 *     (qué hace, cómo razona y el contrato JSON exacto que debe devolver).
 */
export interface AgentDefinition {
  /** Identificador = nombre del archivo sin extensión (ej. "dengue-seir"). */
  id: string;
  /** Cuerpo Markdown que se usa como system prompt. */
  instructions: string;
  /** Metadatos opcionales del frontmatter. */
  meta: AgentMeta;
}

export interface AgentMeta {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  /** Fuerza response_format=json_object en el proveedor si lo soporta. */
  json_mode?: boolean;
}

export interface RunAgentInput {
  /** Id del agente = archivo agents/{agentId}.md */
  agentId: string;
  /** Payload que el frontend envía (se serializa como mensaje de usuario). */
  payload: unknown;
  /**
   * Contrato de salida opcional. Si se provee, se anexa al prompt para reforzar
   * la forma del JSON esperado por el frontend.
   */
  outputContract?: string;
}

export interface RunAgentResult<T = unknown> {
  data: T;
  agentId: string;
  model: string;
  generado_en: string;
}

export class AgentNotFoundException extends Error {
  constructor(agentId: string) {
    super(`Agente no encontrado: ${agentId}`);
    this.name = 'AgentNotFoundException';
  }
}

export class AgentBadResponseException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AgentBadResponseException';
  }
}
