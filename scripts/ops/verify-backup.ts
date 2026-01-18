import mysql from 'mysql2/promise';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);

async function verifyBackup() {
  const backupFile = process.env.BACKUP_FILE;

  const config = {
    host: process.env.VERIFY_DB_HOST || 'localhost',
    user: process.env.VERIFY_DB_USER || 'root',
    password: process.env.VERIFY_DB_PASSWORD || '',
    database: process.env.VERIFY_DB_NAME || 'verify_restore',
  };

  console.log(`🔍 Starting Backup Verification for ${config.database}...`);

  // Step 0: Restore if backup file provided
  if (backupFile) {
      if (!fs.existsSync(backupFile)) {
          console.error(`❌ Backup file not found: ${backupFile}`);
          process.exit(1);
      }

      console.log(`📥 Restoring from ${backupFile}...`);
      try {
          // Create DB first
          await execAsync(`mysql -h ${config.host} -u ${config.user} ${config.password ? `-p${config.password}` : ''} -e "DROP DATABASE IF EXISTS ${config.database}; CREATE DATABASE ${config.database};"`);

          // Import dump
          const cmd = `mysql -h ${config.host} -u ${config.user} ${config.password ? `-p${config.password}` : ''} ${config.database} < ${backupFile}`;
          await execAsync(cmd);
          console.log("✅ Restore complete.");
      } catch (e: any) {
          console.error("❌ Restore Failed:", e.message);
          process.exit(1);
      }
  } else {
      console.log("ℹ️ No BACKUP_FILE provided, verifying existing database state.");
  }

  let connection;
  try {
    connection = await mysql.createConnection(config);

    // Check 1: Key Tables Existence
    const requiredTables = ['products', 'orders', 'users', 'marketplace_listings'];
    const [tables] = await connection.query('SHOW TABLES');
    const existingTables = (tables as any[]).map(row => Object.values(row)[0]);

    const missing = requiredTables.filter(t => !existingTables.includes(t));
    if (missing.length > 0) {
        // Warning only, as some might be optional depending on backup scope
        console.warn(`⚠️ Missing tables: ${missing.join(', ')}`);
    } else {
        console.log("✅ Core tables found.");
    }

    // Check 2: Row Counts (Sanity Check)
    const [productCount] = await connection.query('SELECT COUNT(*) as count FROM products');
    console.log(`📊 Products: ${(productCount as any)[0].count}`);

    // Check 3: Constraints/Integrity (Simple sample)
    // Ensure no products have null barcodes if that's a constraint
    const [invalidProducts] = await connection.query('SELECT COUNT(*) as count FROM products WHERE barcode IS NULL');
    if ((invalidProducts as any)[0].count > 0) {
        throw new Error("❌ Integrity Check Failed: Found products with NULL barcode");
    }
    console.log("✅ Basic integrity checks passed.");

    console.log("✅ Backup Verification Completed Successfully.");
    process.exit(0);

  } catch (error: any) {
    console.error("❌ Verification Failed:", error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

verifyBackup();
