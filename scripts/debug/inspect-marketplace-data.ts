import "../../env.js";
import { n11Service } from "../../src/services/n11Service.js";
import { hepsiburadaService } from "../../src/services/hepsiburadaService.js";
import { trendyolService } from "../../src/services/trendyolService.js";
import { ciceksepetiService } from "../../src/services/ciceksepetiService.js";

async function inspectMarketplaceData() {
    console.log("🔍 Market Data Inspection");
    
    // 1. N11 Data (already known, but verifying)
    if (n11Service.isConfigured()) {
        console.log("\n🐞 N11 Data Inspection:");
        try {
            const res = await n11Service.queryProducts({ size: 1 });
            if (res?.content?.[0]) {
                const p = res.content[0];
                console.log("Keys available:", Object.keys(p));
                console.log("Stock:", p.quantity);
                console.log("Description length:", p.description?.length);
                console.log("Attributes:", JSON.stringify(p.attributes));
            }
        } catch (e: any) { console.log("N11 Error:", e.message); }
    }

    // 2. Trendyol Data
    if (trendyolService.isConfigured()) {
        console.log("\n🐞 Trendyol Data Inspection:");
        try {
            const res = await trendyolService.getProducts({ size: 1 });
            // Trendyol response structure might be under 'content' or 'products'
            const products = res?.content || res?.products || res || [];
            if (products.length > 0) {
                const p = products[0];
                console.log("Product JSON:", JSON.stringify(p, null, 2));
            } else {
                console.log("Trendyol: No products found or structure unknown", JSON.stringify(res).substring(0, 200));
            }
        } catch (e: any) { console.log("Trendyol Error:", e.message); }
    } else {
        console.log("\n🐞 Trendyol: Not configured or service not exported correctly.");
    }

    // 3. Ciceksepeti Data
    if (ciceksepetiService.isConfigured()) {
        console.log("\n🐞 Ciceksepeti Data Inspection:");
        try {
            const res = await ciceksepetiService.getProducts({ pageSize: 5 });
            const products = res?.products || res?.response?.products || [];
            if (products.length > 0) {
                const p = products[0];
                console.log("Keys available:", Object.keys(p));
                console.log("Sample Brand:", p.brandName || p.brand || "Not found");
                console.log("Sample Desc length:", (p.description || p.productDescription || "").length);
            }
        } catch (e: any) { 
            console.log("Ciceksepeti Error:", e.message); 
        }
    }

    // 4. Hepsiburada Data
    if (hepsiburadaService.isConfigured()) {
        console.log("\n🐞 Hepsiburada Data Inspection:");
        try {
            const res = await hepsiburadaService.getListings({ limit: 1 });
            const listings = res?.listings || res || [];
            if (listings.length > 0) {
                const p = listings[0];
                console.log("Listing Keys:", Object.keys(p));
                console.log("Listing Sample:", JSON.stringify(p, null, 2));

                // Try to get detail if sku available
                const sku = p.hepsiburadaSku || p.sku;
                if (sku) {
                    console.log(`\nAttempting Detail for SKU: ${sku}`);
                    const detail = await hepsiburadaService.getProductByHbSku(sku);
                    console.log("Detail Keys:", Object.keys(detail));
                    console.log("Detail Sample:", JSON.stringify(detail, null, 2));
                }
            }
        } catch (e: any) {
            console.log("Hepsiburada Error:", e.message);
        }
    } else {
        console.log("\n🐞 Hepsiburada: Not configured.");
    }
}

inspectMarketplaceData();
