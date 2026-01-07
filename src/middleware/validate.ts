import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

/**
 * Higher-order middleware to validate incoming request data using Zod.
 *
 * @param schema - The Zod schema to validate against.
 * @param source - The request object property to validate ('body', 'query', or 'params'). Defaults to 'body'.
 */
export const validate = (schema: ZodSchema<any>, source: "body" | "query" | "params" = "body") => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const dataToValidate = req[source];
      const validatedData = await schema.parseAsync(dataToValidate);

      // Replace request data with validated (and potentially transformed) data
      req[source] = validatedData;

      next();
    } catch (error) {
      next(error); // Caught by global errorHandler
    }
  };
};
