import "../env.js";
import mysql from "mysql2/promise";

const env = process.env;
const dbName = env.DB_NAME ?? "beekod";
const dbHost = env.DB_HOST ?? "localhost";
const dbUser = env.DB_USER ?? "root";
const dbPassword = env.DB_PASSWORD ?? "";
const dbPortRaw = Number(env.DB_PORT ?? 3306);
const dbPort = Number.isFinite(dbPortRaw) ? dbPortRaw : 3306;

async function main() {
    const conn = await mysql.createConnection({
        host: dbHost,
        port: dbPort,
        user: dbUser,
        password: dbPassword,
        database: dbName,
        charset: "utf8mb4"
    });

    const [rows] = await conn.query("DESCRIBE notifications");
    console.log(JSON.stringify(rows, null, 2));
    await conn.end();
}

main().catch(console.error);
