import { optimize } from "../src/query/QueryOptimizer.js";
import { normalizeText, titleCaseBrandModel } from "../src/query/queryUtils.js";
import { logger } from "../src/logger.js";

async function runTests() {
    console.log("--- Query Optimizer Tests ---");

    // Test 1: Normalization
    const norm = normalizeText("iPhone 17   512 GB ADA çayı!!!");
    console.log("Test 1 (Normalization):", norm === "iphone 17 512gb ada cayi" ? "PASS" : "FAIL", `(${norm})`);

    // Test 2: Storage Parse
    const plan1 = optimize("iphone 15 pro 1 tb");
    console.log("Test 2 (Storage 1TB):", plan1.extracted.storageGB === 1024 ? "PASS" : "FAIL", `(${plan1.extracted.storageGB})`);

    const plan2 = optimize("samsung s24 256gb");
    console.log("Test 2.1 (Storage 256GB):", plan2.extracted.storageGB === 256 ? "PASS" : "FAIL", `(${plan2.extracted.storageGB})`);

    // Test 4: Color Alias
    const plan4 = optimize("iphone 17 adaçayı");
    console.log("Test 4 (Color):", plan4.extracted.color === "Ada Çayı" ? "PASS" : "FAIL");

    // Test 5: Intent
    const plan_price = optimize("en ucuz iphone 16 fiyatlari");
    console.log("Test 5 (Intent Price):", plan_price.intent === "price" ? "PASS" : "FAIL");

    const plan5 = optimize("iphone 15 pro max");
    console.log("Test 5.1 (Intent Specific):", plan5.intent === "product_lookup" ? "PASS" : "FAIL");

    // Test 6: Query Generation
    console.log("Test 6 (Primary Query):", plan4.primary === "Apple iPhone 17 Ada Çayı" ? "PASS" : "FAIL", `(${plan4.primary})`);

    // Test 7: Fallback Order
    console.log("Test 7 (Fallback Count):", plan4.fallbackOrder.length >= 3 ? "PASS" : "FAIL", `(${plan4.fallbackOrder.length})`);

    console.log("--- End of Tests ---");
}

runTests().catch(e => console.error(e));
