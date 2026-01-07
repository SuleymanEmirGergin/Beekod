import "../env.js";
import { universalProductSearch } from "../src/services/search/searchAggregator.js";

async function run() {
    const query = process.argv[2] || "bluetooth kulaklık";
    console.log(`[Verify] Starting Universal Search for: "${query}"...`);

    try {
        const result = await universalProductSearch(query);
        console.log("[Verify] Search completed.");

        console.log("\n--- Universal Search Results ---");
        console.log(`Total Found: ${result.total}`);
        console.log(`Time Taken: ${result.timeMs}ms`);
        console.log(`Sources: ${result.sources.join(", ")}`);
        console.log("--------------------------------");

        // Group by marketplace for easier debugging
        const byMarketplace: Record<string, any[]> = {};
        result.results.forEach(item => {
            if (!byMarketplace[item.marketplace]) byMarketplace[item.marketplace] = [];
            byMarketplace[item.marketplace].push(item);
        });

        for (const [mp, items] of Object.entries(byMarketplace)) {
            console.log(`\n[${mp}] Found ${items.length} items:`);
            items.slice(0, 3).forEach((item, idx) => {
                console.log(`  ${idx + 1}. ${item.title.substring(0, 60)}... - ${item.price} ${item.currency}`);
            });
        }

        if (result.total === 0) {
            console.warn("\nWARNING: No results found from any provider.");
        }

    } catch (error) {
        console.error("Universal Search failed:", error);
    }
}

run();
