import "../../env.js";
import { N11Adapter } from "../../src/services/search/adapters/n11Adapter.js";

async function testN11Adapter() {
    console.log("=".repeat(60));
    console.log("N11 Adapter Test (API-based)");
    console.log("=".repeat(60));

    const adapter = new N11Adapter();
    
    const testQueries = [
        "iphone",
        "laptop",
        "bagaj havuzu",
    ];

    for (const query of testQueries) {
        console.log(`\n🔍 Arama: "${query}"`);
        console.log("-".repeat(60));
        
        try {
            const results = await adapter.search(query);
            
            if (results.length === 0) {
                console.log("   ⚠️  Sonuç bulunamadı");
            } else {
                console.log(`   ✅ ${results.length} sonuç bulundu:\n`);
                results.slice(0, 3).forEach((item, index) => {
                    console.log(`   ${index + 1}. ${item.title}`);
                    console.log(`      Fiyat: ${item.price} ${item.currency}`);
                    console.log(`      URL: ${item.url}`);
                    console.log();
                });
            }
        } catch (error: any) {
            console.log(`   ❌ Hata: ${error.message}`);
        }
    }

    console.log("=".repeat(60));
    console.log("Test Tamamlandı");
    console.log("=".repeat(60));
}

testN11Adapter().catch(console.error);
