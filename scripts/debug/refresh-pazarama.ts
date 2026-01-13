import "../../env.js";
import { getMarketplaceProvider } from "../../src/services/marketplace/index.js";

async function refreshPazarama() {
    console.log("=== Pazarama Token Yenileme ===\n");
    
    const provider = getMarketplaceProvider("Pazarama");
    if (!provider) {
        console.error("Pazarama provider bulunamadı!");
        return;
    }

    if (!provider.isConfigured()) {
        console.error("Pazarama yapılandırılmamış. Gerekli ENV değişkenleri:");
        console.log("  - PAZARAMA_CLIENT_ID");
        console.log("  - PAZARAMA_CLIENT_SECRET");
        return;
    }

    console.log("Token tazeleniyor...");
    
    try {
        const result = await provider.refreshToken();
        if (result.ok) {
            console.log("✅ Token başarıyla tazelendi!");
            console.log("Sonuç:", result.value);
            
            // Test the connection
            console.log("\nBağlantı test ediliyor...");
            const listResult = await provider.listListings({ size: 5 });
            if (listResult.ok) {
                console.log(`✅ Bağlantı başarılı! ${listResult.value.items.length} ürün bulundu.`);
            } else {
                console.error("❌ Liste çekme hatası:", listResult.error.message);
            }
        } else {
            console.error("❌ Token tazeleme başarısız:", result.error.message);
        }
    } catch (e: any) {
        console.error("❌ Hata:", e.message);
    }
}

refreshPazarama();
