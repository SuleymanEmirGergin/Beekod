/**
 * Database Configuration
 * @module core/config/database
 */

import { parseNumber, parseBoolean, requireEnv } from "./env.js";

const env = process.env;

// Validate required DB environment variables
requireEnv("DB_HOST");
requireEnv("DB_USER");
requireEnv("DB_NAME");

export const databaseConfig = {
  host: env.DB_HOST ?? "localhost",
  port: parseNumber("DB_PORT", 3306, { min: 1, max: 65535, integer: true }),
  user: env.DB_USER ?? "root",
  password: env.DB_PASSWORD ?? "",
  database: env.DB_NAME ?? "beekod",
  pool: {
    connectionLimit: parseNumber("DB_POOL_SIZE", 10, { min: 1, integer: true }),
    waitForConnections: true,
    queueLimit: parseNumber("DB_QUEUE_LIMIT", 0, { min: 0, integer: true }),
    connectTimeout: parseNumber("DB_CONNECT_TIMEOUT_MS", 10000, { min: 1000, integer: true }),
    enableKeepAlive: parseBoolean("DB_ENABLE_KEEP_ALIVE", true),
    keepAliveInitialDelay: parseNumber("DB_KEEP_ALIVE_DELAY_MS", 0, { min: 0, integer: true }),
  },
};

export type DatabaseConfig = typeof databaseConfig;
