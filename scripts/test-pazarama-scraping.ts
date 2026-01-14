import "../env.js";
import { scrapeMarketplace } from "../src/services/webScraperService.js";

async function testPazaramaPublicSearch() {
    console.log("╔══════════════════════════════════════════════════════════════╗");
    console.log("║       PAZARAMA KAMUYA AÇIK ARAMA TESTİ                       ║");
    console.log("╚══════════════════════════════════════════════════════════════╝\n");
    
    const queries = ["iPhone 15", "Airpods Pro 2", "Samsung S24"];
    
    for (const query of queries) {
        console.log(`\n🔍 Aranan: "${query}"`);
        console.log("-".repeat(50));
        
        try {
            const results = await scrapeMarketplace("Pazarama", query, { 
                maxResults: 10,
                timeout: 30000 
            });
            
            console.log(`✅ ${results.length} sonuç bulundu.`);
            
            results.forEach((r, i) => {
                console.log(`${i + 1}. ${r.title}`);
                console.log(`   Fiyat: ${r.price} ${r.currency}`);
                console.log(`   URL: ${r.url.substring(0, 50)}...`);
                console.log(`   Görsel: ${r.image ? "Var" : "Yok"}`);
                console.log("");
            });
            
            if (results.length === 0) {
                console.log("⚠️ Hiç sonuç bulunamadı. Selectors güncel olmayabilir veya Cloudflare engeli takılmış olabilir.");
            }
        } catch (e) {
            console.log(`❌ Hata: ${e}`);
        }
    }
}

testPazaramaPublicSearch().catch(console.error);
