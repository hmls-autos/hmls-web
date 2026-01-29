// Unified error handling for the agent

export enum ErrorCode {
  BAD_REQUEST = "BAD_REQUEST",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
}

const statusCodes: Record<ErrorCode, number> = {
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.VALIDATION_ERROR]: 422,
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
  [ErrorCode.DATABASE_ERROR]: 500,
};

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }

  get status(): number {
    return statusCodes[this.code];
  }

  toJSON() {
    const error: { code: ErrorCode; message: string; details?: unknown } = {
      code: this.code,
      message: this.message,
    };
    if (this.details !== undefined) {
      error.details = this.details;
    }
    return { error };
  }
}

// Convenience factories
export const Errors = {
  notFound: (resource: string, id?: string | number) =>
    new AppError(ErrorCode.NOT_FOUND, id ? `${resource} ${id} not found` : `${resource} not found`),

  badRequest: (message: string, details?: unknown) =>
    new AppError(ErrorCode.BAD_REQUEST, message, details),

  validation: (message: string, details?: unknown) =>
    new AppError(ErrorCode.VALIDATION_ERROR, message, details),

  internal: (message = "Internal server error") =>
    new AppError(ErrorCode.INTERNAL_ERROR, message),

  external: (service: string, message: string) =>
    new AppError(ErrorCode.EXTERNAL_SERVICE_ERROR, `${service}: ${message}`),

  database: (message: string) =>
    new AppError(ErrorCode.DATABASE_ERROR, message),
};
