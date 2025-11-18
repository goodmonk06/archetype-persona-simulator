import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { formatErrorResponse, ValidationError, normalizeError, isAppError } from './errors';

/**
 * Type-safe API handler wrapper
 */
export type ApiHandler<T = unknown> = (
  request: Request,
  context?: { params: Promise<Record<string, string>> }
) => Promise<T>;

/**
 * Wraps an API handler with centralized error handling
 */
export function withErrorHandler<T>(
  handler: ApiHandler<NextResponse<T>>
): ApiHandler<NextResponse<T | { error: unknown }>> {
  return async (request: Request, context?: { params: Promise<Record<string, string>> }) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Handle API errors and return appropriate response
 */
export function handleApiError(error: unknown): NextResponse {
  // Log error for debugging
  console.error('API Error:', error);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const validationError = new ValidationError('Validation failed', {
      issues: error.errors,
    });
    return NextResponse.json(formatErrorResponse(validationError), {
      status: 400,
    });
  }

  // Handle Prisma errors
  if (isPrismaError(error)) {
    return handlePrismaError(error);
  }

  // Handle application errors
  if (isAppError(error)) {
    return NextResponse.json(formatErrorResponse(error), {
      status: error.statusCode,
    });
  }

  // Handle unknown errors
  const normalizedError = normalizeError(error);
  return NextResponse.json(formatErrorResponse(normalizedError), {
    status: normalizedError.statusCode,
  });
}

/**
 * Check if error is a Prisma error
 */
function isPrismaError(error: unknown): error is { code: string; meta?: unknown } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  );
}

/**
 * Handle Prisma-specific errors
 */
function handlePrismaError(error: { code: string; meta?: unknown }): NextResponse {
  let message: string;
  let statusCode: number;

  switch (error.code) {
    case 'P2002': // Unique constraint violation
      message = 'A record with this value already exists';
      statusCode = 409;
      break;
    case 'P2025': // Record not found
      message = 'Record not found';
      statusCode = 404;
      break;
    case 'P2003': // Foreign key constraint violation
      message = 'Related record not found';
      statusCode = 400;
      break;
    case 'P2014': // Invalid ID
      message = 'Invalid identifier';
      statusCode = 400;
      break;
    default:
      message = 'Database error occurred';
      statusCode = 500;
  }

  return NextResponse.json(
    {
      error: {
        code: 'DATABASE_ERROR',
        message,
        statusCode,
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
    },
    { status: statusCode }
  );
}

/**
 * Success response helper
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

/**
 * Created response helper (201)
 */
export function createdResponse<T>(data: T): NextResponse<T> {
  return successResponse(data, 201);
}

/**
 * No content response helper (204)
 */
export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}
