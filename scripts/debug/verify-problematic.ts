import "../../env.js";
import { hepsiburadaService } from "../../src/services/marketplace/hepsiburadaService.js";
import { pttavmService } from "../../src/services/marketplace/pttavmService.js";

async function verifyProblematic() {
    console.log("=== HB & PttAVM Targeted Verification ===\n");
    
    // HEPSIBURADA
    console.log("--- Hepsiburada ---");
    console.log("Configured:", hepsiburadaService.isConfigured());
    try {
        const hbRes = await hepsiburadaService.getListings({ limit: 5 });
        if (hbRes.ok) {
            const data = hbRes.value;
            console.log("HB Listings Result: SUCCESS");
            if (data.items?.length > 0) {
                console.log("Found Items:", data.items.length);
                console.log("First Item:", data.items[0].sku || "Has Item");
            } else {
                 console.log("HB Response Body:", JSON.stringify(data).substring(0, 500));
            }
        } else {
            console.log("HB Listings Result: FAILED", hbRes.error?.message);
        }
    } catch (e: any) {
        console.error("HB Error:", e.message);
    }
    
    // PTTAVM
    console.log("\n--- PttAVM ---");
    console.log("Configured:", pttavmService.isConfigured());
    try {
        const pttRes = await pttavmService.getListings({});
        if (pttRes.ok) {
            const data = pttRes.value;
            console.log("PttAVM List Status:", data.status);
            console.log("Items Count:", data.items?.length || 0);
            if (data.items?.length > 0) {
                console.log("First Item SKU:", data.items[0].barcode);
                console.log("First Item Name:", data.items[0].name.substring(0, 50));
            }
        } else {
            console.log("PttAVM List Status: FAILED", pttRes.error?.message);
        }
    } catch (e: any) {
        console.error("PttAVM Error:", e.message);
    }
}

verifyProblematic();
