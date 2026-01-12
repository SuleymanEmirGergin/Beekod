import "../env.js"; // Load env vars
import { googleSearch } from "../src/marketplaces/api/googleSearch.js";

async function run() {
    const query = process.argv[2] || "iphone 15 pro max";
    console.log(`Searching for: ${query}`);
    try {
        const results = await googleSearch(query);
        console.log("Results found:", results.length);
        results.forEach((item: any, index: number) => {
            console.log(`\n--- Result ${index + 1} ---`);
            console.log(`Title: ${item.title}`);
            console.log(`Price: ${item.price} ${item.currency || ""}`);
            console.log(`Availability: ${item.availability}`);
            console.log(`Brand: ${item.brand}`);
            console.log(`Rating: ${item.rating}`);
            console.log(`Snippet: ${item.snippet.substring(0, 100)}...`);
        });
    } catch (error) {
        console.error("Search failed:", error);
    }
}

run();
