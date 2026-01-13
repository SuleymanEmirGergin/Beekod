import "../../env.js";
import { getMarketplaceProvider } from "../../src/services/marketplace/index.js";

async function checkPazarama() {
    console.log("=== Pazarama Diagnostic ===\n");
    const provider = getMarketplaceProvider("Pazarama");
    
    if (!provider) {
        console.error("❌ Pazarama provider bulunamadı.");
        return;
    }

    const config = provider.getConfigStatus();
    console.log("Yapılandırma Durumu:", JSON.stringify(config, null, 2));

    if (!config.configured) {
        console.warn("⚠️ Pazarama yapılandırılmamış. Eksik anahtarlar:", config.missing);
        return;
    }

    console.log("\nÜrünler çekiliyor (autoPaginate: true)...");
    const result = await provider.listListings({ autoPaginate: true, size: 50 });
    
    if (result.ok) {
        console.log(`✅ Başarılı! Toplam Ürün: ${result.value.items.length}`);
        if (result.value.items.length > 0) {
            console.log("Örnek Ürün:", result.value.items[0].title);
        }
    } else {
        console.error("❌ Hata:", result.error.message);
    }
}

checkPazarama();
