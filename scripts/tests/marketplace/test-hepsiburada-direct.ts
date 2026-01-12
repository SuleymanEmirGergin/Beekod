import { HepsiburadaAdapter } from "../src/services/search/adapters/hepsiburadaAdapter.js";

const adapter = new HepsiburadaAdapter();
const query = process.argv[2] || "iphone 13";

console.log(`Testing HepsiburadaAdapter directly with query: "${query}"`);

adapter.search(query).then(results => {
    console.log(`Found ${results.length} results.`);
    results.forEach((item, index) => {
        console.log(`${index + 1}. ${item.title} - ${item.price} ${item.currency}`);
        console.log(`   URL: ${item.url}`);
    });
}).catch(err => {
    console.error("Error:", err);
});
