
import { query } from '../src/db.js';

async function verify() {
    console.log('Verifying Schema...');

    try {
        // 1. Check columns in products
        const columns = await query<any[]>('SHOW COLUMNS FROM products');
        const hasPrepDays = columns.some(c => c.Field === 'preparation_days');
        const hasTrans = columns.some(c => c.Field === 'translations');

        console.log(`Column 'preparation_days': ${hasPrepDays ? '✅ EXISTS' : '❌ MISSING'}`);
        console.log(`Column 'translations': ${hasTrans ? '✅ EXISTS' : '❌ MISSING'}`);

        if (!hasPrepDays || !hasTrans) throw new Error('Missing columns in products table');

        // 2. Check product_prices table
        const tables = await query<any[]>('SHOW TABLES LIKE "product_prices"');
        const hasTable = tables.length > 0;
        console.log(`Table 'product_prices': ${hasTable ? '✅ EXISTS' : '❌ MISSING'}`);

        if (!hasTable) throw new Error('product_prices table missing');

        // 3. functional Test
        console.log('Running functional test...');
        // Create a dummy product
        const barcode = `TEST-GAP-${Date.now()}`;
        await query(`INSERT INTO products (barcode, name, price, stock, currency) VALUES (?, ?, ?, ?, ?)`,
            [barcode, 'Test Product', 100, 10, 'TRY']);

        console.log(`Created test product: ${barcode}`);

        // Update with new fields
        await query(`UPDATE products SET preparation_days = 5 WHERE barcode = ?`, [barcode]);

        // Insert price
        await query(`INSERT INTO product_prices (barcode, price, price_type) VALUES (?, ?, ?)`,
            [barcode, 90, 'SALE']);
        console.log('Inserted product_price linked to product.');

        // Clean up
        await query(`DELETE FROM products WHERE barcode = ?`, [barcode]); // Cascade should delete price
        console.log('Cleaned up test data.');

        console.log('✅ ALL VERIFICATIONS PASSED');
        process.exit(0);
    } catch (err) {
        console.error('❌ VERIFICATION FAILED:', err);
        process.exit(1);
    }
}

verify();
