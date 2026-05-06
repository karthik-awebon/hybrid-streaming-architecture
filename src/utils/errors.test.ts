import { describe, it, expect } from 'vitest';
import { AppError, ValidationError, NotFoundError, UnauthorizedError } from './errors';

describe('AppError', () => {
  it('should create an AppError with correct properties', () => {
    const error = new AppError('Test error', 500, { detail: 'none' });
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(500);
    expect(error.details).toEqual({ detail: 'none' });
    expect(error.isOperational).toBe(true);
  });

  it('should default to 500 status code', () => {
    const error = new AppError('Default error');
    expect(error.statusCode).toBe(500);
  });
});

describe('ValidationError', () => {
  it('should create a ValidationError with 400 status code', () => {
    const error = new ValidationError('Invalid input');
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Invalid input');
  });
});

describe('NotFoundError', () => {
  it('should create a NotFoundError with 404 status code', () => {
    const error = new NotFoundError();
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Resource not found');
  });
});

describe('UnauthorizedError', () => {
  it('should create an UnauthorizedError with 401 status code', () => {
    const error = new UnauthorizedError();
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Unauthorized');
  });
});
