import "../env.js";
import { scrapeProductDetails } from "../src/services/webScraperService.js";

async function testPazaramaBuyBox() {
    const url = "https://www.pazarama.com/apple-iphone-15-128-6-gb-ram-5g-apple-turkiye-garantili-p-195949036040";
    console.log(`🔍 Test Ediliyor: ${url}\n`);
    
    try {
        const details = await scrapeProductDetails(url, "Pazarama");
        console.log("✅ Detaylar çekildi:");
        console.log(`📦 Başlık: ${details.title}`);
        console.log(`🏷️ Barkod: ${details.barcode}`);
        
        if (details.competitors && details.competitors.length > 0) {
            console.log(`✅ RAKİP SATICILAR BULUNDU (${details.competitors.length}):`);
            details.competitors.forEach((c, i) => {
                console.log(`   ${i + 1}. Satıcı: ${c.sellerName} | Fiyat: ${c.price} TL`);
            });
        } else {
            console.log("❌ Rakip satıcı bilgisi bulunamadı.");
            if ((details as any)._debug) {
                console.log("🛠️ Debug Bilgisi:", JSON.stringify((details as any)._debug, null, 2));
            }
        }
    } catch (e) {
        console.log("❌ Hata:", e);
    }
}

testPazaramaBuyBox().catch(console.error);
