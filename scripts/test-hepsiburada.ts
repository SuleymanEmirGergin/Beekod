import { universalProductSearch } from "../src/services/search/searchAggregator.js";

const query = process.argv[2] || "iphone 13";

console.log(`\n🔍 Testing Hepsiburada Adapter with query: "${query}"\n`);

universalProductSearch(query)
    .then(({ results, total, sources, timeMs }) => {
        const hepsiburadaResults = results.filter(r => r.marketplace === "Hepsiburada");

        console.log(`\n📊 Results Summary:`);
        console.log(`  Total: ${results.length}`);
        console.log(`  Hepsiburada: ${hepsiburadaResults.length}`);

        if (hepsiburadaResults.length > 0) {
            console.log(`\n✅ Hepsiburada Products:\n`);
            hepsiburadaResults.forEach((item, index) => {
                console.log(`${index + 1}. ${item.title}`);
                console.log(`   Price: ${item.price} ${item.currency}`);
                console.log(`   URL: ${item.url}`);
                console.log();
            });
        } else {
            console.log(`\n❌ No Hepsiburada results found!`);
        }

        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Test failed:", error);
        process.exit(1);
    });
