import { query } from "./src/db.js";

async function inspect() {
    try {
        const rows = await query<any[]>("DESC orders;");
        console.log("Orders Schema:", JSON.stringify(rows, null, 2));
    } catch (err) {
        console.error("Inspect failed:", err);
    } finally {
        process.exit(0);
    }
}

inspect();
