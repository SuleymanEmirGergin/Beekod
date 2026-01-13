import "../../env.js";
import { getMarketplaceProvider } from "../../src/services/marketplace/index.js";

async function listTrendyolProducts() {
    console.log("=== Listing Trendyol Products ===\n");
    
    // Temporarily set env for this process if we are sure of the values
    // But better to assume they are already in process.env if set by user or system
    
    const provider = getMarketplaceProvider("Trendyol");
    if (!provider) {
        console.error("Trendyol provider not found!");
        return;
    }

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
                console.table(result.value.items.slice(0, 5).map(it => ({
                    Barcode: it.barcode,
                    Title: it.title,
                    Price: it.price,
                    Stock: it.stock,
                    Active: it.active
                })));
            }
        } else {
            console.error("Failed to fetch products:", result.error.message);
        }
    } catch (e: any) {
        console.error("Unexpected error:", e.message);
    }
}

listTrendyolProducts().catch(console.error);
