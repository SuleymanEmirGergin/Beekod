import mysql from "mysql2/promise";
import { config } from "./config.js";
import { logger } from "./logger.js";

const { db } = config;

export const pool = mysql.createPool({
  host: db.host,
  port: db.port,
  user: db.user,
  password: db.password,
  database: db.database,
  connectionLimit: db.pool.connectionLimit,
  waitForConnections: db.pool.waitForConnections,
  queueLimit: db.pool.queueLimit,
  connectTimeout: db.pool.connectTimeout,
  enableKeepAlive: db.pool.enableKeepAlive,
  keepAliveInitialDelay: db.pool.keepAliveInitialDelay,
  multipleStatements: true, // Required for migrations
});

logger.info("db.connect", {
  host: db.host,
  port: db.port,
  user: db.user,
  name: db.database,
});

export type QueryResult = mysql.RowDataPacket[] | mysql.ResultSetHeader;

// Allow running queries on a specific connection (for transactions)
export async function query<T>(sql: string, params?: unknown[], connection?: mysql.PoolConnection): Promise<T> {
  const start = Date.now();

  // Set a hard timeout for all queries (default 10s)
  const timeoutMs = 10000;
  const runner = connection || pool;

  try {
    const [rows] = await runner.query({
      sql,
      timeout: timeoutMs,
      values: params
    });

    const duration = Date.now() - start;
    if (duration > 2000) {
      logger.warn("db.slow_query", { duration, sql: sql.substring(0, 200) });
    }

    return rows as T;
  } catch (error: any) {
    if (error.code === 'PROTOCOL_SEQUENCE_TIMEOUT') {
      logger.error("db.query_timeout", { sql: sql.substring(0, 200), timeout: timeoutMs });
    }
    throw error;
  }
}

/**
 * Execute a function within a transaction.
 * Automatically handles BEGIN, COMMIT, and ROLLBACK.
 */
export async function withTransaction<T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
