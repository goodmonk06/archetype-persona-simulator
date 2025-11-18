/**
 * OpenAI implementation of ILLMProvider
 */

import { OpenAIAdapter } from '@/lib/openai';
import type {
  ILLMProvider,
  LLMCompletionRequest,
  LLMCompletionResponse,
} from '../ILLMProvider';

export class OpenAILLMProvider implements ILLMProvider {
  readonly name = 'openai';

  private adapter: OpenAIAdapter;

  constructor(adapter?: OpenAIAdapter) {
    this.adapter = adapter || new OpenAIAdapter();
  }

  async generateCompletion(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    const response = await this.adapter.generateCompletion({
      messages: request.messages,
      model: request.model,
      temperature: request.temperature,
      maxTokens: request.maxTokens,
    });

    return {
      content: response.content,
      model: response.model,
      usage: {
        promptTokens: response.usage.promptTokens,
        completionTokens: response.usage.completionTokens,
        totalTokens: response.usage.totalTokens,
      },
      finishReason: response.finishReason,
    };
  }

  estimateTokens(text: string): number {
    return this.adapter.estimateTokenCount(text);
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Simple test completion
      await this.generateCompletion({
        messages: [{ role: 'user', content: 'test' }],
        maxTokens: 5,
      });
      return true;
    } catch {
      return false;
    }
  }
}
