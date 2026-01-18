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

const format = winston.format.combine(
  injectRequestId(),
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
