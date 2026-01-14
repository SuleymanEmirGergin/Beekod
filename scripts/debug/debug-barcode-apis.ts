import "../../env.js";

async function debugApis() {
    console.log("=== API Debug Test ===\n");
    
    // 1. Test UPCitemdb Lookup directly
    console.log("--- Test 1: UPCitemdb Lookup ---");
    const barcode = "0195949036583";
    const lookupUrl = `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`;
    console.log(`URL: ${lookupUrl}`);
    
    try {
        const response = await fetch(lookupUrl);
        console.log(`Status: ${response.status}`);
        const data = await response.json();
        console.log(`Response: ${JSON.stringify(data, null, 2).substring(0, 500)}`);
    } catch (e) {
        console.log(`Error: ${e}`);
    }
    
    // 2. Test ZXing with PNG image (not SVG)
    console.log("\n--- Test 2: ZXing with PNG ---");
    const pngImage = "https://barcode.tec-it.com/barcode.ashx?data=1234567890123&code=EAN13";
    const zxingUrl = `https://zxing.org/w/decode?u=${encodeURIComponent(pngImage)}`;
    console.log(`Image: ${pngImage}`);
    console.log(`ZXing URL: ${zxingUrl}`);
    
    try {
        const response = await fetch(zxingUrl, {
            headers: { "User-Agent": "Mozilla/5.0" }
        });
        console.log(`Status: ${response.status}`);
        const html = await response.text();
        console.log(`HTML Length: ${html.length}`);
        
        // Check for result in page
        if (html.includes("Decoded")) {
            console.log("✅ ZXing responded with decoded content");
            const match = html.match(/<pre[^>]*>([^<]+)<\/pre>/);
            if (match) console.log(`Result: ${match[1]}`);
        } else if (html.includes("No barcode")) {
            console.log("⚠️ No barcode found in image");
        } else {
            console.log("⚠️ Unknown response");
        }
    } catch (e) {
        console.log(`Error: ${e}`);
    }
    
    // 3. Test direct barcode API
    console.log("\n--- Test 3: Alternative - Open Food Facts ---");
    const offUrl = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
    console.log(`URL: ${offUrl}`);
    
    try {
        const response = await fetch(offUrl);
        console.log(`Status: ${response.status}`);
        const data = await response.json();
        if (data.status === 1) {
            console.log(`✅ Found: ${data.product?.product_name}`);
        } else {
            console.log(`⚠️ Not found (status: ${data.status})`);
        }
    } catch (e) {
        console.log(`Error: ${e}`);
    }
}

debugApis().catch(console.error);
