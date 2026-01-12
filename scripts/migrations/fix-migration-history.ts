import "../env.js";
import { query } from "../src/db.js";

async function main() {
    try {
        console.log("Recording existing migrations...");
        const migrations = [
            '0004_add_product_details.sql',
            '001_marketplace_sales.sql',
            '001_wholesalers.sql',
            '002_job_dead_letters.sql',
            '002_privacy.sql',
            '003_messaging.sql',
            '003_product_images_hash.sql',
            '004_image_inspects.sql',
            '005_expanded_product_schema.sql'
        ];

        for (const name of migrations) {
            await query("INSERT IGNORE INTO schema_migrations (name) VALUES (?)", [name]);
        }
        console.log("Migration history updated.");
    } catch (error) {
        console.error("Failed to fix migration history:", error);
    }
}

main();
