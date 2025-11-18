/**
 * Centralized error handling utilities
 */

export enum ErrorCode {
  // Client errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Server errors (5xx)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',

  // Domain-specific errors
  PERSONA_NOT_FOUND = 'PERSONA_NOT_FOUND',
  PERSONA_PROFILE_MISSING = 'PERSONA_PROFILE_MISSING',
  SCENARIO_NOT_FOUND = 'SCENARIO_NOT_FOUND',
  INVALID_PERSONA_KEY = 'INVALID_PERSONA_KEY',
  OPENAI_API_ERROR = 'OPENAI_API_ERROR',
}

export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  statusCode: number;
  details?: unknown;
  stack?: string;
}

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number,
    details?: unknown,
    isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);

    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;

    Error.captureStackTrace(this);
  }

  toJSON(): ErrorDetails {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
    };
  }
}

/**
 * Specific error classes for common scenarios
 */

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(ErrorCode.NOT_FOUND, message, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super(ErrorCode.CONFLICT, message, 409, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(ErrorCode.UNAUTHORIZED, message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(ErrorCode.FORBIDDEN, message, 403);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', details?: unknown) {
    super(ErrorCode.INTERNAL_SERVER_ERROR, message, 500, details, false);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, details?: unknown) {
    super(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      `External service error (${service}): ${message}`,
      502,
      details
    );
  }
}

/**
 * Domain-specific errors
 */

export class PersonaNotFoundError extends NotFoundError {
  constructor(key: string) {
    super('Persona', key);
    this.code = ErrorCode.PERSONA_NOT_FOUND;
  }
}

export class PersonaProfileMissingError extends AppError {
  constructor(personaKey: string) {
    super(
      ErrorCode.PERSONA_PROFILE_MISSING,
      `Persona '${personaKey}' has no prompt profile configured`,
      400
    );
  }
}

export class ScenarioNotFoundError extends NotFoundError {
  constructor(id: string) {
    super('Test scenario', id);
    this.code = ErrorCode.SCENARIO_NOT_FOUND;
  }
}

export class InvalidPersonaKeyError extends ValidationError {
  constructor(key: string) {
    super(
      `Invalid persona key: '${key}'. Must be lowercase alphanumeric with hyphens only.`
    );
    this.code = ErrorCode.INVALID_PERSONA_KEY;
  }
}

export class OpenAIError extends ExternalServiceError {
  constructor(message: string, details?: unknown) {
    super('OpenAI', message, details);
    this.code = ErrorCode.OPENAI_API_ERROR;
  }
}

/**
 * Error handling utilities
 */

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function normalizeError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new InternalServerError(error.message, {
      originalError: error.message,
      stack: error.stack,
    });
  }

  return new InternalServerError('An unknown error occurred', {
    originalError: String(error),
  });
}

/**
 * Format error for API response
 */
export function formatErrorResponse(error: unknown): {
  error: ErrorDetails;
} {
  const appError = normalizeError(error);
  return {
    error: appError.toJSON(),
  };
}
