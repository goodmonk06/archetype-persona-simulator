import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const promptProfileSchema = z.object({
  systemPromptMarkdown: z.string(),
  styleGuidelinesMarkdown: z.string(),
  exampleDialoguesJson: z.string().refine(
    (val) => {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed);
      } catch {
        return false;
      }
    },
    { message: 'exampleDialoguesJson must be a valid JSON array' }
  ),
});

/**
 * PUT /api/personas/[key]/prompt-profile
 * Create or update the prompt profile for a persona
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const body = await request.json();
    const validated = promptProfileSchema.parse(body);

    // First, find the persona
    const persona = await prisma.persona.findUnique({
      where: { key },
      include: { promptProfile: true },
    });

    if (!persona) {
      return NextResponse.json(
        { error: 'Persona not found' },
        { status: 404 }
      );
    }

    // Upsert the prompt profile
    const promptProfile = await prisma.personaPromptProfile.upsert({
      where: { personaId: persona.id },
      create: {
        personaId: persona.id,
        ...validated,
      },
      update: validated,
    });

    return NextResponse.json(promptProfile);
  } catch (error) {
    console.error('Error updating prompt profile:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update prompt profile' },
      { status: 500 }
    );
  }
}
