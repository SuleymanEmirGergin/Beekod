import { ErrorCode } from "./ErrorCodes.js";
export { ErrorCode };

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: ErrorCode = ErrorCode.INTERNAL_ERROR,
    public details?: any,
  ) {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message: string, details?: any) {
    return new ValidationError(message, details);
  }

  static unauthorized(message: string = "Unauthorized") {
    return new UnauthorizedError(message);
  }

  static forbidden(message: string = "Forbidden") {
    return new ForbiddenError(message);
  }

  static notFound(message: string = "Not Found") {
    return new NotFoundError(message);
  }

  static internal(message: string = "Internal Server Error", details?: any) {
    return new InternalError(message, details);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, ErrorCode.VALIDATION_ERROR, details);
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized access") {
    super(message, 401, ErrorCode.UNAUTHORIZED);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Access forbidden") {
    super(message, 403, ErrorCode.FORBIDDEN);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404, ErrorCode.NOT_FOUND);
    this.name = "NotFoundError";
  }
}

export class MarketplaceError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 502, ErrorCode.MARKETPLACE_ERROR, details);
    this.name = "MarketplaceError";
  }
}

export class InternalError extends AppError {
  constructor(message: string = "An internal server error occurred", details?: any) {
    super(message, 500, ErrorCode.INTERNAL_ERROR, details);
    this.name = "InternalError";
  }
}
