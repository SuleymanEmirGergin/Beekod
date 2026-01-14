import "../../env.js";

async function testHepsiburadaProductCreation() {
    // Dynamic imports
    const hbServiceModule = await import("../../src/services/marketplace/hepsiburadaService.js");
    const hbProviderModule = await import("../../src/services/marketplace/providers/hepsiburadaProvider.js");
    
    console.log("╔══════════════════════════════════════════════════════════════╗");
    console.log("║       HEPSİBURADA ÜRÜN OLUŞTURMA TESTİ                        ║");
    console.log("╚══════════════════════════════════════════════════════════════╝\n");
    
    // Check what's exported
    console.log("📌 0. Export Kontrolü");
    console.log("-".repeat(50));
    console.log("   hbServiceModule keys:", Object.keys(hbServiceModule));
    console.log("   hbProviderModule keys:", Object.keys(hbProviderModule));
    
    const HepsiburadaProvider = hbProviderModule.HepsiburadaProvider;
    const hbProvider = new HepsiburadaProvider();
    
    // 1. Config kontrolü
    console.log("\n📌 1. Konfigürasyon Kontrolü");
    console.log("-".repeat(50));
    console.log(`   Configured: ${hbProvider.isConfigured()}`);
    console.log(`   Merchant ID: ${process.env.HEPSIBURADA_MERCHANT_ID?.substring(0, 8)}...`);
    console.log(`   API Key: ${process.env.HEPSIBURADA_API_KEY?.substring(0, 4)}****`);
    
    if (!hbProvider.isConfigured()) {
        console.log("\n❌ Hepsiburada yapılandırılmamış!");
        return;
    }
    
    // 2. Mevcut ürünleri çek
    console.log("\n📌 2. Mevcut Ürünleri Çekme");
    console.log("-".repeat(50));
    
    try {
        const listings = await hbProvider.listListings({ size: 5 });
        if (listings.ok) {
            const data = listings.value;
            console.log(`   ✅ ${data.items.length} ürün bulundu`);
            if (data.items.length > 0) {
                console.log("\n   İlk 3 ürün:");
                data.items.slice(0, 3).forEach((item: any, i: number) => {
                    console.log(`   ${i + 1}. ${item.title?.substring(0, 40)}... - ${item.price} TL`);
                    console.log(`      Barkod: ${item.barcode}, Stok: ${item.stock}`);
                });
            }
        } else {
            console.log(`   ⚠️ Hata: ${listings.error}`);
        }
    } catch (e) {
        console.log(`   ❌ Hata: ${e}`);
    }
    
    // 3. Kategori kontrolü - hepsiburadaService kullan
    console.log("\n📌 3. Kategori Kontrolü");
    console.log("-".repeat(50));
    
    const hbService = hbServiceModule.default || hbServiceModule.hepsiburadaService;
    if (hbService && typeof hbService.getAllCategories === 'function') {
        try {
            const categories = await hbService.getAllCategories({ leaf: true, size: 10 });
            console.log(`   ✅ ${categories.length} kategori bulundu`);
            if (categories.length > 0) {
                console.log("\n   Örnek kategoriler:");
                categories.slice(0, 5).forEach((cat: any, i: number) => {
                    console.log(`   ${i + 1}. [${cat.categoryId}] ${cat.name}`);
                });
            }
        } catch (e) {
            console.log(`   ❌ Kategori çekme hatası: ${e}`);
        }
    } else {
        console.log("   ⚠️ HepsiburadaService bulunamadı");
    }
    
    console.log("\n✨ Test tamamlandı!");
}

testHepsiburadaProductCreation().catch(console.error);
