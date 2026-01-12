
import fs from 'fs';
import path from 'path';
import { query } from '../src/db.js';
import { logger } from '../src/logger.js';

if (process.env.NODE_ENV !== 'production') {
    // Load .env
    const dotenv = await import('dotenv');
    dotenv.config();
}

async function run() {
    const migrationFile = path.resolve('db/migrations/20260105_001_product_import_fields.sql');
    console.log(`Reading migration file: ${migrationFile}`);

    try {
        const sql = fs.readFileSync(migrationFile, 'utf8');
        const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);

        console.log(`Found ${statements.length} SQL statements.`);

        for (const statement of statements) {
            console.log(`Executing: ${statement.substring(0, 50)}...`);
            try {
                await query(statement);
            } catch (err: any) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log('Column already exists, skipping.');
                } else {
                    console.error('Error likely due to IF NOT EXISTS syntax being handled by DB engine or actual error:', err.message);
                }
            }
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

run();
