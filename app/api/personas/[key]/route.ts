import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updatePersonaSchema = z.object({
  name: z.string().min(1).optional(),
  archetypeGroup: z.string().min(1).optional(),
  descriptionMarkdown: z.string().min(1).optional(),
  primaryValuesJson: z.string().optional(),
  shadowAspectsJson: z.string().optional(),
});

/**
 * GET /api/personas/[key]
 * Get a single persona by key
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;

    const persona = await prisma.persona.findUnique({
      where: { key },
      include: {
        promptProfile: true,
        testScenarios: {
          orderBy: { createdAt: 'desc' },
        },
        responseLogs: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!persona) {
      return NextResponse.json(
        { error: 'Persona not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(persona);
  } catch (error) {
    console.error('Error fetching persona:', error);
    return NextResponse.json(
      { error: 'Failed to fetch persona' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/personas/[key]
 * Update a persona
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const body = await request.json();
    const validated = updatePersonaSchema.parse(body);

    const persona = await prisma.persona.update({
      where: { key },
      data: validated,
      include: {
        promptProfile: true,
      },
    });

    return NextResponse.json(persona);
  } catch (error) {
    console.error('Error updating persona:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update persona' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/personas/[key]
 * Delete a persona
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;

    await prisma.persona.delete({
      where: { key },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting persona:', error);
    return NextResponse.json(
      { error: 'Failed to delete persona' },
      { status: 500 }
    );
  }
}
