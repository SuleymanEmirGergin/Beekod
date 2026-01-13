import "../../env.js";
import { n11Service } from "../../src/services/n11Service.js";
import { logger } from "../../src/logger.js";

async function testN11API() {
    console.log("=".repeat(60));
    console.log("N11 API Test");
    console.log("=".repeat(60));

    // 1. API yapılandırma kontrolü
    console.log("\n1. API Yapılandırma Kontrolü:");
    const isConfigured = n11Service.isConfigured();
    console.log(`   Configured: ${isConfigured}`);
    
    if (!isConfigured) {
        console.log("   ❌ N11 API credentials bulunamadı!");
        console.log("   .env dosyasında N11_API_KEY ve N11_SECRET_KEY olmalı");
        return;
    }
    
    console.log(`   API Key: ${n11Service.getApiKey()}`);

    // 2. Category Tree Test
    console.log("\n2. Category Tree Test:");
    try {
        const categories = await n11Service.getCategoryTree();
        console.log(`   ✅ ${categories.length} kategori bulundu`);
        console.log(`   İlk 3 kategori:`);
        categories.slice(0, 3).forEach(cat => {
            console.log(`      - ${cat.name} (ID: ${cat.id})`);
        });
    } catch (error: any) {
        console.log(`   ❌ Hata: ${error.message}`);
    }

    // 3. Product Query Test (Barcode ile)
    console.log("\n3. Product Query Test (Barcode):");
    try {
        const result = await n11Service.queryProducts({
            page: 0,
            size: 10,
            barcode: "test123" // Test barcode
        });
        console.log(`   Sonuç:`, JSON.stringify(result, null, 2));
    } catch (error: any) {
        console.log(`   ❌ Hata: ${error.message}`);
    }

    // 4. Product Query Test (Genel - ProductId olmadan)
    console.log("\n4. Product Query Test (Genel Arama):");
    try {
        const result = await n11Service.queryProducts({
            page: 0,
            size: 10
            // Barcode veya productId yok - genel liste
        });
        console.log(`   Sonuç:`, JSON.stringify(result, null, 2));
        
        if (result && result.products && result.products.length > 0) {
            console.log(`   ✅ ${result.products.length} ürün bulundu`);
            console.log(`   İlk ürün:`, result.products[0]);
        } else {
            console.log(`   ⚠️  Ürün bulunamadı veya sadece kendi ürünleriniz gösteriliyor`);
        }
    } catch (error: any) {
        console.log(`   ❌ Hata: ${error.message}`);
    }

    // 5. Category Search Test
    console.log("\n5. Category Search Test:");
    try {
        const results = n11Service.searchCategories("telefon");
        console.log(`   ✅ "${results.length}" kategori bulundu`);
        results.slice(0, 5).forEach(cat => {
            console.log(`      - ${cat.name} (ID: ${cat.id})`);
        });
    } catch (error: any) {
        console.log(`   ❌ Hata: ${error.message}`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("Test Tamamlandı");
    console.log("=".repeat(60));
}

testN11API().catch(console.error);
