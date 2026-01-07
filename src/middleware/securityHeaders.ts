import type { RequestHandler } from "express";
import { config } from "../config.js";

const DEFAULT_CORS_METHODS = ["GET", "POST", "PUT", "DELETE", "OPTIONS"];
const DEFAULT_CORS_HEADERS = ["Content-Type", "X-Admin-Key"];

function isRequestSecure(req: { secure?: boolean; headers: Record<string, unknown> }) {
  if (req.secure) {
    return true;
  }
  const forwarded = req.headers["x-forwarded-proto"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0]?.trim() === "https";
  }
  return false;
}

function isOriginAllowed(origin: string, allowList: string[]) {
  if (allowList.includes("*")) {
    return true;
  }
  return allowList.some((item) => item.toLowerCase() === origin.toLowerCase());
}

export const securityHeaders: RequestHandler = (req, res, next) => {
  res.setHeader("x-content-type-options", "nosniff");
  res.setHeader("x-frame-options", "DENY");
  res.setHeader("referrer-policy", "no-referrer");
  res.setHeader("permissions-policy", "camera=(), microphone=(), geolocation=(), payment=()");
  res.setHeader("x-dns-prefetch-control", "off");

  const cors = config.security.cors;
  const origin = typeof req.headers.origin === "string" ? req.headers.origin : "";
  const allowCors = origin && cors.origins.length && isOriginAllowed(origin, cors.origins);
  const allowAll = cors.origins.includes("*");

  if (allowCors) {
    res.setHeader("Access-Control-Allow-Origin", allowAll ? "*" : origin);
    res.setHeader("Vary", "Origin");
    if (cors.allowCredentials && !allowAll) {
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
  }

  if (config.security.hsts.enabled && isRequestSecure(req)) {
    res.setHeader("Strict-Transport-Security", `max-age=${config.security.hsts.maxAge}`);
  }

  if (req.method === "OPTIONS") {
    if (allowCors) {
      const methods = cors.methods.length ? cors.methods : DEFAULT_CORS_METHODS;
      const headers = cors.headers.length ? cors.headers : DEFAULT_CORS_HEADERS;
      res.setHeader("Access-Control-Allow-Methods", methods.join(", "));
      res.setHeader("Access-Control-Allow-Headers", headers.join(", "));
    }
    res.status(204).end();
    return;
  }

  next();
};
