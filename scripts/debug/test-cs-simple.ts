import "../../env.js";
import { getMarketplaceProvider } from "../../src/services/marketplace/index.js";

async function testCS() {
    console.log("=== Testing Ciceksepeti Integration ===\n");
    const provider = getMarketplaceProvider("Ciceksepeti");
    if (!provider) return;

    try {
        const result = await provider.listListings({ size: 5 });
        if (result.ok) {
            console.log(`Ciceksepeti: Found ${result.value.items.length} items.`);
            if (result.value.items.length > 0) {
               console.table(result.value.items.slice(0, 5));
            }
        } else {
            console.error("Ciceksepeti Error:", result.error.message);
        }
    } catch (e: any) {
        console.error("Ciceksepeti Fatal:", e.message);
    }
}

testCS();
