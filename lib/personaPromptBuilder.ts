import { Persona, PersonaPromptProfile } from '@/app/generated/prisma';

export interface PersonaWithProfile extends Persona {
  promptProfile: PersonaPromptProfile | null;
}

export interface ExampleDialogue {
  user: string;
  assistant: string;
}

export interface PromptBuildResult {
  systemPrompt: string;
  estimatedTokens: number;
}

/**
 * Global safety and behavior rules applied to all personas
 */
const GLOBAL_SAFETY_RULES = `
## Safety & Boundaries
- Never provide harmful, illegal, or dangerous advice
- Respect user privacy and confidentiality
- Decline requests that violate ethical guidelines
- Stay within your defined persona boundaries
- If asked to break character, politely decline and explain your role
`.trim();

/**
 * Base template for persona system prompts
 */
const BASE_PROMPT_TEMPLATE = `
You are embodying the persona of **{personaName}**, a {archetypeGroup} archetype.

## Persona Description
{descriptionMarkdown}

## Core Values
{primaryValues}

{shadowAspectsSection}

## Your Role
Respond to all user messages as this persona, maintaining consistency with the character's:
- Tone of voice
- Communication patterns
- Values and beliefs
- Boundaries and limitations

{customSystemPrompt}

{styleGuidelines}

{exampleDialogues}

{safetyRules}
`.trim();

/**
 * Builds the complete system prompt for a persona
 */
export function buildPersonaPrompt(persona: PersonaWithProfile): PromptBuildResult {
  if (!persona.promptProfile) {
    throw new Error(`Persona ${persona.key} has no prompt profile`);
  }

  const profile = persona.promptProfile;

  // Parse JSON fields
  const primaryValues: string[] = JSON.parse(persona.primaryValuesJson);
  const shadowAspects: string[] = persona.shadowAspectsJson
    ? JSON.parse(persona.shadowAspectsJson)
    : [];
  const exampleDialogues: ExampleDialogue[] = JSON.parse(profile.exampleDialoguesJson);

  // Build primary values section
  const primaryValuesText = primaryValues
    .map((value) => `- ${value}`)
    .join('\n');

  // Build shadow aspects section (if any)
  const shadowAspectsSection = shadowAspects.length > 0
    ? `
## Shadow Aspects (Avoid These)
${shadowAspects.map((aspect) => `- ${aspect}`).join('\n')}
`.trim()
    : '';

  // Build style guidelines section
  const styleGuidelines = profile.styleGuidelinesMarkdown
    ? `
## Communication Style
${profile.styleGuidelinesMarkdown}
`.trim()
    : '';

  // Build example dialogues section
  const exampleDialoguesText = exampleDialogues.length > 0
    ? `
## Example Interactions
${exampleDialogues
  .map(
    (dialogue, idx) => `
### Example ${idx + 1}
**User:** ${dialogue.user}

**${persona.name}:** ${dialogue.assistant}
`.trim()
  )
  .join('\n\n')}
`.trim()
    : '';

  // Assemble the complete prompt
  let systemPrompt = BASE_PROMPT_TEMPLATE
    .replace('{personaName}', persona.name)
    .replace('{archetypeGroup}', persona.archetypeGroup)
    .replace('{descriptionMarkdown}', persona.descriptionMarkdown)
    .replace('{primaryValues}', primaryValuesText)
    .replace('{shadowAspectsSection}', shadowAspectsSection)
    .replace('{customSystemPrompt}', profile.systemPromptMarkdown)
    .replace('{styleGuidelines}', styleGuidelines)
    .replace('{exampleDialogues}', exampleDialoguesText)
    .replace('{safetyRules}', GLOBAL_SAFETY_RULES);

  // Clean up extra blank lines
  systemPrompt = systemPrompt.replace(/\n{3,}/g, '\n\n');

  // Estimate token count (rough: ~4 chars per token)
  const estimatedTokens = Math.ceil(systemPrompt.length / 4);

  return {
    systemPrompt,
    estimatedTokens,
  };
}

/**
 * Builds a minimal prompt for testing purposes
 */
export function buildMinimalPrompt(persona: Persona): string {
  const primaryValues: string[] = JSON.parse(persona.primaryValuesJson);

  return `
You are ${persona.name}, a ${persona.archetypeGroup} archetype.

${persona.descriptionMarkdown}

Core values:
${primaryValues.map((v) => `- ${v}`).join('\n')}

Respond in character to all messages.
`.trim();
}
