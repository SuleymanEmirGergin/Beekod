
import { query } from "./src/db.js";

async function fixAll() {
    const cols = [
        "category VARCHAR(255)",
        "brand VARCHAR(255)",
        "currency VARCHAR(10) DEFAULT 'TRY'",
        "images JSON",
        "attributes JSON",
        "sourceUrl TEXT",
        "sourceSite VARCHAR(255)",
        "imageUrl TEXT",
        "product_type VARCHAR(50) DEFAULT 'standard'",
        "preparation_days INT DEFAULT 3",
        "translations JSON",
        "snapshotPrice DECIMAL(10,2)",
        "snapshotCurrency VARCHAR(10)",
        "snapshotAt DATETIME",
        "cost_price DECIMAL(10,2) DEFAULT 0",
        "alert_threshold INT DEFAULT 10",
        "product_code VARCHAR(255)",
        "vat_rate INT DEFAULT 18",
        "unit VARCHAR(20) DEFAULT 'Adet'",
        "cargo_company VARCHAR(255)",
        "cargo_desi DECIMAL(10,2)",
        "width DECIMAL(10,2)",
        "height DECIMAL(10,2)",
        "length DECIMAL(10,2)",
        "weight DECIMAL(10,2)",
        "max_order_limit INT",
        "auto_stock_update BOOLEAN DEFAULT 0",
        "parent_barcode VARCHAR(255)",
        "variants JSON"
    ];

    for (const col of cols) {
        const name = col.split(' ')[0];
        try {
            await query(`ALTER TABLE products ADD COLUMN ${col}`);
            console.log(`Added ${name}`);
        } catch (e: any) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log(`${name} exists`);
            } else {
                console.log(`Failed ${name}: ${e.message}`);
            }
        }
    }
    process.exit(0);
}

fixAll();
