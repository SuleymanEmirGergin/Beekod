import { Request, Response, NextFunction, RequestHandler } from "express";
import { ZodSchema, ZodError } from "zod";

function formatIssues(error: ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join(".") || "root",
    message: issue.message,
  }));
}

export function validateBody(schema: ZodSchema<any>): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "invalid_payload", details: formatIssues(result.error) });
    }
    req.body = result.data;
    return next();
  };
}

export function validateQuery(schema: ZodSchema<any>): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({ error: "invalid_query", details: formatIssues(result.error) });
    }
    req.query = result.data as typeof req.query;
    return next();
  };
}

export function validateParams(schema: ZodSchema<any>): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({ error: "invalid_params", details: formatIssues(result.error) });
    }
    req.params = result.data as typeof req.params;
    return next();
  };
}
