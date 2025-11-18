import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { openaiAdapter, type ChatMessage } from '@/lib/openai';
import { buildPersonaPrompt } from '@/lib/personaPromptBuilder';
import { z } from 'zod';

const respondSchema = z.object({
  userMessage: z.string().min(1),
  contextJson: z.record(z.any()).optional(),
  scenarioId: z.string().optional(),
});

/**
 * POST /api/personas/[key]/respond
 * Generate a response as a specific persona
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const startTime = Date.now();

  try {
    const { key } = await params;
    const body = await request.json();
    const validated = respondSchema.parse(body);

    // Fetch the persona with its prompt profile
    const persona = await prisma.persona.findUnique({
      where: { key },
      include: {
        promptProfile: true,
      },
    });

    if (!persona) {
      return NextResponse.json(
        { error: 'Persona not found' },
        { status: 404 }
      );
    }

    if (!persona.promptProfile) {
      return NextResponse.json(
        { error: 'Persona has no prompt profile configured' },
        { status: 400 }
      );
    }

    // Build the system prompt
    const { systemPrompt, estimatedTokens } = buildPersonaPrompt(persona);

    // Prepare messages for OpenAI
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: validated.userMessage,
      },
    ];

    // Generate response using OpenAI
    const completion = await openaiAdapter.generateCompletion({
      messages,
      temperature: 0.8, // Slightly higher for more personality
    });

    const duration = Date.now() - startTime;

    // Log the response
    const metadata = {
      model: completion.model,
      usage: completion.usage,
      finishReason: completion.finishReason,
      duration,
      estimatedPromptTokens: estimatedTokens,
      context: validated.contextJson,
    };

    const responseLog = await prisma.personaResponseLog.create({
      data: {
        personaId: persona.id,
        scenarioId: validated.scenarioId || null,
        inputPrompt: validated.userMessage,
        outputText: completion.content,
        metadataJson: JSON.stringify(metadata),
      },
    });

    return NextResponse.json({
      response: completion.content,
      persona: {
        key: persona.key,
        name: persona.name,
        archetypeGroup: persona.archetypeGroup,
      },
      metadata: {
        logId: responseLog.id,
        ...metadata,
      },
    });
  } catch (error) {
    console.error('Error generating persona response:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate response', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
