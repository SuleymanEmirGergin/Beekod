/**
 * Database Module
 * 
 * Exports all database-related functionality including
 * MySQL pool, query helpers, and Redis client.
 * 
 * @module core/database
 */

export { pool, query, getConnection, transaction } from "./pool.js";
export type { QueryResult } from "./pool.js";

export { getRedisClient, getRedisPrefix, getRedisConfig, closeRedis } from "./redis.js";
export type { RedisClient } from "./redis.js";
