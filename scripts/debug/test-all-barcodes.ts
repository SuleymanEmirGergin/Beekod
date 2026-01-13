import "../../env.js";
import { scrapeProductDetails } from "../../src/services/webScraperService.js";

async function testAllMarketplaces() {
    console.log("=== Full Barcode Extraction Test ===\n");
    
    const testCases = [
        { site: "Trendyol", url: "https://www.trendyol.com/apple/iphone-15-128-gb-p-761103009" },
        { site: "Hepsiburada", url: "https://www.hepsiburada.com/iphone-15-128-gb-mavi-p-HBCV00004X9ZCK" },
        { site: "N11", url: "https://www.n11.com/urun/apple-iphone-15-128-gb-mavi-4832970" },
        { site: "Ciceksepeti", url: "https://www.ciceksepeti.com/apple-iphone-15-128-gb" },
        { site: "Pazarama", url: "https://www.pazarama.com/telefon-tablet/apple-iphone-15-128gb-siyah" },
        { site: "PttAVM", url: "https://www.pttavm.com/apple-iphone-15-128-gb-siyah" }
    ];

    const results: { site: string; barcode: string | undefined; duration: number }[] = [];

    for (const test of testCases) {
        console.log(`\n📱 Testing ${test.site}...`);
        console.log(`   URL: ${test.url.substring(0, 60)}...`);
        
        const startTime = Date.now();
        try {
            const details = await scrapeProductDetails(test.url, test.site, { timeout: 20000 });
            const duration = (Date.now() - startTime) / 1000;
            
            results.push({ site: test.site, barcode: details.barcode, duration });
            
            if (details.barcode) {
                console.log(`   ✅ Barcode: ${details.barcode} (${duration.toFixed(1)}s)`);
            } else {
                console.log(`   ❌ No barcode found (${duration.toFixed(1)}s)`);
            }
            if (details.brand) console.log(`   Brand: ${details.brand}`);
        } catch (error) {
            const duration = (Date.now() - startTime) / 1000;
            results.push({ site: test.site, barcode: undefined, duration });
            console.log(`   ⚠️ Error: ${error} (${duration.toFixed(1)}s)`);
        }
    }

    // Summary Table
    console.log("\n\n===== SUMMARY =====");
    console.log("Site          | Barcode        | Time");
    console.log("-".repeat(45));
    for (const r of results) {
        const site = r.site.padEnd(13);
        const barcode = (r.barcode || "-").padEnd(14);
        const time = `${r.duration.toFixed(1)}s`;
        console.log(`${site} | ${barcode} | ${time}`);
    }
    
    const success = results.filter(r => r.barcode).length;
    console.log("-".repeat(45));
    console.log(`Success Rate: ${success}/${results.length} (${Math.round(success/results.length*100)}%)`);
}

testAllMarketplaces().then(() => process.exit(0)).catch(console.error);
