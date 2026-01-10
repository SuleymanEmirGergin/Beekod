import "./env.js";
import { query } from "./src/db.js";
import bcrypt from "bcrypt";

async function main() {
    try {
        const users = await query("SELECT id, name, email, role, status FROM team_members");
        console.log("Current users in DB:", JSON.stringify(users, null, 2));

        if (users.length === 0) {
            console.log("No users found. Seeding admin user...");
            const hash = await bcrypt.hash("password123", 10);
            const result = await query(
                "INSERT INTO team_members (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)",
                ["Admin User", "admin@beekod.com", hash, "Admin", "Active"]
            );
            console.log("Admin user created with ID:", result.insertId);
            console.log("Credentials: admin@beekod.com / password123");
        }
    } catch (error) {
        console.error("DB check failed:", error);
    } finally {
        process.exit();
    }
}

main();
