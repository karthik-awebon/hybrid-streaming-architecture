import { NextResponse } from 'next/server';
import { AppError } from './errors';

/**
 * Generic interface for API responses.
 * @template T - The type of the data returned on success.
 */
export interface ApiResponse<T = unknown> {
  /** Indicates if the request was successful. */
  success: boolean;
  /** The payload of the response, present if success is true. */
  data?: T;
  /** Error details, present if success is false. */
  error?: {
    /** Human-readable error message. */
    message: string;
    /** Optional additional technical details about the error. */
    details?: unknown;
  };
}

/**
 * Creates a standard successful NextResponse.
 *
 * @param data - The data to include in the response.
 * @param status - HTTP status code (defaults to 200).
 * @returns A NextResponse object.
 */
export function createSuccessResponse<T>(data: T, status: number = 200) {
  const body: ApiResponse<T> = {
    success: true,
    data,
  };
  return NextResponse.json(body, { status });
}

/**
 * Creates a standard error NextResponse from various error types.
 *
 * @param error - The error to transform into a response.
 * @returns A NextResponse object with appropriate status code and error details.
 */
export function createErrorResponse(error: unknown) {
  let message = 'Internal Server Error';
  let statusCode = 500;
  let details: unknown = undefined;

  if (error instanceof AppError) {
    message = error.message;
    statusCode = error.statusCode;
    details = error.details;
  } else if (error instanceof Error) {
    message = error.message;
  }

  const body: ApiResponse = {
    success: false,
    error: {
      message,
      ...(details ? { details } : {}),
    },
  };

  return NextResponse.json(body, { status: statusCode });
}
