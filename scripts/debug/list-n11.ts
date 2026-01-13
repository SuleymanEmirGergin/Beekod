import "../../env.js";
import { getMarketplaceProvider } from "../../src/services/marketplace/index.js";

async function listN11Products() {
    console.log("=== Listing N11 Products ===\n");
    
    const provider = getMarketplaceProvider("N11");
    if (!provider) {
        console.error("N11 provider not found!");
        return;
    }

    // Temporarily set env for this process
    // APIKey: f2a82719-3b29-4415-a101-dbc7af94c2ac
    // SecretKey: QciNuHw1fiqAnics
    process.env.N11_API_KEY = "f2a82719-3b29-4415-a101-dbc7af94c2ac";
    process.env.N11_API_SECRET = "QciNuHw1fiqAnics";
    process.env.N11_API_BASE = "https://api.n11.com";

    console.log("Configured:", provider.isConfigured());
    if (!provider.isConfigured()) {
        const status = provider.getConfigStatus();
        console.log("Missing keys:", status.missing.join(", "));
        return;
    }

    try {
        const result = await provider.listListings();
        if (result.ok) {
            console.log(`Success! Found ${result.value.items.length} products.`);
            if (result.value.items.length > 0) {
                console.log("\nSample Products:");
                console.table(result.value.items.slice(0, 10).map(it => ({
                    Barcode: it.barcode,
                    Title: it.title,
                    Price: it.price,
                    Stock: it.stock,
                    Category: it.category
                })));
            }
        } else {
            console.error("Failed to fetch products:", result.error.message);
        }
    } catch (e: any) {
        console.error("Unexpected error:", e.message);
    }
}

listN11Products().catch(console.error);
