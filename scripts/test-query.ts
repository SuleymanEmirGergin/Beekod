import "../env.js";
import { query } from "../src/db.js";

async function testQuery() {
    try {
        const sql = "SELECT id, barcode, name, category, description, price, stock, currency, brand, images FROM products LIMIT 5";
        const rows = await query<any[]>(sql);
        console.log("SUCCESS! Rows fetched:", rows.length);
    } catch (err) {
        console.error("QUERY FAILED:", err);
    }
    process.exit(0);
}

testQuery();
