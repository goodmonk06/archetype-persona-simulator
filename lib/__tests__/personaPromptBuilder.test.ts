import { describe, it, expect } from 'vitest';
import { buildPersonaPrompt, buildMinimalPrompt } from '../personaPromptBuilder';
import type { Persona, PersonaPromptProfile } from '@/app/generated/prisma';

describe('personaPromptBuilder', () => {
  const mockPersona: Persona = {
    id: 'test-id',
    key: 'test-mentor',
    name: 'Test Mentor',
    archetypeGroup: 'Mentor',
    descriptionMarkdown: 'A helpful guide for testing',
    primaryValuesJson: JSON.stringify(['Growth', 'Compassion', 'Wisdom']),
    shadowAspectsJson: JSON.stringify(['Over-protection', 'Imposing path on others']),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPromptProfile: PersonaPromptProfile = {
    id: 'profile-id',
    personaId: 'test-id',
    systemPromptMarkdown: 'You are a test mentor. Guide with wisdom.',
    styleGuidelinesMarkdown: '- Be warm and patient\n- Ask reflective questions',
    exampleDialoguesJson: JSON.stringify([
      {
        user: 'I need help',
        assistant: 'I\'m here to support you. What challenges are you facing?',
      },
    ]),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('buildPersonaPrompt', () => {
    it('should build a complete system prompt with all sections', () => {
      const personaWithProfile = {
        ...mockPersona,
        promptProfile: mockPromptProfile,
      };

      const result = buildPersonaPrompt(personaWithProfile);

      expect(result.systemPrompt).toContain('Test Mentor');
      expect(result.systemPrompt).toContain('Mentor');
      expect(result.systemPrompt).toContain('A helpful guide for testing');
      expect(result.systemPrompt).toContain('Growth');
      expect(result.systemPrompt).toContain('Compassion');
      expect(result.systemPrompt).toContain('You are a test mentor');
      expect(result.systemPrompt).toContain('Be warm and patient');
      expect(result.systemPrompt).toContain('I need help');
      expect(result.estimatedTokens).toBeGreaterThan(0);
    });

    it('should include shadow aspects when present', () => {
      const personaWithProfile = {
        ...mockPersona,
        promptProfile: mockPromptProfile,
      };

      const result = buildPersonaPrompt(personaWithProfile);

      expect(result.systemPrompt).toContain('Over-protection');
      expect(result.systemPrompt).toContain('Shadow Aspects');
    });

    it('should handle persona without shadow aspects', () => {
      const personaWithProfile = {
        ...mockPersona,
        shadowAspectsJson: null,
        promptProfile: mockPromptProfile,
      };

      const result = buildPersonaPrompt(personaWithProfile);

      expect(result.systemPrompt).not.toContain('Shadow Aspects');
    });

    it('should include safety rules', () => {
      const personaWithProfile = {
        ...mockPersona,
        promptProfile: mockPromptProfile,
      };

      const result = buildPersonaPrompt(personaWithProfile);

      expect(result.systemPrompt).toContain('Safety');
      expect(result.systemPrompt).toContain('harmful');
    });

    it('should throw error if no prompt profile', () => {
      const personaWithoutProfile = {
        ...mockPersona,
        promptProfile: null,
      };

      expect(() => buildPersonaPrompt(personaWithoutProfile)).toThrow(
        'has no prompt profile'
      );
    });

    it('should estimate tokens based on content length', () => {
      const personaWithProfile = {
        ...mockPersona,
        promptProfile: mockPromptProfile,
      };

      const result = buildPersonaPrompt(personaWithProfile);

      // Rough estimate: ~4 chars per token
      const expectedTokens = Math.ceil(result.systemPrompt.length / 4);
      expect(result.estimatedTokens).toBe(expectedTokens);
    });
  });

  describe('buildMinimalPrompt', () => {
    it('should build a minimal prompt with basic info', () => {
      const result = buildMinimalPrompt(mockPersona);

      expect(result).toContain('Test Mentor');
      expect(result).toContain('Mentor archetype');
      expect(result).toContain('Growth');
      expect(result).toContain('Compassion');
      expect(result).toContain('Wisdom');
      expect(result).toContain('Respond in character');
    });

    it('should not include shadow aspects or examples', () => {
      const result = buildMinimalPrompt(mockPersona);

      expect(result).not.toContain('Shadow');
      expect(result).not.toContain('I need help');
    });
  });
});
