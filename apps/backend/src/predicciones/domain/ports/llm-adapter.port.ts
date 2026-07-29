export interface LLMCompletionRequest {
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ILLMAdapter {
  complete(request: LLMCompletionRequest): Promise<string>;
}

export const LLM_ADAPTER_PORT = Symbol('ILLMAdapter');
