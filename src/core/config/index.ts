/**
 * Core Configuration Module
 * 
 * This is the main entry point for all configuration.
 * Re-exports individual config modules and provides a unified config object.
 * 
 * @module core/config
 */

import "dotenv/config";

// Re-export individual configs for direct access
export * from "./env.js";
export * from "./database.js";
export * from "./security.js";
export * from "./server.js";
export * from "./services.js";

// Import individual configs for unified object
import { databaseConfig } from "./database.js";
import { securityConfig, adminConfig } from "./security.js";
import { serverConfig } from "./server.js";
import {
  googleConfig,
  searchConfig,
  storesConfig,
  marketplaceConfig,
  imagesConfig,
  dataConfig,
} from "./services.js";
import { configValidation } from "./env.js";

/**
 * Unified configuration object
 * Maintains backward compatibility with existing code
 */
export const config = {
  port: serverConfig.port,
  server: {
    jsonBodyLimit: serverConfig.jsonBodyLimit,
    urlEncodedBodyLimit: serverConfig.urlEncodedBodyLimit,
    jwtSecret: securityConfig.jwtSecret,
  },
  db: databaseConfig,
  data: dataConfig,
  images: imagesConfig,
  google: googleConfig,
  search: searchConfig,
  stores: storesConfig,
  marketplace: marketplaceConfig,
  security: {
    cors: securityConfig.cors,
    hsts: securityConfig.hsts,
  },
  admin: adminConfig,
};

export type Config = typeof config;

/**
 * Logs configuration warnings and errors
 * Should be called after logger is initialized
 */
export function logConfigStatus(logger: { 
  info: (msg: string, meta?: Record<string, unknown>) => void;
  warn: (msg: string, meta?: Record<string, unknown>) => void;
  error: (msg: string, meta?: Record<string, unknown>) => void;
  debug: (msg: string, meta?: Record<string, unknown>) => void;
}) {
  // Log API key status
  if (config.google.cseApiKey) {
    logger.info("config.google_cse.configured", { hasKey: true, hasCx: Boolean(config.google.cseCx) });
  } else {
    logger.debug("config.google_cse.not_configured", {
      missing: config.google.cseCx ? ["GOOGLE_CSE_API_KEY"] : ["GOOGLE_CSE_API_KEY", "GOOGLE_CSE_CX"],
    });
  }

  // Log Gemini status
  const geminiApiKey = (process.env.GEMINI_API_KEY ?? "").trim();
  if (geminiApiKey) {
    logger.info("config.gemini.configured", { hasKey: true });
  } else {
    logger.debug("config.gemini.not_configured");
  }

  // Log marketplace mode
  logger.info("config.marketplace_mode", { mode: config.marketplace.mode });

  // Log rate limit store
  const rateLimitStore = process.env.RATE_LIMIT_STORE
    ? process.env.RATE_LIMIT_STORE.toLowerCase() === "redis"
      ? "redis"
      : "db"
    : process.env.REDIS_URL?.trim()
      ? "redis"
      : "db";
  logger.info("config.rate_limit_store", { store: rateLimitStore, hasRedisUrl: Boolean(process.env.REDIS_URL?.trim()) });

  // Log warnings and errors
  if (configValidation.warnings.length) {
    logger.warn("config.env_warning", { warnings: configValidation.warnings });
  }

  if (configValidation.errors.length) {
    const message = `[config] env errors:\n- ${configValidation.errors.join("\n- ")}`;
    if (configValidation.strictMode) {
      throw new Error(message);
    }
    logger.error("config.env_error", { errors: configValidation.errors, message });
  }
}
