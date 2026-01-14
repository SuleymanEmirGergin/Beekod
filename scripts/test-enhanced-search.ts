import "../env.js";
import { unifiedMarketplaceSearch } from "../src/services/search/unifiedMarketplaceSearch.js";

async function testEnhancedSearch() {
    console.log("╔══════════════════════════════════════════════════════════════╗");
    console.log("║       GELİŞTİRİLMİŞ AGRESİF ARAMA TESTİ                      ║");
    console.log("╚══════════════════════════════════════════════════════════════╝\n");
    
    // Pazarama odaklı bir arama yapalım
    const query = "iPhone 15";
    console.log(`🔍 Aranan: "${query}" (Tüm pazaryerlerinde derin arama)\n`);
    
    try {
        const result = await unifiedMarketplaceSearch(query);
        
        if (result.ok) {
            const products = result.value;
            console.log(`✅ Toplam ${products.length} farklı ürün bulundu.\n`);
            
            // Pazaryerlerine göre gruplayalım
            const bySite: Record<string, any[]> = {};
            products.forEach(p => {
                if (!bySite[p.site]) bySite[p.site] = [];
                bySite[p.site].push(p);
            });
            
            for (const [site, items] of Object.entries(bySite)) {
                console.log(`📌 ${site} (${items.length} ürün):`);
                items.slice(0, 3).forEach((item, i) => {
                    console.log(`   ${i + 1}. [${item.source}] ${item.title.substring(0, 50)}...`);
                    console.log(`      Fiyat: ${item.price} ${item.currency}`);
                });
                if (items.length > 3) console.log(`   ... ve ${items.length - 3} ürün daha`);
                console.log("");
            }
        } else {
            console.log(`❌ Hata: ${result.error}`);
        }
    } catch (e) {
        console.log(`❌ Exception: ${e}`);
    }
}

testEnhancedSearch().catch(console.error);
