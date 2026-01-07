import type { NextFunction, Request, Response } from "express";
import { config } from "../config.js";

export const ADMIN_HEADER = "x-admin-key";
export const ADMIN_COOKIE = "admin_key";

export function resolveAdminKey(req: Request) {
  const headerKey = req.header(ADMIN_HEADER);
  if (headerKey) {
    return headerKey.trim();
  }
  const auth = req.header("authorization") ?? "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  const cookie = req.headers.cookie ?? "";
  if (cookie) {
    const match = cookie
      .split(";")
      .map((chunk) => chunk.trim())
      .find((chunk) => chunk.startsWith(`${ADMIN_COOKIE}=`));
    if (match) {
      return decodeURIComponent(match.split("=").slice(1).join("="));
    }
  }
  return "";
}

export function requireAdminKey(req: Request, res: Response, next: NextFunction) {
  const expected = config.admin.apiKey;
  const provided = resolveAdminKey(req);

  if (req.path === '/' || req.path === '/api/products') {
    // console.log(`DEBUG: AdminKey Check [${req.method} ${req.originalUrl}] Expected='${expected}' Provided='${provided}'`);
  }

  if (!expected) {
    return next();
  }

  if (!provided || provided !== expected) {
    return res.status(401).json({ error: "admin_key_required" });
  }

  next();
}
