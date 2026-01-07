import "../env.js";
import { getAllProducts } from "../src/services/productService.js";

async function debug() {
    try {
        console.log("Fetching products...");
        const products = await getAllProducts(5);
        console.log("Products count:", products.length);
        console.log("First product sample:", products[0] ? JSON.stringify(products[0], null, 2) : "None");
    } catch (error) {
        console.error("DEBUG FAILED:", error);
    }
    process.exit(0);
}

debug();
