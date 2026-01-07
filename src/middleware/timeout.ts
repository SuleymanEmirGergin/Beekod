import { Request, Response, NextFunction } from 'express';

/**
 * Timeout middleware to prevent requests from hanging indefinitely
 */
export function timeoutMiddleware(req: Request, res: Response, next: NextFunction) {
    // Set a 20-second timeout for all requests
    res.setTimeout(20000, () => {
        if (!res.headersSent) {
            res.status(408).json({
                success: false,
                reply: "İstek zaman aşımına uğradı. Lütfen tekrar deneyin.",
                data: null,
                error: "TIMEOUT"
            });
        }
    });
    next();
}
