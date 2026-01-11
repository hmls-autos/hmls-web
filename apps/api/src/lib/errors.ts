/**
 * Base application error class with error codes and HTTP status.
 * All custom errors should extend this class.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace?.(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}

/**
 * Validation error (400 Bad Request)
 */
export class ValidationError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, "VALIDATION_ERROR", 400, cause);
  }
}

/**
 * Resource not found error (404 Not Found)
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id: string | number) {
    super(`${resource} with ID ${id} not found`, "NOT_FOUND", 404);
  }
}

/**
 * Cal.com API error
 */
export class CalComError extends AppError {
  constructor(message: string, statusCode: number = 502) {
    super(message, "CALCOM_ERROR", statusCode);
  }
}

/**
 * Stripe API error wrapper
 */
export class StripeApiError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, "STRIPE_ERROR", 502, cause);
  }
}

/**
 * Database error
 */
export class DatabaseError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, "DATABASE_ERROR", 500, cause);
  }
}

/**
 * Configuration error (fail fast)
 */
export class ConfigurationError extends AppError {
  constructor(message: string) {
    super(message, "CONFIGURATION_ERROR", 500);
  }
}
