import "../../env.js";

async function testHepsiburadaListings() {
    const hbProviderModule = await import("../../src/services/marketplace/providers/hepsiburadaProvider.js");
    const HepsiburadaProvider = hbProviderModule.HepsiburadaProvider;
    const hbProvider = new HepsiburadaProvider();
    
    console.log("╔══════════════════════════════════════════════════════════════╗");
    console.log("║       HEPSİBURADA ÜRÜN LİSTELEME TESTİ                        ║");
    console.log("╚══════════════════════════════════════════════════════════════╝\n");
    
    console.log(`Configured: ${hbProvider.isConfigured()}`);
    console.log(`Merchant ID: ${process.env.HEPSIBURADA_MERCHANT_ID}`);
    
    if (!hbProvider.isConfigured()) {
        console.log("\n❌ Hepsiburada yapılandırılmamış!");
        return;
    }
    
    console.log("\n📦 Ürünler çekiliyor...\n");
    
    try {
        const result = await hbProvider.listListings({ size: 20 });
        
        if (!result.ok) {
            console.log(`❌ Hata: ${result.error}`);
            return;
        }
        
        const data = result.value;
        console.log(`✅ Toplam ${data.items.length} ürün bulundu\n`);
        
        if (data.items.length === 0) {
            console.log("   Henüz ürün yok.");
            return;
        }
        
        console.log("─".repeat(80));
        console.log("No  | Barkod          | Stok | Fiyat      | Ürün Adı");
        console.log("─".repeat(80));
        
        data.items.forEach((item: any, i: number) => {
            const barcode = (item.barcode || item.sku || "-").padEnd(15);
            const stock = String(item.stock ?? 0).padStart(4);
            const price = `${(item.price ?? 0).toFixed(2)} TL`.padStart(10);
            const title = (item.title || item.name || "?").substring(0, 35);
            
            console.log(`${String(i + 1).padStart(2)}  | ${barcode} | ${stock} | ${price} | ${title}`);
        });
        
        console.log("─".repeat(80));
        
    } catch (e) {
        console.log(`❌ Hata: ${e}`);
    }
}

testHepsiburadaListings().catch(console.error);
