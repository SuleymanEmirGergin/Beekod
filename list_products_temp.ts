import { query } from "./src/db.js";

async function listProducts() {
    try {
        const products = await query("SELECT name, barcode, imageUrl FROM products LIMIT 5");
        console.log("PRODUCTS_START");
        console.log(JSON.stringify(products));
        console.log("PRODUCTS_END");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listProducts();
