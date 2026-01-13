import "../../env.js";
import { getMarketplaceProvider } from "../../src/services/marketplace/index.js";

async function debugAPIs() {
    console.log("=== Detailed API Debug ===\n");
    
    // HB Debug
    console.log("--- Hepsiburada ---");
    const hbProvider = getMarketplaceProvider("Hepsiburada");
    if (!hbProvider) {
        console.error("Hepsiburada provider not found!");
    } else {
        console.log("Configured:", hbProvider.isConfigured());
        try {
            const hbRes = await hbProvider.listListings();
            console.log("HB Success! Listings status:", hbRes.ok ? "Success" : "Failed");
            if (hbRes.ok) {
                console.log("Items count:", hbRes.value.items.length);
                if (hbRes.value.items.length > 0) {
                    console.log("First item:", JSON.stringify(hbRes.value.items[0], null, 2).substring(0, 300));
                }
            } else {
                console.error("HB Error:", hbRes.error.message);
            }
        } catch (e: any) {
            console.error("HB Unexpected Error:", e.message);
        }
    }
    
    // PttAVM Debug
    console.log("\n--- PttAVM ---");
    const pttProvider = getMarketplaceProvider("PttAVM");
    if (!pttProvider) {
        console.error("PttAVM provider not found!");
    } else {
        console.log("Configured:", pttProvider.isConfigured());
        try {
            const res = await pttProvider.listListings();
            console.log("PttAVM Status:", res.ok ? "Success" : "Failed", "| Items:", res.ok ? res.value.items.length : 0);
        } catch (e: any) {
            console.error("PttAVM Error:", e.message);
        }
    }
}

debugAPIs();
