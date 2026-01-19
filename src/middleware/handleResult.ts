import { Response, Request, NextFunction } from "express";
import { Result } from "../utils/result.js";
import { sendSuccessResponse, sendErrorResponse } from "../utils/responseHelper.js";

interface HandleResultOptions {
  successStatus?: number;
  notFoundMessage?: string;
  failureMessage?: string;
}

declare global {
  namespace Express {
    interface Response {
      handleResult<T>(result: Result<T>, options?: HandleResultOptions): void;
    }
  }
}

/**
 * Middleware that adds a handleResult method to the Express Response object.
 * This helper simplifies handling Result objects from services.
 * Updated to use standard response envelopes.
 */
export function handleResultMiddleware(req: Request, res: Response, next: NextFunction) {
  res.handleResult = function<T>(result: Result<T>, options: HandleResultOptions = {}) {
    const { 
      successStatus = 200, 
      notFoundMessage = "Resource not found",
      failureMessage = "Operation failed"
    } = options;

    if (result.ok) {
      res.status(successStatus);
      return sendSuccessResponse(res, result.value);
    }

    const error = result.error;
    const message = error?.message || failureMessage;

    // Determine status code based on common error patterns
    let status = 500;
    let code = "INTERNAL_SERVER_ERROR";

    if (message.toLowerCase().includes("not found")) {
      status = 404;
      code = "NOT_FOUND";
    } else if (message.toLowerCase().includes("invalid") || message.toLowerCase().includes("bad request")) {
      status = 400;
      code = "BAD_REQUEST";
    } else if (message.toLowerCase().includes("unauthorized")) {
      status = 401;
      code = "UNAUTHORIZED";
    } else if (message.toLowerCase().includes("forbidden")) {
      status = 403;
      code = "FORBIDDEN";
    }

    // Special case for not found message override
    const finalMessage = status === 404 ? notFoundMessage : message;

    return sendErrorResponse({
      res,
      error,
      statusCode: status,
      message: finalMessage,
      code
    });
  };

  next();
}
