import fs from 'fs';
import path from 'path';
import { pool } from '../db.js';
import { logger } from '../logger.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
    const migrationsDir = path.resolve(__dirname, '../../db/migrations');

    // Get all sql files
    const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort(); // Run in alphabetical order

    logger.info(`Found ${files.length} migration files.`);

    // Create migrations table if not exists
    await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

    // Get executed migrations
    const [executedRows]: any = await pool.query('SELECT name FROM migrations');
    const executedNames = new Set(executedRows.map((r: any) => r.name));

    for (const file of files) {
        if (executedNames.has(file)) {
            logger.info(`Skipping already executed: ${file}`);
            continue;
        }

        logger.info(`Running migration: ${file}`);
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf-8');

        // Split by semicolon strictly might be dangerous if semicolon is in string
        // ideally use a better parser or just assume one statement per file or simple splitting
        // For now, let's treat the whole file as one potentially multi-statement query if supported,
        // or split simply. DB clients usually support multiple statements if header configured?
        // mysql2 defaults strict, but let's try reading and running.
        // If it fails, we might need to enable multipleStatements: true in connection config.
        // Let's assume files are written to be compatible or we enable it.

        // Actually, safer to run the whole file content.
        try {
            await pool.query(sql);
            await pool.query('INSERT INTO migrations (name) VALUES (?)', [file]);
            logger.info(`Successfully executed: ${file}`);
        } catch (error) {
            logger.error(`Error executing ${file}`, { error });
            process.exit(1);
        }
    }

    logger.info('All migrations completed.');
    process.exit(0);
}

runMigrations();
