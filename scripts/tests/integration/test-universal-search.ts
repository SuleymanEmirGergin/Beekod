import { universalProductSearch } from "../src/services/search/searchAggregator.js";
import { closeBrowser } from "../src/services/scraper/browser.js";

async function main() {
    const query = process.argv[2] || "iphone 13 128gb";
    console.log(`Searching for: ${query}...`);
    console.log("------------------------------------------------");

    try {
        const result = await universalProductSearch(query);
        console.log(`Found ${result.total} results in ${result.timeMs}ms from sources: ${result.sources.join(", ")}`);
        console.log("------------------------------------------------");

        // Group by marketplace for display
        const byMarket = result.results.reduce((acc, item) => {
            acc[item.marketplace] = acc[item.marketplace] || [];
            acc[item.marketplace].push(item);
            return acc;
        }, {} as Record<string, typeof result.results>);

        for (const [market, items] of Object.entries(byMarket)) {
            console.log(`\n[${market}]`);
            items.slice(0, 3).forEach(item => {
                console.log(`- ${item.price} TL | ${item.title.substring(0, 60)}...`);
            });
        }

    } catch (error) {
        console.error("Search failed:", error);
    } finally {
        await closeBrowser();
    }
}

main();
