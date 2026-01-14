import "../../env.js";

async function testAllMarketplaces() {
    console.log("╔══════════════════════════════════════════════════════════════╗");
    console.log("║       TÜM PAZARYERLERİ DURUM TESTİ                           ║");
    console.log("╚══════════════════════════════════════════════════════════════╝\n");
    
    const results: { name: string; configured: boolean; canList: boolean; productCount: number; error?: string }[] = [];
    
    // 1. Trendyol
    console.log("📌 1. TRENDYOL");
    console.log("-".repeat(50));
    try {
        const { TrendyolProvider } = await import("../../src/services/marketplace/providers/trendyolProvider.js");
        const provider = new TrendyolProvider();
        const isConfigured = provider.isConfigured();
        console.log(`   Configured: ${isConfigured}`);
        
        if (isConfigured) {
            const listings = await provider.listListings({ size: 5 });
            if (listings.ok) {
                console.log(`   ✅ ${listings.value.items.length} ürün bulundu`);
                results.push({ name: "Trendyol", configured: true, canList: true, productCount: listings.value.items.length });
            } else {
                console.log(`   ❌ Hata: ${listings.error}`);
                results.push({ name: "Trendyol", configured: true, canList: false, productCount: 0, error: String(listings.error) });
            }
        } else {
            results.push({ name: "Trendyol", configured: false, canList: false, productCount: 0 });
        }
    } catch (e) {
        console.log(`   ❌ Hata: ${e}`);
        results.push({ name: "Trendyol", configured: false, canList: false, productCount: 0, error: String(e) });
    }
    
    // 2. N11
    console.log("\n📌 2. N11");
    console.log("-".repeat(50));
    try {
        const { N11Provider } = await import("../../src/services/marketplace/providers/n11Provider.js");
        const provider = new N11Provider();
        const isConfigured = provider.isConfigured();
        console.log(`   Configured: ${isConfigured}`);
        
        if (isConfigured) {
            const listings = await provider.listListings({ size: 5 });
            if (listings.ok) {
                console.log(`   ✅ ${listings.value.items.length} ürün bulundu`);
                results.push({ name: "N11", configured: true, canList: true, productCount: listings.value.items.length });
            } else {
                console.log(`   ❌ Hata: ${listings.error}`);
                results.push({ name: "N11", configured: true, canList: false, productCount: 0, error: String(listings.error) });
            }
        } else {
            results.push({ name: "N11", configured: false, canList: false, productCount: 0 });
        }
    } catch (e) {
        console.log(`   ❌ Hata: ${e}`);
        results.push({ name: "N11", configured: false, canList: false, productCount: 0, error: String(e) });
    }
    
    // 3. Çiçeksepeti
    console.log("\n📌 3. ÇİÇEKSEPETİ");
    console.log("-".repeat(50));
    try {
        const { CiceksepetiProvider } = await import("../../src/services/marketplace/providers/ciceksepetiProvider.js");
        const provider = new CiceksepetiProvider();
        const isConfigured = provider.isConfigured();
        console.log(`   Configured: ${isConfigured}`);
        
        if (isConfigured) {
            const listings = await provider.listListings({ size: 5 });
            if (listings.ok) {
                console.log(`   ✅ ${listings.value.items.length} ürün bulundu`);
                results.push({ name: "Ciceksepeti", configured: true, canList: true, productCount: listings.value.items.length });
            } else {
                console.log(`   ❌ Hata: ${listings.error}`);
                results.push({ name: "Ciceksepeti", configured: true, canList: false, productCount: 0, error: String(listings.error) });
            }
        } else {
            results.push({ name: "Ciceksepeti", configured: false, canList: false, productCount: 0 });
        }
    } catch (e) {
        console.log(`   ❌ Hata: ${e}`);
        results.push({ name: "Ciceksepeti", configured: false, canList: false, productCount: 0, error: String(e) });
    }
    
    // 4. PttAVM
    console.log("\n📌 4. PTTAVM");
    console.log("-".repeat(50));
    try {
        const { PttavmProvider } = await import("../../src/services/marketplace/providers/pttavmProvider.js");
        const provider = new PttavmProvider();
        const isConfigured = provider.isConfigured();
        console.log(`   Configured: ${isConfigured}`);
        
        if (isConfigured) {
            const listings = await provider.listListings({ size: 5 });
            if (listings.ok) {
                console.log(`   ✅ ${listings.value.items.length} ürün bulundu`);
                results.push({ name: "PttAVM", configured: true, canList: true, productCount: listings.value.items.length });
            } else {
                console.log(`   ❌ Hata: ${listings.error}`);
                results.push({ name: "PttAVM", configured: true, canList: false, productCount: 0, error: String(listings.error) });
            }
        } else {
            results.push({ name: "PttAVM", configured: false, canList: false, productCount: 0 });
        }
    } catch (e) {
        console.log(`   ❌ Hata: ${e}`);
        results.push({ name: "PttAVM", configured: false, canList: false, productCount: 0, error: String(e) });
    }
    
    // 5. Pazarama
    console.log("\n📌 5. PAZARAMA");
    console.log("-".repeat(50));
    try {
        const { PazaramaProvider } = await import("../../src/services/marketplace/providers/pazaramaProvider.js");
        const provider = new PazaramaProvider();
        const isConfigured = provider.isConfigured();
        console.log(`   Configured: ${isConfigured}`);
        
        if (isConfigured) {
            const listings = await provider.listListings({ size: 5 });
            if (listings.ok) {
                console.log(`   ✅ ${listings.value.items.length} ürün bulundu`);
                results.push({ name: "Pazarama", configured: true, canList: true, productCount: listings.value.items.length });
            } else {
                console.log(`   ❌ Hata: ${listings.error}`);
                results.push({ name: "Pazarama", configured: true, canList: false, productCount: 0, error: String(listings.error) });
            }
        } else {
            results.push({ name: "Pazarama", configured: false, canList: false, productCount: 0 });
        }
    } catch (e) {
        console.log(`   ❌ Hata: ${e}`);
        results.push({ name: "Pazarama", configured: false, canList: false, productCount: 0, error: String(e) });
    }
    
    // Özet
    console.log("\n\n╔══════════════════════════════════════════════════════════════╗");
    console.log("║                         ÖZET                                  ║");
    console.log("╚══════════════════════════════════════════════════════════════╝\n");
    
    console.log("Pazaryeri      | Config | Liste | Ürün Sayısı");
    console.log("-".repeat(50));
    for (const r of results) {
        const config = r.configured ? "✅" : "❌";
        const list = r.canList ? "✅" : "❌";
        console.log(`${r.name.padEnd(14)} | ${config}     | ${list}    | ${r.productCount}`);
    }
    console.log("-".repeat(50));
    
    const working = results.filter(r => r.canList).length;
    console.log(`\n✅ Çalışan: ${working}/${results.length}`);
}

testAllMarketplaces().catch(console.error);
