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

export async function query<T>(sql: string, params?: unknown[]): Promise<T> {
  const [rows] = await pool.query(sql, params);
  return rows as T;
}
