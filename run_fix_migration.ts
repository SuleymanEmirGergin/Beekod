
import { query } from "./src/db.js";

async function addColumnSafe(colName: string, colDef: string) {
    try {
        await query(`ALTER TABLE products ADD COLUMN ${colName} ${colDef}`);
        console.log(`Added column ${colName}`);
    } catch (e: any) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log(`Column ${colName} already exists.`);
        } else {
            console.error(`Failed to add ${colName}:`, e.message);
        }
    }
}

async function runMigration() {
    await addColumnSafe('description', 'TEXT');
    await addColumnSafe('category', 'VARCHAR(255)');
    await addColumnSafe('brand', 'VARCHAR(255)');
    await addColumnSafe('currency', "VARCHAR(10) DEFAULT 'TRY'");
    await addColumnSafe('images', 'JSON');
    await addColumnSafe('attributes', 'JSON');
    await addColumnSafe('sourceUrl', 'TEXT');
    await addColumnSafe('sourceSite', 'VARCHAR(255)');
    await addColumnSafe('imageUrl', 'TEXT');

    console.log("Migration completed.");
    process.exit(0);
}

runMigration();
