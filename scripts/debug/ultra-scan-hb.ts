import "../../env.js";
import { getMarketplaceProvider } from "../../src/services/marketplace/index.js";

async function ultraScanHB() {
    console.log("=== Hepsiburada ULTRA SCAN ===\n");
    const provider: any = getMarketplaceProvider("Hepsiburada");
    if (!provider) return;

    const merchantId = process.env.HEPSIBURADA_MERCHANT_ID;
    
    const probes = [
        { name: "Listings (Default)", path: `/listings/merchantid/${merchantId}` },
        { name: "Listings (Active)", path: `/listings/merchantid/${merchantId}?status=Active` },
        { name: "Listings (Suspended)", path: `/listings/merchantid/${merchantId}?status=Suspended` },
        { name: "Listings (Waiting)", path: `/listings/merchantid/${merchantId}?status=Waiting` },
        { name: "Inventory Uploads", path: `/listings/merchantid/${merchantId}/inventory-uploads` },
        { name: "Packages (Orders)", path: `/packages/merchantid/${merchantId}` },
        { name: "Merchant Details", path: `/merchants/${merchantId}` }
    ];

    for (const probe of probes) {
        console.log(`\n🔍 Probing: ${probe.name}`);
        try {
            const res = await provider.requestRaw("GET", probe.path);
            if (res.ok) {
                console.log(`   ✅ Success!`);
                const data = res.data;
                if (Array.isArray(data)) {
                    console.log(`   Found ${data.length} items.`);
                    if (data.length > 0) console.log(JSON.stringify(data[0]).substring(0, 200));
                } else if (data && typeof data === "object") {
                    const keys = Object.keys(data);
                    console.log(`   Keys: ${keys.join(", ")}`);
                    if (data.listings) console.log(`   Listings count: ${data.listings.length}`);
                    if (data.totalElements) console.log(`   Total elements: ${data.totalElements}`);
                    console.log(`   Data Snippet: ${JSON.stringify(data).substring(0, 300)}`);
                }
            } else {
                console.log(`   ❌ Failed: ${res.message}`);
            }
        } catch (e: any) {
            console.log(`   🔥 Exception: ${e.message}`);
        }
    }
}

ultraScanHB();
