import "../env.js";
import { unifiedMarketplaceSearch } from "../src/services/search/unifiedMarketplaceSearch.js";

async function testDeepSearch() {
    console.log("╔══════════════════════════════════════════════════════════════╗");
    console.log("║       DERİN ARAMA (DEEP SEARCH) TESTİ                        ║");
    console.log("╚══════════════════════════════════════════════════════════════╝\n");
    
    const query = "iPhone 15";
    console.log(`🔍 Aranan: "${query}" (DERİN MOD AKTİF)\n`);
    
    try {
        const result = await unifiedMarketplaceSearch(query, undefined, { deep: true });
        
        if (result.ok) {
            const products = result.value;
            console.log(`✅ Toplam ${products.length} ürün bulundu.\n`);
            
            // Pazarama ürünlerini özellikle kontrol edelim (BuyBox için)
            const pazaramaItems = products.filter(p => p.site === "Pazarama");
            
            console.log(`📌 PAZARAMA ÜRÜN DETAYLARI VE RAKİPLER:`);
            console.log("=".repeat(50));
            
            for (const item of pazaramaItems.slice(0, 2)) {
                console.log(`📦 ${item.title}`);
                console.log(`   Barkod: ${item.barcode || "Bulunamadı"}`);
                console.log(`   Ana Fiyat: ${item.price} ${item.currency}`);
                
                const competitors = item.attributes?.competitors;
                if (competitors && Array.isArray(competitors) && competitors.length > 0) {
                    console.log(`   👥 Diğer Satıcılar (${competitors.length} adet):`);
                    competitors.slice(0, 5).forEach((c, i) => {
                        console.log(`      ${i + 1}. ${c.sellerName.padEnd(20)} | Fiyat: ${c.price} TL ${c.shippingInfo ? `(${c.shippingInfo})` : ""}`);
                    });
                } else {
                    console.log(`   👥 Diğer Satıcı bilgisi bulunamadı veya BuyBox yok.`);
                }
                console.log("-".repeat(50));
            }
        } else {
            console.log(`❌ Hata: ${result.error}`);
        }
    } catch (e) {
        console.log(`❌ Exception: ${e}`);
    }
}

testDeepSearch().catch(console.error);
