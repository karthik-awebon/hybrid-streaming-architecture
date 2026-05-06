import { describe, it, expect } from 'vitest';
import { getErrorMessage } from './error-handler';
import { ApiResponse } from './api-response';

describe('getErrorMessage', () => {
  it('should return string as is', () => {
    expect(getErrorMessage('Error string')).toBe('Error string');
  });

  it('should return message from Error object', () => {
    expect(getErrorMessage(new Error('Native error'))).toBe('Native error');
  });

  it('should handle ApiResponse error format', () => {
    const apiError: ApiResponse = {
      success: false,
      error: {
        message: 'API error message',
      },
    };
    expect(getErrorMessage(apiError)).toBe('API error message');
  });

  it('should return default message for unknown error types', () => {
    expect(getErrorMessage({ unknown: 'object' })).toBe(
      'An unexpected error occurred. Please try again.'
    );
    expect(getErrorMessage(null)).toBe('An unexpected error occurred. Please try again.');
  });
});
