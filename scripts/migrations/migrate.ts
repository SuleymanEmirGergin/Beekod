import "../env.js";
import fs from "fs/promises";
import path from "path";
import mysql from "mysql2/promise";

const env = process.env;
const dbName = env.DB_NAME ?? "beekod";
const dbHost = env.DB_HOST ?? "localhost";
const dbUser = env.DB_USER ?? "root";
const dbPassword = env.DB_PASSWORD ?? "";
const dbPortRaw = Number(env.DB_PORT ?? 3306);
const dbPort = Number.isFinite(dbPortRaw) ? dbPortRaw : 3306;

const migrationsDir = path.resolve("db", "migrations");

async function ensureDatabase() {
  try {
    return await mysql.createConnection({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      database: dbName,
      multipleStatements: true,
      charset: "utf8mb4"
    });
  } catch (error) {
    const err = error as { code?: string; message?: string };
    if (err.code !== "ER_BAD_DB_ERROR") {
      throw error;
    }
    const admin = await mysql.createConnection({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      multipleStatements: true,
      charset: "utf8mb4"
    });
    await admin.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_bin`
    );
    await admin.end();
    return mysql.createConnection({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      database: dbName,
      multipleStatements: true,
      charset: "utf8mb4"
    });
  }
}

async function ensureMigrationsTable(conn: mysql.Connection) {
  await conn.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  );
}

async function loadMigrationFiles() {
  const entries = await fs.readdir(migrationsDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".sql"))
    .map((entry) => entry.name)
    .sort();
}

async function getAppliedMigrations(conn: mysql.Connection) {
  const [rows] = await conn.query<{ name: string }[]>("SELECT name FROM schema_migrations");
  return new Set(rows.map((row) => row.name));
}

async function applyMigration(conn: mysql.Connection, name: string) {
  const filePath = path.join(migrationsDir, name);
  const sql = await fs.readFile(filePath, "utf8");
  if (!sql.trim()) {
    return false;
  }
  await conn.query(sql);
  await conn.query("INSERT INTO schema_migrations (name) VALUES (?)", [name]);
  return true;
}

async function main() {
  const conn = await ensureDatabase();
  try {
    await ensureMigrationsTable(conn);
    const files = await loadMigrationFiles();
    if (!files.length) {
      console.log("[migrate] No migration files found.");
      return;
    }
    const applied = await getAppliedMigrations(conn);
    let appliedCount = 0;

    for (const name of files) {
      if (applied.has(name)) {
        continue;
      }
      console.log(`[migrate] Applying ${name}...`);
      const changed = await applyMigration(conn, name);
      if (changed) {
        appliedCount += 1;
      }
    }

    console.log(`[migrate] Done. Applied ${appliedCount} migration(s).`);
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("[migrate] Failed:", error);
  process.exitCode = 1;
});
