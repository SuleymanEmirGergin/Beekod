import "../env.js";
import { query } from "../src/db.js";

async function syncMigrations() {
    const migrationsToMark = [
        '007_intelligence_fixes.sql',
        '013_add_alert_threshold_to_products.sql',
        '014_add_numeric_columns_to_orders.sql',
        '015_add_cost_price_to_products.sql'
    ];

    for (const name of migrationsToMark) {
        try {
            await query("INSERT IGNORE INTO schema_migrations (name) VALUES (?)", [name]);
            console.log(`Synced migration: ${name}`);
        } catch (err) {
            console.error(`Failed to sync ${name}:`, err);
        }
    }

    console.log("Migration sync complete!");
    process.exit(0);
}

syncMigrations();
