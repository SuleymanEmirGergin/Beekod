import type { RequestHandler } from "express";

export const requireJsonBody: RequestHandler = (req, res, next) => {
  const isJson = req.is("application/json") || req.is("application/*+json");
  if (!isJson) {
    return next();
  }
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ error: "invalid_payload" });
  }
  return next();
};
