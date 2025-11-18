import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const createPersonaSchema = z.object({
  key: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Key must be lowercase alphanumeric with hyphens'),
  name: z.string().min(1),
  archetypeGroup: z.string().min(1),
  descriptionMarkdown: z.string().min(1),
  primaryValuesJson: z.string().refine(
    (val) => {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed);
      } catch {
        return false;
      }
    },
    { message: 'primaryValuesJson must be a valid JSON array' }
  ),
  shadowAspectsJson: z.string().optional(),
});

/**
 * GET /api/personas
 * List all personas
 */
export async function GET() {
  try {
    const personas = await prisma.persona.findMany({
      include: {
        promptProfile: true,
        _count: {
          select: {
            testScenarios: true,
            responseLogs: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(personas);
  } catch (error) {
    console.error('Error fetching personas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch personas' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/personas
 * Create a new persona
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = createPersonaSchema.parse(body);

    // Check if key already exists
    const existing = await prisma.persona.findUnique({
      where: { key: validated.key },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A persona with this key already exists' },
        { status: 400 }
      );
    }

    const persona = await prisma.persona.create({
      data: {
        key: validated.key,
        name: validated.name,
        archetypeGroup: validated.archetypeGroup,
        descriptionMarkdown: validated.descriptionMarkdown,
        primaryValuesJson: validated.primaryValuesJson,
        shadowAspectsJson: validated.shadowAspectsJson,
      },
      include: {
        promptProfile: true,
      },
    });

    return NextResponse.json(persona, { status: 201 });
  } catch (error) {
    console.error('Error creating persona:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create persona' },
      { status: 500 }
    );
  }
}
