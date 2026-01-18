import * as winston from "winston";
import * as path from "path";
import { getRequestId } from "./lib/context.js";

const logDir = "logs";

const level = process.env.LOG_LEVEL || "info";

// Custom format to inject requestId
const injectRequestId = winston.format((info) => {
  const requestId = getRequestId();
  if (requestId) {
    info.requestId = requestId;
  }
  return info;
});

// Secrets redaction
const SENSITIVE_KEYS = [
  "password", "token", "secret", "key", "authorization", "api_key", "access_token", "refresh_token", "client_secret"
];

const redactSecrets = winston.format((info) => {
  const redact = (obj: any): any => {
    if (!obj || typeof obj !== "object") return obj;

    // Clone to avoid mutating original reference if needed,
    // but winston info usually safe to mutate or already copied.
    // For performance, we mutate the info object fields directly where possible
    // but deep cloning might be expensive.
    // Winston "json" format stringifies, so we need to ensure the object passed to it is redacted.

    for (const key in obj) {
      if (SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k))) {
        obj[key] = "[REDACTED]";
      } else if (typeof obj[key] === "object") {
        obj[key] = redact(obj[key]);
      }
    }
    return obj;
  };

  return redact(info);
});

const format = winston.format.combine(
  injectRequestId(),
  redactSecrets(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.json(),
);

export const logger = winston.createLogger({
  level,
  format,
  transports: [
    new winston.transports.File({ filename: path.join(logDir, "error.log"), level: "error" }),
    new winston.transports.File({ filename: path.join(logDir, "combined.log") }),
  ],
});

export const chatLogger = winston.createLogger({
  level: "info",
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.File({ filename: path.join(logDir, "chat_analytics.log") })],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  );
}
