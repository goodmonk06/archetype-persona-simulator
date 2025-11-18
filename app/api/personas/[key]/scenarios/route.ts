import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createScenarioSchema = z.object({
  title: z.string().min(1),
  inputPrompt: z.string().min(1),
  expectedToneDescriptionMarkdown: z.string().min(1),
});

/**
 * POST /api/personas/[key]/scenarios
 * Create a test scenario for a persona
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const body = await request.json();
    const validated = createScenarioSchema.parse(body);

    const persona = await prisma.persona.findUnique({
      where: { key },
    });

    if (!persona) {
      return NextResponse.json(
        { error: 'Persona not found' },
        { status: 404 }
      );
    }

    const scenario = await prisma.personaTestScenario.create({
      data: {
        personaId: persona.id,
        title: validated.title,
        inputPrompt: validated.inputPrompt,
        expectedToneDescriptionMarkdown: validated.expectedToneDescriptionMarkdown,
      },
    });

    return NextResponse.json(scenario, { status: 201 });
  } catch (error) {
    console.error('Error creating scenario:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create scenario' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/personas/[key]/scenarios
 * Get all test scenarios for a persona
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
        testScenarios: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!persona) {
      return NextResponse.json(
        { error: 'Persona not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(persona.testScenarios);
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scenarios' },
      { status: 500 }
    );
  }
}
