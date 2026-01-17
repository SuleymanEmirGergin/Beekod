
import { query } from "../../src/db.js";

async function checkInventory() {
    try {
        const rows = await query("SELECT barcode, name, stock, updated_at FROM products WHERE name LIKE '%iPhone 17%'");
        console.log("Found products:", rows);
        process.exit(0);
    } catch (error) {
        console.error("Error querying db:", error);
        process.exit(1);
    }
}

checkInventory();
