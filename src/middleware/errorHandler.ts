import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { logger } from "../logger.js";
import { AppError, ErrorCode } from "../errors/AppError.js";
import { ApiErrorResponse } from "../types.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let statusCode = 500;
  let response: ApiErrorResponse = {
    success: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: "An unexpected error occurred",
    },
  };

  // Handle Specialized Errors
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    response.error = {
      code: err.code,
      message: err.message,
      details: err.details,
    };
  }
  // Handle Zod Validation Errors
  else if (err instanceof ZodError) {
    statusCode = 400;
    response.error = {
      code: ErrorCode.VALIDATION_ERROR,
      message: "Validation failed",
      details: err.issues.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    };
  }
  // Handle Express/Body-parser Errors
  else if (err?.type === "entity.parse.failed") {
    statusCode = 400;
    response.error = { code: ErrorCode.BAD_REQUEST, message: "Invalid JSON format" };
  } else if (err?.type === "entity.too.large" || err?.code === "LIMIT_FILE_SIZE") {
    statusCode = 413;
    response.error = { code: ErrorCode.BAD_REQUEST, message: "Payload or file too large" };
  } else if (err?.code === "LIMIT_UNEXPECTED_FILE") {
    statusCode = 400;
    response.error = { code: ErrorCode.BAD_REQUEST, message: "Unexpected file" };
  }
  // Fallback for other errors with status
  else if (err?.status && typeof err.status === "number") {
    statusCode = err.status;
    response.error = {
      code: typeof err.code === "string" ? err.code : ErrorCode.INTERNAL_ERROR,
      message: err.message || "Request failed",
    };
  }

  // Log error based on severity
  const requestId = res.locals?.requestId;
  const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

  if (statusCode >= 500) {
    logger.error("request.internal_error", {
      requestId,
      statusCode,
      path: _req.path,
      method: _req.method,
      err: {
        name: err.name,
        message: err.message,
        stack: isDevelopment ? err.stack : undefined, // Only include stack in development
        code: err.code,
        ...err,
      },
    });
  } else {
    logger.warn("request.client_error", {
      requestId,
      statusCode,
      code: response.error.code,
      message: err.message,
    });
  }

  return res.status(statusCode).json(response);
};
