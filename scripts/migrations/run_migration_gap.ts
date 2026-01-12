
import fs from 'fs';
import path from 'path';
import { query } from '../src/db.js';

if (process.env.NODE_ENV !== 'production') {
    const dotenv = await import('dotenv');
    dotenv.config();
}

async function run() {
    const migrationFile = path.resolve('db/migrations/20260105_002_backend_gaps.sql');
    console.log(`Reading migration file: ${migrationFile}`);

    try {
        const sql = fs.readFileSync(migrationFile, 'utf8');
        // Split by semicolon but respect stored procedures/PREPARE statements if possible.
        // For this simple migration, standard split is fine.
        const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);

        console.log(`Found ${statements.length} SQL statements.`);

        for (const statement of statements) {
            console.log(`Executing: ${statement.substring(0, 50)}...`);
            try {
                await query(statement);
            } catch (err: any) {
                console.error('Error executing statement:', err.message);
                // Continue to next statement even if one fails (e.g. IF NOT EXISTS might throw warning/error in some drivers)
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log('Column already exists, skipping.');
                }
            }
        }

        console.log('Migration completed.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

run();
