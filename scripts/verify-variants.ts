import { upsertProduct, getProductByBarcode } from '../src/services/productService';
import { logger } from '../src/logger';

async function verifyVariants() {
    try {
        const barcode = "VAR-TEST-001";

        logger.info("1. Creating product with variants...");
        await upsertProduct({
            barcode,
            name: "Variant Test Product",
            price: 100,
            stock: 50,
            currency: "TRY",
            variants: [
                { sku: "VAR-TEST-001-RED", description: "Red - L", price: 100, stock: 25, attributes: { color: "Red", size: "L" } },
                { sku: "VAR-TEST-001-BLUE", description: "Blue - L", price: 100, stock: 25, attributes: { color: "Blue", size: "L" } }
            ]
        });

        logger.info("2. Fetching product...");
        const product = await getProductByBarcode(barcode);

        if (product && product.variants && product.variants.length === 2) {
            logger.info("✅ Verification Passed: Product saved with 2 variants.");
            console.log(JSON.stringify(product.variants, null, 2));
        } else {
            logger.error("❌ Verification Failed: Variants missing or incorrect count.");
            console.log(product);
        }

        process.exit(0);

    } catch (error) {
        logger.error("❌ Error:", error);
        process.exit(1);
    }
}

verifyVariants();
