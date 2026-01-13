import "../../env.js";
import { hepsiburadaService } from "../../src/services/hepsiburadaService.js";
import { pttavmService } from "../../src/services/pttavmService.js";

async function checkConfigs() {
    console.log("=== Configuration Check ===\n");
    
    console.log("Hepsiburada Configured:", hepsiburadaService.isConfigured());
    console.log("PttAVM Configured:", pttavmService.isConfigured());
    
    // Try HB listing directly
    if (hepsiburadaService.isConfigured()) {
        console.log("\n--- Testing Hepsiburada API ---");
        try {
            const res = await hepsiburadaService.getListings({ limit: 5 });
            console.log("HB Listings Result:", JSON.stringify(res, null, 2).substring(0, 500));
        } catch (e: any) {
            console.error("HB Error:", e.message);
        }
    }
    
    // Try PttAVM listing directly
    if (pttavmService.isConfigured()) {
        console.log("\n--- Testing PttAVM API ---");
        try {
            const res = await pttavmService.getListings();
            console.log("PttAVM Listings Status:", res.status);
            console.log("PttAVM Items Count:", res.items?.length || 0);
            if (res.items?.length > 0) {
                console.log("First Item:", JSON.stringify(res.items[0], null, 2));
            }
        } catch (e: any) {
            console.error("PttAVM Error:", e.message);
        }
    }
}

checkConfigs();
