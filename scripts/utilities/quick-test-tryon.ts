/**
 * Quick Test Script for Virtual Try-On with Nano Banana
 * 
 * Test farklı kategorilerle:
 *   npx tsx scripts/quick-test-tryon.ts
 */

import 'dotenv/config';
import { generateVirtualTryOn } from '../src/services/virtualTryOnService.js';

async function testTryOn() {
    console.log('🍌 Nano Banana Virtual Try-On Test\n');

    // Test görselleri - kendi URL'lerinizle değiştirin
    const tests = [
        {
            name: 'T-Shirt Testi',
            clothing: 'https://cdn.dsmcdn.com/ty1/product/media/images/prod/SPM/PIM/20250101/15/5a1d4b9e-3c7a-34e5-8e2e-9e8faadf5e8c/1_org.jpg',
            model: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800',
            category: 'upper_body' as const
        }
    ];

    for (const test of tests) {
        console.log(`\n📸 ${test.name}`);
        console.log(`   Kıyafet: ${test.clothing.substring(0, 50)}...`);
        console.log(`   Model: ${test.model.substring(0, 50)}...`);
        console.log(`   Kategori: ${test.category}\n`);

        try {
            const result = await generateVirtualTryOn(
                test.clothing,
                test.model,
                test.category
            );

            if (result) {
                console.log(`✅ Başarılı!`);
                console.log(`   Sonuç: ${result.imageUrl}\n`);
            } else {
                console.log(`⚠️  Görsel oluşturulamadı (Gemini şu anda sadece metin döndürüyor)`);
                console.log(`   📝 Açıklama için loglara bakın\n`);
            }
        } catch (error) {
            console.error(`❌ Hata: ${error instanceof Error ? error.message : String(error)}\n`);
        }
    }

    console.log('\n💡 Not:');
    console.log('   - Gemini API şu anda görsel değil metin açıklaması döndürüyor');
    console.log('   - Gerçek görsel için Imagen API entegrasyonu gerekli');
}

testTryOn();
