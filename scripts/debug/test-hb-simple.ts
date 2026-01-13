import "../../env.js";
import { getMarketplaceProvider } from "../../src/services/marketplace/index.js";

async function testHepsiburada() {
    console.log("=== Testing Hepsiburada Products ===\n");
    const provider = getMarketplaceProvider("Hepsiburada");
    if (!provider) return;

    try {
        const result = await provider.listListings({ size: 10 });
        if (result.ok) {
            console.log(`Found ${result.value.items.length} items.`);
            if (result.value.items.length > 0) {
                console.table(result.value.items.slice(0, 5));
            } else {
                console.log("No items found. This might be a listing-external issue or account has no products.");
            }
        } else {
            console.error("Error:", result.error.message);
        }
    } catch (e: any) {
        console.error("Fatal:", e.message);
    }
}

testHepsiburada();
