import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { withErrorHandler, successResponse, createdResponse } from '@/lib/apiHandler';
import { ValidationError, ConflictError } from '@/lib/errors';

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
export const GET = withErrorHandler(async () => {
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

  return successResponse(personas);
});

/**
 * POST /api/personas
 * Create a new persona
 */
export const POST = withErrorHandler(async (request: Request) => {
  const body = await request.json();
  const validated = createPersonaSchema.parse(body);

  // Check if key already exists
  const existing = await prisma.persona.findUnique({
    where: { key: validated.key },
  });

  if (existing) {
    throw new ConflictError(`A persona with key '${validated.key}' already exists`);
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

  return createdResponse(persona);
});
