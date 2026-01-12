/**
 * MySQL Database Connection Pool
 * @module core/database/pool
 */

import mysql from "mysql2/promise";
import { databaseConfig } from "../config/database.js";

const db = databaseConfig;

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

export type QueryResult = mysql.RowDataPacket[] | mysql.ResultSetHeader;

/**
 * Execute a SQL query with optional parameters
 */
export async function query<T>(sql: string, params?: unknown[]): Promise<T> {
  const [rows] = await pool.query(sql, params);
  return rows as T;
}

/**
 * Get a connection from the pool for transactions
 */
export async function getConnection() {
  return pool.getConnection();
}

/**
 * Execute a transaction with automatic rollback on error
 */
export async function transaction<T>(
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
