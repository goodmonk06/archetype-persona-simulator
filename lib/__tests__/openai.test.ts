import { describe, it, expect, vi } from 'vitest';
import { OpenAIAdapter } from '../openai';
import OpenAI from 'openai';

describe('OpenAIAdapter', () => {
  describe('generateCompletion', () => {
    it('should generate a completion successfully', async () => {
      // Mock OpenAI client
      const mockCreate = vi.fn().mockResolvedValue({
        id: 'test-completion',
        model: 'gpt-4o-mini',
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'This is a test response',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
      });

      const mockClient = {
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      } as unknown as OpenAI;

      const adapter = new OpenAIAdapter(mockClient, 'gpt-4o-mini');

      const result = await adapter.generateCompletion({
        messages: [
          { role: 'system', content: 'You are a helpful assistant' },
          { role: 'user', content: 'Hello' },
        ],
      });

      expect(result.content).toBe('This is a test response');
      expect(result.model).toBe('gpt-4o-mini');
      expect(result.usage.totalTokens).toBe(15);
      expect(result.finishReason).toBe('stop');

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant' },
          { role: 'user', content: 'Hello' },
        ],
        temperature: 0.7,
        max_tokens: undefined,
      });
    });

    it('should use custom temperature', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        model: 'gpt-4o-mini',
        choices: [
          {
            message: { content: 'Response' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      });

      const mockClient = {
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      } as unknown as OpenAI;

      const adapter = new OpenAIAdapter(mockClient);

      await adapter.generateCompletion({
        messages: [{ role: 'user', content: 'Test' }],
        temperature: 0.9,
        maxTokens: 100,
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.9,
          max_tokens: 100,
        })
      );
    });

    it('should throw error when no content in response', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        model: 'gpt-4o-mini',
        choices: [
          {
            message: {},
            finish_reason: 'stop',
          },
        ],
      });

      const mockClient = {
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      } as unknown as OpenAI;

      const adapter = new OpenAIAdapter(mockClient);

      await expect(
        adapter.generateCompletion({
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toThrow('No content in OpenAI response');
    });

    it('should handle API errors', async () => {
      const mockCreate = vi.fn().mockRejectedValue(new Error('API Error'));

      const mockClient = {
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      } as unknown as OpenAI;

      const adapter = new OpenAIAdapter(mockClient);

      await expect(
        adapter.generateCompletion({
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toThrow('Failed to generate completion');
    });
  });

  describe('estimateTokenCount', () => {
    it('should estimate token count', () => {
      const adapter = new OpenAIAdapter({} as OpenAI);

      expect(adapter.estimateTokenCount('test')).toBe(1); // 4 chars = 1 token
      expect(adapter.estimateTokenCount('this is a longer text')).toBe(6); // 21 chars = 6 tokens (rounded up)
      expect(adapter.estimateTokenCount('a'.repeat(100))).toBe(25); // 100 chars = 25 tokens
    });
  });
});
