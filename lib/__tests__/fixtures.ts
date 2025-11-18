/**
 * Test fixtures and data factories for tests
 */

import type { Persona, PersonaPromptProfile } from '@/app/generated/prisma';

export const createMockPersona = (overrides?: Partial<Persona>): Persona => ({
  id: 'test-persona-id',
  key: 'test-mentor',
  name: 'Test Mentor',
  archetypeGroup: 'Mentor',
  descriptionMarkdown: 'A test mentor for unit tests',
  primaryValuesJson: JSON.stringify(['Growth', 'Learning', 'Compassion']),
  shadowAspectsJson: JSON.stringify(['Over-protection', 'Imposing views']),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const createMockPromptProfile = (
  overrides?: Partial<PersonaPromptProfile>
): PersonaPromptProfile => ({
  id: 'test-profile-id',
  personaId: 'test-persona-id',
  systemPromptMarkdown: 'You are a test mentor.',
  styleGuidelinesMarkdown: '- Be patient\n- Ask questions',
  exampleDialoguesJson: JSON.stringify([
    {
      user: 'I need help',
      assistant: 'How can I support you?',
    },
  ]),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const mockPersonas = {
  mentor: createMockPersona({
    id: 'mentor-1',
    key: 'warm-mentor',
    name: 'The Warm Mentor',
    archetypeGroup: 'Mentor',
  }),
  trickster: createMockPersona({
    id: 'trickster-1',
    key: 'playful-trickster',
    name: 'The Playful Trickster',
    archetypeGroup: 'Trickster',
    primaryValuesJson: JSON.stringify(['Disruption', 'Creativity', 'Humor']),
  }),
  sage: createMockPersona({
    id: 'sage-1',
    key: 'quiet-sage',
    name: 'The Quiet Sage',
    archetypeGroup: 'Sage',
    primaryValuesJson: JSON.stringify(['Wisdom', 'Contemplation', 'Clarity']),
  }),
};

export const mockExampleDialogues = [
  {
    user: 'I feel lost and confused.',
    assistant:
      'That feeling of being lost can be difficult. What aspect of your situation feels most unclear right now?',
  },
  {
    user: 'How do I get better at coding?',
    assistant:
      'Growth in coding comes through practice and reflection. What areas interest you most, and what have you already tried?',
  },
];

export const mockTestScenarios = [
  {
    id: 'scenario-1',
    personaId: 'test-persona-id',
    title: 'Handling Frustration',
    inputPrompt: "I've been stuck on this bug for hours!",
    expectedToneDescriptionMarkdown: 'Empathetic, patient, encouraging problem-solving',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'scenario-2',
    personaId: 'test-persona-id',
    title: 'Career Guidance',
    inputPrompt: 'Should I switch to a different framework?',
    expectedToneDescriptionMarkdown: 'Reflective questions, encouraging self-assessment',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

/**
 * Factory function to create test personas with variations
 */
export function createTestPersona(
  key: string,
  name: string,
  archetypeGroup: string,
  values: string[]
): Omit<Persona, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    key,
    name,
    archetypeGroup,
    descriptionMarkdown: `A ${archetypeGroup.toLowerCase()} archetype for testing`,
    primaryValuesJson: JSON.stringify(values),
    shadowAspectsJson: JSON.stringify([`Negative ${archetypeGroup}`]),
  };
}
