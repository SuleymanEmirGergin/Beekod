import "../../env.js";
import { PazaramaProvider } from "../../src/services/marketplace/providers/pazaramaProvider.js";

async function testPazarama() {
    const provider = new PazaramaProvider();
    
    console.log("--- Pazarama Bağlantı Testi (Doğrudan) ---");
    console.log("Konfigürasyon Durumu:", provider.isConfigured() ? "✅ Yapılandırıldı" : "❌ Yapılandırılmadı");
    
    if (!provider.isConfigured()) {
        const status = provider.getConfigStatus();
        console.log("Eksik Değişkenler:", status.missing);
        return;
    }

    try {
        console.log("Ürünler listeleniyor...");
        const res = await provider.listListings({ page: 1 });
        if (!res.ok) {
            console.log("Hata:", res.error?.message);
            return;
        }
        const data = res.value;
        console.log("API Yanıt Durumu:", data.status);
        console.log("Ürün Sayısı:", data.items?.length || 0);
        if (data.items?.length > 0) {
            console.log("Örnek Ürün:", data.items[0].title);
        } else {
            console.log("Mesaj:", data.message);
        }
    } catch (e: any) {
        console.error("Hata:", e.message);
    }
}

testPazarama();
