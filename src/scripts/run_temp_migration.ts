import fs from 'fs';
import path from 'path';
import { pool } from '../db.js';
import { logger } from '../logger.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSingleMigration() {
    const filePath = path.resolve(__dirname, '../../db/migrations/20260108_003_add_translations.sql');

    logger.info(`Running migration: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf-8');

    try {
        await pool.query(sql);
        logger.info(`Successfully executed: ${path.basename(filePath)}`);
    } catch (error) {
        logger.error(`Error executing migration`, { error });
    }

    process.exit(0);
}

runSingleMigration();
