import { Response } from "express";
import { ApiErrorResponse, ApiResponse } from "../types.js";
import { logger } from "../logger.js";

interface SendErrorOptions {
  res: Response;
  error: unknown;
  requestId?: string;
  code?: string;
  statusCode?: number;
  message?: string;
  locale?: string;
}

export function sendErrorResponse({
  res,
  error,
  requestId,
  code = "INTERNAL_SERVER_ERROR",
  statusCode = 500,
  message = "An unexpected error occurred",
  locale,
}: SendErrorOptions) {
  const errorText = error instanceof Error ? error.message : String(error);

  // Log strict error if status >= 500
  if (statusCode >= 500) {
    logger.error("api.response_error", {
      requestId,
      code,
      message,
      error: errorText,
      stack: error instanceof Error ? error.stack : undefined,
    });
  } else {
    logger.warn("api.response_warn", {
      requestId,
      code,
      message,
      error: errorText,
    });
  }

  const response: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      details: process.env.NODE_ENV === "development" ? errorText : undefined,
    },
  };

  return res.status(statusCode).json(response);
}

export function sendSuccessResponse<T>(res: Response, data: T, meta?: Record<string, unknown>) {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta,
  };
  return res.json(response);
}
