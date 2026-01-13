import "../../env.js";
import { competitionService } from "../../src/services/pricing/competitionService.js";
import { logger } from "../../src/logger.js";

async function testCompetition() {
    const barcode = process.argv[2] || "8682344161048"; // Örnek barkod (Trendyol'da olan bir ürün seçilebilir)
    
    console.log(`--- Rekabet Analiz Testi: ${barcode} ---`);
    
    try {
        let analysis = await competitionService.analyzeCompetition(barcode);
        
        if (!analysis) {
            console.log("⚠️ Ürün veritabanında yok. API'yi test etmek için manuel fiyat (100 TL) kullanılıyor...");
            // Manual test if not in DB
            const mp = await import("../../src/services/marketplace/index.js");
            const ty = mp.getMarketplaceProvider("Trendyol");
            if (ty && ty.getPriceCompetition) {
                const res = await ty.getPriceCompetition([barcode]);
                if (res.ok && res.value.length > 0) {
                    const data = res.value[0];
                    console.log("API Yanıtı Geldi!");
                    console.log(`- En Düşük Fiyat: ${data.lowestPrice} TL`);
                    console.log(`- Rakip Sayısı: ${data.competitorCount}`);
                    console.log(`- Kazanan Satıcı: ${data.winningSeller}`);
                } else {
                    console.log("❌ API'den veri dönmedi.");
                }
            }
            return;
        }

        console.log("Analiz Sonuçları:");
        console.log(`- Bizim Fiyatımız: ${analysis.ourPrice} TL`);
        console.log(`- En Düşük Fiyat: ${analysis.lowestPrice} TL`);
        console.log(`- Pazar Pozisyonu: ${analysis.marketPosition}`);
        console.log(`- Rakip Sayısı: ${analysis.competitorCount}`);
        console.log(`- Kazanan Satıcı: ${analysis.winningSeller}`);
        console.log(`- Buy-Box Bizde mi?: ${analysis.isWinningBuyBox ? "✅ EVET" : "❌ HAYIR"}`);

    } catch (error: any) {
        console.error("Test hatası:", error.message);
    }
}

testCompetition();
