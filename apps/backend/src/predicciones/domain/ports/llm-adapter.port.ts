export interface LLMCompletionRequest {
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
  temperature?: number;
  /** Override del modelo por request (ej. definido en el .md del agente). */
  model?: string;
}

export interface ILLMAdapter {
  complete(request: LLMCompletionRequest): Promise<string>;
}

export const LLM_ADAPTER_PORT = Symbol('ILLMAdapter');
