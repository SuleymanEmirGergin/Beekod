import "../../env.js";

async function testPazaramaFull() {
    const { PazaramaProvider } = await import("../../src/services/marketplace/providers/pazaramaProvider.js");
    const provider = new PazaramaProvider();
    
    console.log("╔══════════════════════════════════════════════════════════════╗");
    console.log("║       PAZARAMA DETAYLI TEST                                  ║");
    console.log("╚══════════════════════════════════════════════════════════════╝\n");
    
    console.log(`Configured: ${provider.isConfigured()}`);
    
    if (!provider.isConfigured()) {
        console.log("❌ Pazarama yapılandırılmamış!");
        return;
    }
    
    // Tüm ürünleri çek (pagination ile)
    console.log("\n📦 Tüm ürünler çekiliyor (pagination ile)...\n");
    
    try {
        const result = await provider.listListings({ size: 1000 }); // Büyük sayfa boyutu
        
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
        
        data.items.slice(0, 20).forEach((item: any, i: number) => {
            const barcode = (item.barcode || item.sku || "-").toString().padEnd(15);
            const stock = String(item.stock ?? 0).padStart(4);
            const price = `${(item.price ?? 0).toFixed(2)} TL`.padStart(10);
            const title = (item.title || item.name || "?").substring(0, 35);
            
            console.log(`${String(i + 1).padStart(2)}  | ${barcode} | ${stock} | ${price} | ${title}`);
        });
        
        if (data.items.length > 20) {
            console.log(`... ve ${data.items.length - 20} ürün daha`);
        }
        
        console.log("─".repeat(80));
        
    } catch (e) {
        console.log(`❌ Hata: ${e}`);
    }
}

testPazaramaFull().catch(console.error);
