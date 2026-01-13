import "../../env.js";
import { marketplaceNormalizer } from "../../src/services/ai/marketplaceNormalizer.js";

async function testNormalization() {
    console.log("--- AI Normalizasyon ve Tekilleştirme Testi ---");

    const mockResults = [
        {
            title: "Apple iPhone 15 128 GB Siyah",
            price: 50000,
            site: "Trendyol",
            barcode: "123456789",
            attributes: { "Renk": "Siyah", "Hafıza": "128GB" }
        },
        {
            title: "iPhone 15 128GB Black - Apple Türkiye Garantili",
            price: 51000,
            site: "Hepsiburada",
            barcode: "123456789",
            attributes: { "Color": "Black", "Internal Storage": "128 GB" }
        },
        {
            title: "Samsung Galaxy S23 256GB Ghost White",
            price: 35000,
            site: "N11",
            barcode: "987654321",
            attributes: { "Renk": "Beyaz", "Kapasite": "256GB" }
        }
    ];

    console.log("\n1. Tekilleştirme Testi (Aynı Barkoda Sahip Ürünler)...");
    const deduped = await marketplaceNormalizer.deduplicateResults(mockResults);
    console.log(`Giriş: ${mockResults.length} ürün, Çıkış: ${deduped.length} ürün.`);
    
    console.log("\n2. Normalizasyon Testi (Gemini ile Temizleme)...");
    const normalized = await marketplaceNormalizer.normalizeProduct(deduped[0]);
    console.log("Orijinal Başlık:", deduped[0].title);
    console.log("Normalize Başlık:", normalized.title);
    console.log("Normalize Öznitelikler:", JSON.stringify(normalized.attributes, null, 2));

}

testNormalization();
