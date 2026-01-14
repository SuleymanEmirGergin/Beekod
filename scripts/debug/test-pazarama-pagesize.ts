import "../../env.js";

async function findPazaramaPageLimit() {
    const { PazaramaProvider } = await import("../../src/services/marketplace/providers/pazaramaProvider.js");
    const provider = new PazaramaProvider();
    
    console.log("╔══════════════════════════════════════════════════════════════╗");
    console.log("║       PAZARAMA SAYFA BOYUTU TESTİ                            ║");
    console.log("╚══════════════════════════════════════════════════════════════╝\n");
    
    const sizesToTest = [10, 25, 50, 100, 200, 500];
    
    for (const size of sizesToTest) {
        console.log(`\n📌 Size: ${size}`);
        try {
            const result = await provider.listListings({ size, page: 1 });
            
            if (result.ok) {
                const data = result.value;
                if (data.status === "ok") {
                    console.log(`   ✅ Başarılı - ${data.items.length} ürün döndü`);
                } else {
                    console.log(`   ⚠️ API Hatası: ${data.message}`);
                }
            } else {
                console.log(`   ❌ Hata: ${result.error}`);
            }
        } catch (e) {
            console.log(`   ❌ Exception: ${e}`);
        }
    }
    
    console.log("\n\n📊 Sonuç: En yüksek çalışan sayfa boyutunu kullanın.");
}

findPazaramaPageLimit().catch(console.error);
