import { ApiResponse } from './api-response';

/**
 * Standardizes error message extraction from various sources (API responses, Error objects, etc.)
 */
export function getErrorMessage(error: unknown): string {
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
