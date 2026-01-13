import "../../env.js";
import { scrapeProductDetails } from "../../src/services/webScraperService.js";

async function testExtraction() {
    const testCases = [
        {
            site: "Trendyol",
            url: "https://www.trendyol.com/apple/iphone-15-128-gb-p-761103009"
        },
        {
            site: "Hepsiburada",
            url: "https://www.hepsiburada.com/iphone-15-128-gb-mavi-p-HBCV00004X9ZCK"
        }
    ];

    console.log("=== Phase 8: Barcode Extraction Test ===\n");

    for (const test of testCases) {
        console.log(`Testing ${test.site}...`);
        console.log(`URL: ${test.url}`);
        
        const startTime = Date.now();
        const details = await scrapeProductDetails(test.url, test.site);
        const duration = (Date.now() - startTime) / 1000;

        console.log(`Duration: ${duration}s`);
        if (details.barcode) {
            console.log(`✅ Success! Barcode found: ${details.barcode}`);
        } else {
            console.warn(`❌ Failed. No barcode extracted from ${test.site}.`);
        }
        
        if (details.brand) console.log(`Brand: ${details.brand}`);
        console.log("-" .repeat(40));
    }
}

testExtraction().then(() => process.exit(0));
