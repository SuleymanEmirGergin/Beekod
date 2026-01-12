
import { pool } from '../src/db.js';
import { config } from '../src/config.js';

// Load env if needed
if (!process.env.DB_DATABASE) {
    const dotenv = await import('dotenv');
    dotenv.config();
}

const DB_NAME = config.db.database;

async function run() {
    if (!DB_NAME) {
        console.error('❌ Database name not found in config.');
        process.exit(1);
    }

    console.log(`Starting utf8mb4 conversion with FK Drop/Re-add for: ${DB_NAME}`);

    let connection;
    try {
        connection = await pool.getConnection();

        // 1. ALTER DATABASE
        console.log('Step 1: Converting Database Defaults...');
        await connection.query(`ALTER DATABASE \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_turkish_ci`);

        // 2. DROP FOREIGN KEY
        console.log('Step 2: Dropping foreign key constraint fk_product_images_barcode...');
        try {
            await connection.query(`ALTER TABLE product_images DROP FOREIGN KEY fk_product_images_barcode`);
        } catch (e: any) {
            console.log('Warning: Could not drop FK (might not exist):', e.message);
        }

        // 3. CONVERT TABLES
        console.log('Step 3: Converting product_images table...');
        await connection.query(`ALTER TABLE product_images CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_turkish_ci`);

        console.log('Step 4: Converting products table...');
        await connection.query(`ALTER TABLE products CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_turkish_ci`);

        // 4. RE-ADD FOREIGN KEY
        // Assuming cascade delete is desired behavior for product images
        console.log('Step 5: Re-adding foreign key constraint...');
        await connection.query(`
            ALTER TABLE product_images 
            ADD CONSTRAINT fk_product_images_barcode 
            FOREIGN KEY (barcode) REFERENCES products(barcode) 
            ON DELETE CASCADE ON UPDATE CASCADE
        `);

        console.log('✅ Conversion completed successfully! Tables are utf8mb4 and FK is restored.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Conversion failed:', error);
        process.exit(1);
    } finally {
        if (connection) connection.release();
    }
}

run();
