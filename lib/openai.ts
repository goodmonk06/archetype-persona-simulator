import OpenAI from 'openai';

// Singleton OpenAI client
const globalForOpenAI = globalThis as unknown as {
  openai: OpenAI | undefined;
};

export const openai =
  globalForOpenAI.openai ??
  new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

if (process.env.NODE_ENV !== 'production') globalForOpenAI.openai = openai;

// Type definitions for our adapter
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatCompletionResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
}

/**
 * OpenAI adapter for generating persona responses
 */
export class OpenAIAdapter {
  private client: OpenAI;
  private defaultModel: string;

  constructor(client: OpenAI = openai, defaultModel: string = 'gpt-4o-mini') {
    this.client = client;
    this.defaultModel = defaultModel;
  }

  /**
   * Generate a chat completion response
   */
  async generateCompletion(
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    const startTime = Date.now();

    try {
      const completion = await this.client.chat.completions.create({
        model: request.model || this.defaultModel,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens,
      });

      const choice = completion.choices[0];
      if (!choice?.message?.content) {
        throw new Error('No content in OpenAI response');
      }

      return {
        content: choice.message.content,
        model: completion.model,
        usage: {
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0,
        },
        finishReason: choice.finish_reason || 'unknown',
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error(
        `Failed to generate completion: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Estimate token count (rough approximation)
   * For production, consider using tiktoken library
   */
  estimateTokenCount(text: string): number {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
}

// Export a default instance
export const openaiAdapter = new OpenAIAdapter();
