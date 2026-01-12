import "../env.js";
import { query } from "../src/db.js";

async function safeMigrate() {
    const productsColumns = [
        { name: 'price', type: 'DECIMAL(15,2) DEFAULT 0.00' },
        { name: 'cost_price', type: 'DECIMAL(15,2) DEFAULT 0.00' },
        { name: 'alert_threshold', type: 'INT DEFAULT 10' },
        { name: 'brand', type: 'VARCHAR(255)' },
        { name: 'product_code', type: 'VARCHAR(64)' },
        { name: 'vat_rate', type: 'INT DEFAULT 0' },
        { name: 'unit', type: 'VARCHAR(16) DEFAULT "Adet"' },
        { name: 'images', type: 'JSON' },
        { name: 'attributes', type: 'JSON' },
        { name: 'cargo_company', type: 'VARCHAR(64)' },
        { name: 'cargo_desi', type: 'DECIMAL(10,2)' },
        { name: 'width', type: 'INT' },
        { name: 'height', type: 'INT' },
        { name: 'length', type: 'INT' },
        { name: 'weight', type: 'INT' },
        { name: 'max_order_limit', type: 'INT' },
        { name: 'auto_stock_update', type: 'TINYINT(1) DEFAULT 0' },
        { name: 'parent_barcode', type: 'VARCHAR(64)' },
        { name: 'variants', type: 'JSON' }
    ];

    console.log("Checking products table...");
    const [columns] = await query<any>("SHOW COLUMNS FROM products"); // Wait, query returns Rows[0] as T? 
    // In src/db.ts: const [rows] = await pool.query(sql, params); return rows as T;
    const existingColumns = (await query<any[]>("SHOW COLUMNS FROM products")).map(c => c.Field);

    for (const col of productsColumns) {
        if (!existingColumns.includes(col.name)) {
            console.log(`Adding column ${col.name} to products...`);
            await query(`ALTER TABLE products ADD COLUMN ${col.name} ${col.type}`);
        }
    }

    console.log("Checking orders table...");
    const existingOrdersColumns = (await query<any[]>("SHOW COLUMNS FROM orders")).map(c => c.Field);
    if (!existingOrdersColumns.includes('total_amount_numeric')) {
        console.log("Adding total_amount_numeric to orders...");
        await query("ALTER TABLE orders ADD COLUMN total_amount_numeric DECIMAL(15,2) DEFAULT 0.00");
    }

    console.log("Checking order_items table...");
    const existingOrderItemsColumns = (await query<any[]>("SHOW COLUMNS FROM order_items")).map(c => c.Field);
    if (!existingOrderItemsColumns.includes('price_numeric')) {
        console.log("Adding price_numeric to order_items...");
        await query("ALTER TABLE order_items ADD COLUMN price_numeric DECIMAL(15,2) DEFAULT 0.00");
    }

    console.log("Migration complete!");
    process.exit(0);
}

safeMigrate().catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
});
