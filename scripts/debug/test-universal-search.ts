import "../../env.js";
import { unifiedMarketplaceSearch } from "../../src/services/search/unifiedMarketplaceSearch.js";

async function testUniversalSearch() {
    const query = "Space Elegance 5'li Set Minder"; // From the user's image
    console.log(`=== Universal Search Test: "${query}" ===\n`);
    
    const startTime = Date.now();
    const result = await unifiedMarketplaceSearch(query);
    const duration = (Date.now() - startTime) / 1000;
    
    if (result.ok) {
        console.log(`✅ Arama Başarılı! (${duration}s)`);
        console.log(`Toplam Sonuç: ${result.value.length}\n`);
        
        console.table(result.value.map(r => ({
            Site: r.site,
            Başlık: r.title.substring(0, 40) + "...",
            Fiyat: `${r.price} ${r.currency}`,
            Kaynak: r.source,
            Stok: r.inStock ? "Var" : "Yok"
        })));
    } else {
        console.error("❌ Arama Başarısız:", result.error.message);
    }
}

testUniversalSearch();
