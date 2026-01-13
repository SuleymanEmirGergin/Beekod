import "../../env.js";
import { searchBarcodeByName, lookupBarcode, extractBarcodeFromImage, findBarcode } from "../../src/services/barcodeLookupService.js";

async function testBarcodeLookup() {
    console.log("=== Barcode Lookup Service Test ===\n");
    
    // Test 1: Search by product name
    console.log("--- Test 1: Search by Product Name ---");
    const searchTests = [
        "iPhone 15 128GB",
        "Samsung Galaxy S24",
        "Nintendo Switch",
        "Sony WH-1000XM5"
    ];
    
    for (const query of searchTests) {
        console.log(`\nSearching: "${query}"`);
        const result = await searchBarcodeByName(query);
        if (result) {
            console.log(`  ✅ Barcode: ${result.barcode}`);
            console.log(`  Title: ${result.product?.title?.substring(0, 50)}`);
            console.log(`  Brand: ${result.product?.brand}`);
        } else {
            console.log(`  ❌ Not found`);
        }
    }
    
    // Test 2: Lookup by known barcode
    console.log("\n\n--- Test 2: Lookup by Barcode ---");
    const barcodes = [
        "0195949036583",  // iPhone 15
        "8806095070438",  // Samsung
    ];
    
    for (const barcode of barcodes) {
        console.log(`\nLooking up: ${barcode}`);
        const product = await lookupBarcode(barcode);
        if (product) {
            console.log(`  ✅ Found: ${product.title?.substring(0, 60)}`);
            console.log(`  Brand: ${product.brand}`);
        } else {
            console.log(`  ❌ Not found`);
        }
    }
    
    // Test 3: Visual barcode detection (if image available)
    console.log("\n\n--- Test 3: Visual Barcode Detection ---");
    // Test with a sample barcode image
    const testImageUrl = "https://upload.wikimedia.org/wikipedia/commons/e/e9/UPC-A-036000291452.svg";
    console.log(`Testing image: ${testImageUrl}`);
    const visualResult = await extractBarcodeFromImage(testImageUrl);
    if (visualResult) {
        console.log(`  ✅ Barcode from image: ${visualResult}`);
    } else {
        console.log(`  ❌ Could not extract barcode from image`);
    }
    
    // Test 4: Unified findBarcode
    console.log("\n\n--- Test 4: Unified findBarcode ---");
    const unifiedResult = await findBarcode("Apple AirPods Pro");
    if (unifiedResult) {
        console.log(`  ✅ Source: ${unifiedResult.source}`);
        console.log(`  Barcode: ${unifiedResult.barcode}`);
        console.log(`  Product: ${unifiedResult.product?.title}`);
    } else {
        console.log(`  ❌ No barcode found`);
    }
    
    console.log("\n\n=== Test Complete ===");
}

testBarcodeLookup().catch(console.error);
