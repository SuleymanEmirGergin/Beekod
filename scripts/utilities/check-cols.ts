import "../env.js";
import { query } from "../src/db.js";

async function checkCols() {
    try {
        const rows = await query<any[]>("SHOW COLUMNS FROM products");
        console.log("COLUMNS IN PRODUCTS:", rows.map(r => r.Field).join(", "));
    } catch (err) {
        console.error("FAILED TO SHOW COLUMNS:", err);
    }
    process.exit(0);
}

checkCols();
