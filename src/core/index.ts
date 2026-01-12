/**
 * Core Module
 * 
 * Central exports for core infrastructure components:
 * - Configuration
 * - Database
 * - Logging
 * - Errors
 * - Middleware
 * 
 * @module core
 */

// Configuration
export { config, logConfigStatus } from "./config/index.js";
export type { Config } from "./config/index.js";

// Database
export { pool, query, getConnection, transaction } from "./database/index.js";
export { getRedisClient, getRedisPrefix, getRedisConfig, closeRedis } from "./database/index.js";
export type { QueryResult, RedisClient } from "./database/index.js";

// Logging
export { logger, chatLogger, auditLogger, createLogger } from "./logging/index.js";
export type { LogLevel } from "./logging/index.js";

// Errors (re-export from existing location for now)
export * from "../errors/AppError.js";
