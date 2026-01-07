import { query } from "../src/db";
import { logger } from "../src/logger";

async function migrate() {
    try {
        logger.info("Migrating: Adding variants column to products table...");

        // Check if column exists first (optional, but good for idempotency)
        // Or just run it and catch error if it exists, or use IF NOT EXISTS if supported (MySQL 8.0+ for ADD COLUMN IF NOT EXISTS is inconsistent across versions, safer to ignore error)

        try {
            await query(`
            ALTER TABLE products 
            ADD COLUMN variants JSON DEFAULT NULL
        `);
            logger.info("✅ Successfully added 'variants' column.");
        } catch (e: any) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                logger.info("ℹ️ Column 'variants' already exists. Skipping.");
            } else {
                throw e;
            }
        }

        process.exit(0);
    } catch (error) {
        logger.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

migrate();
