
import { query } from "./src/db.js";

async function fix() {
    try {
        await query("ALTER TABLE products ADD COLUMN description TEXT");
        console.log("Successfully added description column");
    } catch (e: any) {
        console.log("Error adding description:", e.message, e.code);
    }

    // Check if it exists now
    try {
        const rows = await query("SHOW COLUMNS FROM products LIKE 'description'");
        console.log("Column check:", rows);
    } catch (e) {
        console.error("Column check failed", e);
    }
    process.exit(0);
}

fix();
