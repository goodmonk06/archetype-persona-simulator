/**
 * Interface for LLM providers
 * Allows swapping between OpenAI, Anthropic, local models, etc.
 */

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMCompletionRequest {
  messages: LLMMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
}

export interface LLMCompletionResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
  metadata?: Record<string, unknown>;
}

export interface ILLMProvider {
  /**
   * Provider name for identification
   */
  readonly name: string;

  /**
   * Generate a completion from the LLM
   */
  generateCompletion(request: LLMCompletionRequest): Promise<LLMCompletionResponse>;

  /**
   * Estimate token count for given text
   */
  estimateTokens(text: string): number;

  /**
   * Check if the provider is available/healthy
   */
  healthCheck(): Promise<boolean>;
}
