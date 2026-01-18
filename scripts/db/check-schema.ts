import mysql from 'mysql2/promise';
import { logger } from '../../src/logger.js';

async function checkSchema() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'beekod',
  };

  console.log(`🔍 Verifying Schema Integrity in ${config.database}...`);

  let connection;
  try {
    connection = await mysql.createConnection(config);

    // 1. Verify Products Table & Unique Constraint
    const [indexes] = await connection.query(`
        SHOW INDEX FROM products WHERE Key_name = 'PRIMARY' OR Column_name = 'barcode'
    `);

    const hasBarcodeIndex = (indexes as any[]).some(idx => idx.Column_name === 'barcode' && idx.Non_unique === 0);
    const hasPrimary = (indexes as any[]).some(idx => idx.Key_name === 'PRIMARY');

    if (!hasPrimary) console.error("❌ Missing PRIMARY KEY on products table.");
    if (!hasBarcodeIndex) console.error("❌ Missing UNIQUE INDEX on products(barcode). Atomic upserts will FAIL.");

    if (!hasPrimary || !hasBarcodeIndex) process.exit(1);

    console.log("✅ Products table has required keys (PK + Unique Barcode).");

    // 2. Verify Jobs Table (if sql backed, currently redis, but check audit logs)
    const [auditCols] = await connection.query(`
        SHOW COLUMNS FROM audit_logs LIKE 'details'
    `);
    if ((auditCols as any[]).length === 0) {
        console.error("❌ Missing 'details' column in audit_logs.");
        process.exit(1);
    }
    console.log("✅ Audit logs table schema valid.");

    process.exit(0);

  } catch (error: any) {
    console.error("❌ Schema Check Failed:", error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

checkSchema();
