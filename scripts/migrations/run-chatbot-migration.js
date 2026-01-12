// Run chatbot & wholesaler migration
import { readFileSync } from "fs";
import { pool } from "../src/db.js";

async function runMigration() {
    try {
        console.log("Running chatbot & wholesaler migration...");

        const sql = readFileSync("db/migrations/20260109_001_chatbot_wholesaler.sql", "utf8");

        // Split by statements (simple split by semicolon + newline)
        const statements = sql
            .split(";")
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith("--"));

        for (const statement of statements) {
            if (statement) {
                await pool.query(statement);
            }
        }

        console.log("✅ Migration completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

runMigration();
