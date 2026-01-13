import "../../env.js";
import { getMarketplaceProvider } from "../../src/services/marketplace/index.js";

async function debugN11Price() {
    console.log("=== Debugging N11 Price Logic ===\n");
    
    // Set credentials
    process.env.N11_API_KEY = "f2a82719-3b29-4415-a101-dbc7af94c2ac";
    process.env.N11_API_SECRET = "QciNuHw1fiqAnics";
    process.env.N11_API_BASE = "https://api.n11.com";

    const provider = getMarketplaceProvider("N11");
    if (!provider) return;

    try {
        // We'll call listListings but capture the raw response if we can
        // Since we already have n11_out.txt, let's try to get more detail on ONE product
        const result = await provider.listListings();
        if (result.ok && result.value.items.length > 0) {
            console.log("Raw mapping check for first 3 products:");
            // We need to see the XML response to understand why salePrice is 0
            // I'll modify n11Provider temporarily to log raw XML for debugging if needed
        }
    } catch (e: any) {
        console.error(e.message);
    }
}

debugN11Price();
