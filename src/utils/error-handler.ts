import { ApiResponse } from './api-response';
import { logger } from './logger';

/**
 * Standardizes error message extraction from various sources (API responses, Error objects, etc.).
 * It also logs the error using the application logger.
 *
 * @param error - The error object or message to extract information from.
 * @returns A user-friendly error message string.
 */
export function getErrorMessage(error: unknown): string {
  logger.error('Error encountered', { error });

  if (typeof error === 'string') return error;

  if (error instanceof Error) {
    return error.message;
  }

  // Handle API response error format
  const apiError = error as ApiResponse;
  if (apiError && apiError.success === false && apiError.error) {
    return apiError.error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}
