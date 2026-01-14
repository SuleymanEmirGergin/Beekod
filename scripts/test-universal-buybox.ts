import { scrapeProductDetails, closeBrowser } from "../src/services/webScraperService.js";
import { logger } from "../src/logger.js";

async function testUniversalBuyBox() {
    const testCases = [
        {
            name: "Trendyol iPhone 15",
            url: "https://www.trendyol.com/apple/iphone-15-128-gb-mavi-p-762254881",
            site: "Trendyol"
        },
        {
            name: "Hepsiburada Airpods",
            url: "https://www.hepsiburada.com/apple-airpods-pro-2-nesil-usb-c-sarj-kutulu-mqd83tu-a-p-HBCV00004Y9W9G",
            site: "Hepsiburada"
        },
        {
            name: "N11 iPhone 15",
            url: "https://www.n11.com/urun/apple-iphone-15-128-gb-apple-turkiye-garantili-43821353",
            site: "N11"
        }
    ];

    console.log("🚀 Starting Universal BuyBox Scraping Test...\n");

    for (const test of testCases) {
        console.log(`--- Testing ${test.name} (${test.site}) ---`);
        try {
            const result = await scrapeProductDetails(test.url, test.site);
            
            console.log(`✅ Title: ${result.title?.substring(0, 50)}...`);
            console.log(`✅ Barcode: ${result.barcode || 'Not found'}`);
            console.log(`✅ Competitor Count: ${result.competitors?.length || 0}`);
            
            if (result.competitors && result.competitors.length > 0) {
                console.log("Top Competitors:");
                result.competitors.slice(0, 3).forEach((c, i) => {
                    console.log(`  ${i+1}. ${c.sellerName}: ${c.price} ${c.currency}`);
                });
            } else {
                console.log("❌ No competitors found!");
            }
            console.log("\n");
        } catch (error) {
            console.error(`❌ Error testing ${test.name}:`, error instanceof Error ? error.message : error);
        }
    }

    await closeBrowser();
    console.log("🏁 Test completed.");
}

testUniversalBuyBox().catch(err => {
    console.error("Fatal Test Error:", err);
    process.exit(1);
});
