import type { NextFunction, Request, Response } from "express";
import crypto from "crypto";
import { AsyncLocalStorage } from "async_hooks";
import { logger } from "../logger.js";
import { recordRequest } from "../metrics.js";

type JsonBody = Record<string, unknown> | unknown[];

type RequestContextStore = {
  requestId: string;
};

const requestStore = new AsyncLocalStorage<RequestContextStore>();

export function getRequestId() {
  return requestStore.getStore()?.requestId;
}

export function requestContext(req: Request, res: Response, next: NextFunction) {
  const requestId = crypto.randomUUID();
  res.locals.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  const start = Date.now();
  const originalJson = res.json.bind(res);
  res.json = ((body: JsonBody) => {
    if (body && typeof body === "object" && !Array.isArray(body)) {
      const payload = body as Record<string, unknown>;
      if ("error" in payload) {
        const errorValue = payload.error;
        if (typeof errorValue === "string") {
          const message = typeof payload.message === "string" ? payload.message : undefined;
          payload.error = message ? { code: errorValue, message } : { code: errorValue };
        } else if (errorValue && typeof errorValue === "object") {
          if (!("code" in (errorValue as object))) {
            payload.error = { code: "request_failed" };
          }
        } else {
          payload.error = { code: "request_failed" };
        }
        if (!payload.requestId) {
          payload.requestId = requestId;
        }
      }
    }
    return originalJson(body);
  }) as Response["json"];

  res.on("finish", () => {
    const duration = Date.now() - start;
    recordRequest({
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: duration,
    });
    logger.info("request.completed", {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: duration,
    });
  });

  return requestStore.run({ requestId }, () => next());
}
