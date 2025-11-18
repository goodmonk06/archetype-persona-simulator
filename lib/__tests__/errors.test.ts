import { describe, it, expect } from 'vitest';
import {
  AppError,
  NotFoundError,
  ValidationError,
  ConflictError,
  PersonaNotFoundError,
  PersonaProfileMissingError,
  OpenAIError,
  ErrorCode,
  isAppError,
  normalizeError,
  formatErrorResponse,
} from '../errors';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create an app error with all properties', () => {
      const error = new AppError(
        ErrorCode.BAD_REQUEST,
        'Test error',
        400,
        { field: 'test' }
      );

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe(ErrorCode.BAD_REQUEST);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ field: 'test' });
      expect(error.isOperational).toBe(true);
    });

    it('should serialize to JSON correctly', () => {
      const error = new AppError(ErrorCode.NOT_FOUND, 'Not found', 404);
      const json = error.toJSON();

      expect(json).toHaveProperty('code', ErrorCode.NOT_FOUND);
      expect(json).toHaveProperty('message', 'Not found');
      expect(json).toHaveProperty('statusCode', 404);
    });

    it('should include stack trace in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new AppError(ErrorCode.INTERNAL_SERVER_ERROR, 'Error', 500);
      const json = error.toJSON();

      expect(json).toHaveProperty('stack');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('NotFoundError', () => {
    it('should create a not found error', () => {
      const error = new NotFoundError('User', '123');

      expect(error.message).toBe("User with identifier '123' not found");
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe(ErrorCode.NOT_FOUND);
    });

    it('should create a not found error without identifier', () => {
      const error = new NotFoundError('User');

      expect(error.message).toBe('User not found');
    });
  });

  describe('ValidationError', () => {
    it('should create a validation error', () => {
      const error = new ValidationError('Invalid input', { field: 'email' });

      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.details).toEqual({ field: 'email' });
    });
  });

  describe('ConflictError', () => {
    it('should create a conflict error', () => {
      const error = new ConflictError('Resource already exists');

      expect(error.message).toBe('Resource already exists');
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe(ErrorCode.CONFLICT);
    });
  });

  describe('Domain-specific errors', () => {
    it('should create PersonaNotFoundError', () => {
      const error = new PersonaNotFoundError('warm-mentor');

      expect(error.message).toBe("Persona with identifier 'warm-mentor' not found");
      expect(error.code).toBe(ErrorCode.PERSONA_NOT_FOUND);
      expect(error.statusCode).toBe(404);
    });

    it('should create PersonaProfileMissingError', () => {
      const error = new PersonaProfileMissingError('warm-mentor');

      expect(error.message).toContain('has no prompt profile configured');
      expect(error.code).toBe(ErrorCode.PERSONA_PROFILE_MISSING);
      expect(error.statusCode).toBe(400);
    });

    it('should create OpenAIError', () => {
      const error = new OpenAIError('Rate limit exceeded');

      expect(error.message).toContain('OpenAI');
      expect(error.code).toBe(ErrorCode.OPENAI_API_ERROR);
      expect(error.statusCode).toBe(502);
    });
  });

  describe('Error utilities', () => {
    it('should detect AppError instances', () => {
      const appError = new ValidationError('Test');
      const normalError = new Error('Test');

      expect(isAppError(appError)).toBe(true);
      expect(isAppError(normalError)).toBe(false);
      expect(isAppError('string')).toBe(false);
      expect(isAppError(null)).toBe(false);
    });

    it('should normalize AppError', () => {
      const error = new ValidationError('Test');
      const normalized = normalizeError(error);

      expect(normalized).toBe(error);
    });

    it('should normalize regular Error', () => {
      const error = new Error('Test error');
      const normalized = normalizeError(error);

      expect(normalized).toBeInstanceOf(AppError);
      expect(normalized.message).toBe('Test error');
      expect(normalized.statusCode).toBe(500);
    });

    it('should normalize unknown errors', () => {
      const error = 'Some string error';
      const normalized = normalizeError(error);

      expect(normalized).toBeInstanceOf(AppError);
      expect(normalized.message).toBe('An unknown error occurred');
      expect(normalized.statusCode).toBe(500);
    });

    it('should format error response', () => {
      const error = new ValidationError('Invalid data', { field: 'email' });
      const response = formatErrorResponse(error);

      expect(response).toHaveProperty('error');
      expect(response.error).toHaveProperty('code', ErrorCode.VALIDATION_ERROR);
      expect(response.error).toHaveProperty('message', 'Invalid data');
      expect(response.error).toHaveProperty('statusCode', 400);
      expect(response.error).toHaveProperty('details', { field: 'email' });
    });
  });
});
