import { NextResponse } from 'next/server';
import { AppError } from './errors';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details?: unknown;
  };
}

export function createSuccessResponse<T>(data: T, status: number = 200) {
  const body: ApiResponse<T> = {
    success: true,
    data,
  };
  return NextResponse.json(body, { status });
}

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
