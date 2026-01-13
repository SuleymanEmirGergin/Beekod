import { Response, Request, NextFunction } from "express";
import { Result } from "../utils/result.js";

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
 */
export function handleResultMiddleware(req: Request, res: Response, next: NextFunction) {
  res.handleResult = function<T>(result: Result<T>, options: HandleResultOptions = {}) {
    const { 
      successStatus = 200, 
      notFoundMessage = "Resource not found",
      failureMessage = "Operation failed"
    } = options;

    if (result.ok) {
      return res.status(successStatus).json(result.value);
    }

    const error = result.error;
    const message = error?.message || failureMessage;

    // Determine status code based on common error patterns
    let status = 500;
    if (message.toLowerCase().includes("not found")) {
      status = 404;
    } else if (message.toLowerCase().includes("invalid") || message.toLowerCase().includes("bad request")) {
      status = 400;
    } else if (message.toLowerCase().includes("unauthorized")) {
      status = 401;
    } else if (message.toLowerCase().includes("forbidden")) {
      status = 403;
    }

    // Special case for not found message override
    const finalMessage = status === 404 ? notFoundMessage : message;

    return res.status(status).json({ error: finalMessage });
  };

  next();
}
