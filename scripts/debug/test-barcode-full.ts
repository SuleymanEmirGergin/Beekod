import "../../env.js";
import { searchBarcodeByName, lookupBarcode, extractBarcodeFromImage, findBarcode } from "../../src/services/barcodeLookupService.js";

async function comprehensiveTest() {
    console.log("╔══════════════════════════════════════════════════════════════╗");
    console.log("║      BARKOD SERVİSİ KAPSAMLI TEST - Phase 9                  ║");
    console.log("╚══════════════════════════════════════════════════════════════╝\n");
    
    const results: { test: string; status: string; details: string }[] = [];
    
    // =====================================================
    // TEST 1: UPCitemdb - Ürün Adı ile Arama
    // =====================================================
    console.log("📌 TEST 1: UPCitemdb - Ürün Adı ile Arama");
    console.log("-".repeat(50));
    
    const searchQueries = [
        "iPhone 15",
        "Samsung Galaxy S24",
        "AirPods Pro",
    ];
    
    for (const query of searchQueries) {
        console.log(`\n🔍 Aranıyor: "${query}"`);
        try {
            const result = await searchBarcodeByName(query);
            if (result?.barcode) {
                console.log(`   ✅ Barkod: ${result.barcode}`);
                console.log(`   📦 Ürün: ${result.product?.title?.substring(0, 50)}...`);
                console.log(`   🏷️  Marka: ${result.product?.brand || "-"}`);
                results.push({ test: `Search: ${query}`, status: "✅ BAŞARILI", details: result.barcode });
            } else {
                console.log(`   ⚠️ Sonuç bulunamadı (API limiti veya ürün yok)`);
                results.push({ test: `Search: ${query}`, status: "⚠️ Bulunamadı", details: "-" });
            }
        } catch (error) {
            console.log(`   ❌ Hata: ${error}`);
            results.push({ test: `Search: ${query}`, status: "❌ HATA", details: String(error) });
        }
    }
    
    // =====================================================
    // TEST 2: UPCitemdb - Barkod ile Ürün Bilgisi
    // =====================================================
    console.log("\n\n📌 TEST 2: UPCitemdb - Barkod ile Ürün Bilgisi");
    console.log("-".repeat(50));
    
    const barcodes = [
        { code: "0195949036583", expected: "iPhone 15" },
        { code: "0194252811917", expected: "AirPods" },
    ];
    
    for (const { code, expected } of barcodes) {
        console.log(`\n🔍 Barkod: ${code} (Beklenen: ${expected})`);
        try {
            const product = await lookupBarcode(code);
            if (product) {
                console.log(`   ✅ Bulundu: ${product.title?.substring(0, 50)}...`);
                console.log(`   🏷️  Marka: ${product.brand || "-"}`);
                results.push({ test: `Lookup: ${code}`, status: "✅ BAŞARILI", details: product.title?.substring(0, 30) || "-" });
            } else {
                console.log(`   ⚠️ Ürün bulunamadı`);
                results.push({ test: `Lookup: ${code}`, status: "⚠️ Bulunamadı", details: "-" });
            }
        } catch (error) {
            console.log(`   ❌ Hata: ${error}`);
            results.push({ test: `Lookup: ${code}`, status: "❌ HATA", details: String(error) });
        }
    }
    
    // =====================================================
    // TEST 3: ZXing - Görsel Barkod Okuma
    // =====================================================
    console.log("\n\n📌 TEST 3: ZXing - Görsel Barkod Okuma");
    console.log("-".repeat(50));
    
    // Test with a public barcode image
    const testImage = "https://upload.wikimedia.org/wikipedia/commons/e/e9/UPC-A-036000291452.svg";
    console.log(`\n🖼️  Test Görsel: Wikipedia barcode örneği`);
    
    try {
        const visualBarcode = await extractBarcodeFromImage(testImage);
        if (visualBarcode) {
            console.log(`   ✅ Okunan Barkod: ${visualBarcode}`);
            results.push({ test: "Visual: Wikipedia", status: "✅ BAŞARILI", details: visualBarcode });
        } else {
            console.log(`   ⚠️ Barkod okunamadı`);
            results.push({ test: "Visual: Wikipedia", status: "⚠️ Okunamadı", details: "-" });
        }
    } catch (error) {
        console.log(`   ❌ Hata: ${error}`);
        results.push({ test: "Visual: Wikipedia", status: "❌ HATA", details: String(error) });
    }
    
    // =====================================================
    // TEST 4: Birleşik findBarcode Metodu
    // =====================================================
    console.log("\n\n📌 TEST 4: Birleşik findBarcode Metodu");
    console.log("-".repeat(50));
    
    console.log(`\n🔍 findBarcode("Nintendo Switch")`);
    try {
        const unified = await findBarcode("Nintendo Switch");
        if (unified) {
            console.log(`   ✅ Kaynak: ${unified.source}`);
            console.log(`   📊 Barkod: ${unified.barcode}`);
            console.log(`   📦 Ürün: ${unified.product?.title?.substring(0, 40) || "-"}`);
            results.push({ test: "Unified: Nintendo", status: "✅ BAŞARILI", details: `${unified.source}: ${unified.barcode}` });
        } else {
            console.log(`   ⚠️ Barkod bulunamadı`);
            results.push({ test: "Unified: Nintendo", status: "⚠️ Bulunamadı", details: "-" });
        }
    } catch (error) {
        console.log(`   ❌ Hata: ${error}`);
        results.push({ test: "Unified: Nintendo", status: "❌ HATA", details: String(error) });
    }
    
    // =====================================================
    // ÖZET
    // =====================================================
    console.log("\n\n╔══════════════════════════════════════════════════════════════╗");
    console.log("║                         TEST ÖZETİ                            ║");
    console.log("╚══════════════════════════════════════════════════════════════╝\n");
    
    console.log("Test                          | Durum          | Detay");
    console.log("-".repeat(70));
    for (const r of results) {
        console.log(`${r.test.padEnd(29)} | ${r.status.padEnd(14)} | ${r.details.substring(0, 25)}`);
    }
    console.log("-".repeat(70));
    
    const successCount = results.filter(r => r.status.includes("BAŞARILI")).length;
    const totalCount = results.length;
    console.log(`\n📊 Başarı Oranı: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`);
    
    console.log("\n✨ Test tamamlandı!");
}

comprehensiveTest().catch(console.error);
