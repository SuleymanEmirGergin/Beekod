
import { query } from "./src/db.js";

async function checkSchema() {
    try {
        const rows = await query("SHOW COLUMNS FROM products");
        console.log("Products Table Columns:", rows);
        process.exit(0);
    } catch (error) {
        console.error("Error checking schema:", error);
        process.exit(1);
    }
}

checkSchema();
