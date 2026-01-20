import { Response } from "express";
import { logger } from "../logger.js";
import { ApiResponse, ApiErrorResponse } from "../api/contracts.js";

interface SendErrorOptions {
  res: Response;
  error: unknown;
  traceId?: string; // Unified name
  code?: string;
  statusCode?: number;
  message?: string;
}

export function sendErrorResponse({
  res,
  error,
  traceId,
  code = "INTERNAL_SERVER_ERROR",
  statusCode = 500,
  message = "An unexpected error occurred",
}: SendErrorOptions) {
  const finalTraceId = traceId || (res as any).traceId || `req-${Date.now()}`;
  const errorText = error instanceof Error ? error.message : String(error);

  // Set header
  res.setHeader("x-trace-id", finalTraceId);

  // Log strict error if status >= 500
  if (statusCode >= 500) {
    logger.error("api.response_error", {
      traceId: finalTraceId,
      code,
      message,
      error: errorText,
      stack: error instanceof Error ? error.stack : undefined,
    });
  } else {
    logger.warn("api.response_warn", {
      traceId: finalTraceId,
      code,
      message,
      error: errorText,
    });
  }

  const response: ApiErrorResponse = {
    error: {
      code,
      message,
      details: process.env.NODE_ENV === "development" ? errorText : undefined,
    },
    traceId: finalTraceId
  };

  return res.status(statusCode).json(response);
}

export function sendSuccessResponse<T>(res: Response, data: T, meta?: Record<string, unknown>) {
  const traceId = (res as any).traceId || `req-${Date.now()}`;
  res.setHeader("x-trace-id", traceId);

  const response: ApiResponse<T> = {
    data,
    traceId
  };
  return res.json(response);
}
