import "../../env.js";
import { getMarketplaceProvider } from "../../src/services/marketplace/index.js";

async function testPtt() {
    console.log("=== Testing PttAVM Integration ===\n");
    const provider = getMarketplaceProvider("PttAVM");
    if (!provider) return;

    try {
        const result = await provider.listListings({ size: 5 });
        if (result.ok) {
            console.log(`PttAVM: Found ${result.value.items.length} items.`);
            if (result.value.items.length > 0) {
               console.table(result.value.items);
            }
        } else {
            console.error("PttAVM Error:", result.error.message);
        }
    } catch (e: any) {
        console.error("PttAVM Fatal:", e.message);
    }
}

testPtt();
