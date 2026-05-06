/**
 * Base application error class for handled exceptions.
 */
export class AppError extends Error {
  /** HTTP status code associated with the error. */
  public readonly statusCode: number;
  /** Whether the error is operational (expected) or a programmer error. */
  public readonly isOperational: boolean;
  /** Additional structured details about the error. */
  public readonly details?: unknown;

  /**
   * @param message - Descriptive error message.
   * @param statusCode - HTTP status code (defaults to 500).
   * @param details - Optional additional context.
   */
  constructor(message: string, statusCode: number = 500, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when input validation fails.
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, details);
  }
}

/**
 * Error thrown when a requested resource is not found.
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

/**
 * Error thrown when authentication or authorization fails.
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}
