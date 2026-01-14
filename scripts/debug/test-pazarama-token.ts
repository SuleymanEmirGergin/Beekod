import "../../env.js";

async function testPazaramaWithTokenRefresh() {
    const { PazaramaProvider } = await import("../../src/services/marketplace/providers/pazaramaProvider.js");
    const provider = new PazaramaProvider();
    
    console.log("╔══════════════════════════════════════════════════════════════╗");
    console.log("║       PAZARAMA TOKEN YENİLEME ve LİSTELEME TESTİ             ║");
    console.log("╚══════════════════════════════════════════════════════════════╝\n");
    
    console.log(`Configured: ${provider.isConfigured()}`);
    console.log(`Token Status: ${JSON.stringify(provider.getTokenStatus())}`);
    
    // 1. Token yenile
    console.log("\n📌 1. Token Yenileniyor...");
    const refreshResult = await provider.refreshToken();
    if (refreshResult.ok) {
        console.log(`   ✅ Token yenilendi: ${refreshResult.value.message}`);
    } else {
        console.log(`   ❌ Token yenileme hatası: ${refreshResult.error}`);
        return;
    }
    
    // 2. Sayfa boyutlarını test et
    console.log("\n📌 2. Sayfa Boyutları Test Ediliyor...");
    const sizes = [10, 50, 100, 200];
    const results: { size: number; success: boolean; count: number }[] = [];
    
    for (const size of sizes) {
        console.log(`\n   Size: ${size}`);
        try {
            const result = await provider.listListings({ size, page: 1 });
            if (result.ok && result.value.status === "ok") {
                console.log(`   ✅ ${result.value.items.length} ürün`);
                results.push({ size, success: true, count: result.value.items.length });
            } else {
                const msg = result.ok ? result.value.message : String(result.error);
                console.log(`   ⚠️ Hata: ${msg?.substring(0, 50)}`);
                results.push({ size, success: false, count: 0 });
            }
        } catch (e) {
            console.log(`   ❌ Exception: ${e}`);
            results.push({ size, success: false, count: 0 });
        }
    }
    
    // 3. Özet
    console.log("\n\n📊 ÖZET:");
    console.log("-".repeat(40));
    for (const r of results) {
        console.log(`Size ${r.size}: ${r.success ? "✅" : "❌"} - ${r.count} ürün`);
    }
    
    const maxWorking = results.filter(r => r.success).sort((a, b) => b.size - a.size)[0];
    if (maxWorking) {
        console.log(`\n🎯 Önerilen sayfa boyutu: ${maxWorking.size}`);
    }
}

testPazaramaWithTokenRefresh().catch(console.error);
