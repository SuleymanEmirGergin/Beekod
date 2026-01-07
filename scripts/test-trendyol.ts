import { TrendyolAdapter } from "../src/services/search/adapters/trendyolAdapter.js";
import { closeBrowser } from "../src/services/scraper/browser.js";

async function main() {
    const query = process.argv[2] || "iphone 13";
    console.log(`Testing Trendyol Only: ${query}...`);

    const adapter = new TrendyolAdapter();

    try {
        const start = Date.now();
        const items = await adapter.search(query);
        const duration = Date.now() - start;

        console.log(`\nFound ${items.length} items in ${duration}ms`);
        console.log("------------------------------------------------");

        items.forEach(item => {
            console.log(`[${item.price} TL] ${item.title}`);
            console.log(`URL: ${item.url}`);
            console.log(`IMG: ${item.imageUrl}`);
            console.log("-");
        });

    } catch (error) {
        console.error("Trendyol test failed:", error);
    } finally {
        await closeBrowser();
    }
}

main();
