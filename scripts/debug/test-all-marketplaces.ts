import "../../env.js";
import { unifiedMarketplaceSearch } from "../../src/services/unifiedMarketplaceSearch.js";
import { N11Adapter } from "../../src/services/search/adapters/n11Adapter.js";
import { HepsiburadaAPIAdapter } from "../../src/services/search/adapters/hepsiburadaAPIAdapter.js";
import { TrendyolAdapter } from "../../src/services/search/adapters/trendyolAdapter.js";
import { PazaramaAdapter } from "../../src/services/search/adapters/pazaramaAdapter.js";
import { CiceksepetiAdapter } from "../../src/services/search/adapters/ciceksepetiAdapter.js";
import { PttAVMAdapter } from "../../src/services/search/adapters/pttavmAdapter.js";

/**
 * Tüm pazaryerlerinden veri çekme yeteneklerini test eder
 */
async function testAllMarketplaces() {
    console.log("=".repeat(80));
    console.log("PAZARYERI VERİ ÇEKME YETENEKLERİ TESTİ");
    console.log("=".repeat(80));

    const searchQuery = "laptop";
    console.log(`\n🔍 Arama Sorgusu: "${searchQuery}"\n`);

    // Test edilecek adapter'lar
    const adapters = [
        { name: "N11", adapter: new N11Adapter(), type: "API" },
        { name: "Hepsiburada", adapter: new HepsiburadaAPIAdapter(), type: "API (Merchant Only)" },
        { name: "Trendyol", adapter: new TrendyolAdapter(), type: "Web Scraping" },
        { name: "Pazarama", adapter: new PazaramaAdapter(), type: "Web Scraping" },
        { name: "Çiçeksepeti", adapter: new CiceksepetiAdapter(), type: "Web Scraping" },
        { name: "PttAVM", adapter: new PttAVMAdapter(), type: "Web Scraping" }
    ];

    const results: any = {};

    // Her pazaryerini test et
    for (const { name, adapter, type } of adapters) {
        console.log(`\n${"─".repeat(80)}`);
        console.log(`📦 ${name} (${type})`);
        console.log(`${"─".repeat(80)}`);

        try {
            const startTime = Date.now();
            const items = await adapter.search(searchQuery);
            const duration = Date.now() - startTime;

            results[name] = {
                success: true,
                count: items.length,
                duration,
                items: items.slice(0, 3), // İlk 3 ürün
                type
            };

            if (items.length > 0) {
                console.log(`✅ ${items.length} ürün bulundu (${duration}ms)`);
                console.log(`\nİlk 3 Ürün:`);
                
                items.slice(0, 3).forEach((item, index) => {
                    console.log(`\n  ${index + 1}. ${item.title}`);
                    console.log(`     💰 Fiyat: ${item.price} ${item.currency}`);
                    console.log(`     🔗 URL: ${item.url}`);
                    console.log(`     🖼️  Görsel: ${item.imageUrl ? '✓' : '✗'}`);
                    console.log(`     📊 Barkod: ${item.barcode || '✗'}`);
                    console.log(`     ⭐ Rating: ${item.rating || '✗'}`);
                    console.log(`     💬 Yorumlar: ${item.reviewCount || '✗'}`);
                });

                // Veri kalitesi analizi
                console.log(`\n📊 Veri Kalitesi:`);
                const firstItem = items[0];
                const fields = {
                    'Başlık': !!firstItem.title,
                    'Fiyat': !!firstItem.price,
                    'URL': !!firstItem.url,
                    'Görsel': !!firstItem.imageUrl,
                    'Barkod': !!firstItem.barcode,
                    'Rating': !!firstItem.rating,
                    'Yorum Sayısı': !!firstItem.reviewCount
                };

                Object.entries(fields).forEach(([field, hasValue]) => {
                    console.log(`     ${hasValue ? '✅' : '❌'} ${field}`);
                });

            } else {
                console.log(`⚠️  Ürün bulunamadı`);
            }

        } catch (error: any) {
            results[name] = {
                success: false,
                error: error.message,
                type
            };
            console.log(`❌ Hata: ${error.message}`);
        }
    }

    // Özet rapor
    console.log(`\n${"=".repeat(80)}`);
    console.log(`📊 ÖZET RAPOR`);
    console.log(`${"=".repeat(80)}\n`);

    console.log(`Arama Sorgusu: "${searchQuery}"\n`);

    // Başarı oranları
    const successCount = Object.values(results).filter((r: any) => r.success).length;
    const totalCount = Object.keys(results).length;
    console.log(`✅ Başarılı: ${successCount}/${totalCount} pazaryeri`);
    console.log(`❌ Başarısız: ${totalCount - successCount}/${totalCount} pazaryeri\n`);

    // Pazaryeri bazında sonuçlar
    console.log(`Pazaryeri Bazında Sonuçlar:`);
    console.log(`${"─".repeat(80)}`);
    console.log(`${'Pazaryeri'.padEnd(20)} | ${'Yöntem'.padEnd(25)} | ${'Durum'.padEnd(10)} | ${'Ürün'.padEnd(8)} | ${'Süre'}`);
    console.log(`${"─".repeat(80)}`);

    Object.entries(results).forEach(([name, result]: [string, any]) => {
        const status = result.success ? '✅ Başarılı' : '❌ Hata';
        const count = result.success ? result.count : '-';
        const duration = result.success ? `${result.duration}ms` : '-';
        console.log(`${name.padEnd(20)} | ${result.type.padEnd(25)} | ${status.padEnd(10)} | ${String(count).padEnd(8)} | ${duration}`);
    });

    // Veri alanları karşılaştırması
    console.log(`\n${"─".repeat(80)}`);
    console.log(`Veri Alanları Karşılaştırması:`);
    console.log(`${"─".repeat(80)}`);

    const dataFields = ['Başlık', 'Fiyat', 'URL', 'Görsel', 'Barkod', 'Rating', 'Yorumlar'];
    console.log(`${'Alan'.padEnd(15)} | ${Object.keys(results).map(n => n.substring(0, 8).padEnd(8)).join(' | ')}`);
    console.log(`${"─".repeat(80)}`);

    dataFields.forEach(field => {
        const fieldKey = {
            'Başlık': 'title',
            'Fiyat': 'price',
            'URL': 'url',
            'Görsel': 'imageUrl',
            'Barkod': 'barcode',
            'Rating': 'rating',
            'Yorumlar': 'reviewCount'
        }[field];

        const values = Object.entries(results).map(([name, result]: [string, any]) => {
            if (!result.success || !result.items || result.items.length === 0) return '  -  ';
            const hasField = result.items[0][fieldKey!];
            return hasField ? '  ✅  ' : '  ❌  ';
        });

        console.log(`${field.padEnd(15)} | ${values.join(' | ')}`);
    });

    // Öneriler
    console.log(`\n${"=".repeat(80)}`);
    console.log(`💡 ÖNERİLER VE SONUÇ`);
    console.log(`${"=".repeat(80)}\n`);

    console.log(`✅ ŞU AN YAPABİLECEKLERİNİZ:`);
    console.log(`   • Temel ürün araması (başlık, fiyat, görsel, URL)`);
    console.log(`   • Fiyat karşılaştırma`);
    console.log(`   • Ürün listeleme ve görüntüleme\n`);

    console.log(`❌ ŞU AN YAPAMAYACAKLARINİZ:`);
    console.log(`   • Detaylı ürün bilgisi (açıklama, özellikler, marka)`);
    console.log(`   • Stok kontrolü`);
    console.log(`   • Kullanıcı değerlendirmeleri ve yorumlar`);
    console.log(`   • Satıcı bilgisi`);
    console.log(`   • Kargo detayları (teslimat süresi, ücret)\n`);

    console.log(`🎯 ÖNCELİKLİ AKSİYONLAR:`);
    console.log(`   1. Ürün detay sayfası scraping'i ekleyin`);
    console.log(`   2. N11 API'den daha fazla alan çekin`);
    console.log(`   3. Cache mekanizması kurun (Redis)`);
    console.log(`   4. Trendyol ve Pazarama API entegrasyonları\n`);

    console.log(`📄 Detaylı analiz için: marketplace_data_analysis.md dosyasına bakın\n`);

    console.log(`${"=".repeat(80)}`);
    console.log(`TEST TAMAMLANDI`);
    console.log(`${"=".repeat(80)}\n`);
}

// Test'i çalıştır
testAllMarketplaces().catch(console.error);
