import "../../env.js";
import { getMarketplaceProvider } from "../../src/services/marketplace/index.js";

async function caseScanHB() {
    console.log("=== Hepsiburada CASE & PATH SCAN ===\n");
    const provider: any = getMarketplaceProvider("Hepsiburada");
    if (!provider) return;

    const mid = process.env.HEPSIBURADA_MERCHANT_ID || "";
    const midLower = mid.toLowerCase();
    const midUpper = mid.toUpperCase();
    
    const variations = [
        { name: "Lowercase UUID in Path", path: `/listings/merchantid/${midLower}` },
        { name: "Uppercase UUID in Path", path: `/listings/merchantid/${midUpper}` },
        { name: "UUID as Query Param", path: `/listings?merchantId=${midLower}` },
        { name: "V1 Listings Path", path: `/listings` }
    ];

    for (const v of variations) {
        console.log(`\n🔍 Variating: ${v.name}`);
        try {
            const res = await provider.requestRaw("GET", v.path);
            console.log(`   Durum: ${res.ok ? "✅ Başarılı" : "❌ Başarısız"} (${res.message})`);
            if (res.ok) {
                console.log(`   Yanıt Başlığı: ${JSON.stringify(res.data).substring(0, 100)}...`);
                if (res.data && res.data.listings) console.log(`   ✅ Ürün sayısı: ${res.data.listings.length}`);
            }
        } catch (e: any) {
            console.log(`   🔥 Hata: ${e.message}`);
        }
    }
}

caseScanHB();
