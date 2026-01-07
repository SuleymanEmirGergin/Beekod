import { query } from "./src/db.js";
import { logger } from "./src/logger.js";

async function check() {
    try {
        const rows = await query<any[]>("SELECT COUNT(*) as count FROM orders;");
        console.log("Order Count:", rows[0].count);
    } catch (err) {
        console.error("Check failed:", err);
    } finally {
        process.exit(0);
    }
}

check();
