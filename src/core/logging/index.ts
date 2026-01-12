/**
 * Application Logger
 * 
 * Provides structured logging with Winston.
 * Logs to console in development, and to files in production.
 * 
 * @module core/logging
 */

import winston from "winston";
import path from "path";

const LOG_DIR = "logs";
const LOG_LEVEL = process.env.LOG_LEVEL || "info";

/**
 * Default log format with timestamp and JSON structure
 */
const defaultFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.json()
);

/**
 * Console format for development
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.simple()
);

/**
 * Main application logger
 */
export const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: defaultFormat,
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(LOG_DIR, "error.log"),
      level: "error",
    }),
    // All logs
    new winston.transports.File({
      filename: path.join(LOG_DIR, "combined.log"),
    }),
  ],
});

/**
 * Specialized logger for chat analytics
 */
export const chatLogger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(LOG_DIR, "chat_analytics.log"),
    }),
  ],
});

/**
 * Audit logger for security events
 */
export const auditLogger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(LOG_DIR, "audit.log"),
    }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

/**
 * Create a child logger with default metadata
 */
export function createLogger(defaultMeta: Record<string, unknown>) {
  return logger.child(defaultMeta);
}

/**
 * Log levels
 */
export type LogLevel = "error" | "warn" | "info" | "http" | "verbose" | "debug" | "silly";
