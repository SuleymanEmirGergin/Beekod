/**
 * Test script for Virtual Try-On service using Nano Banana (Gemini API)
 * 
 * Usage:
 *   npx tsx scripts/test-virtual-tryon.ts
 */

import 'dotenv/config';
import { generateVirtualTryOn } from '../src/services/virtualTryOnService.js';
import { logger } from '../src/logger.js';

async function main() {
    console.log('🧪 Testing Virtual Try-On with Nano Banana (Gemini API)\n');

    // Test image URLs - Using publicly accessible test images
    // Clothing: T-shirt from Unsplash
    const clothingImageUrl = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400';
    // Model: Person from Unsplash
    const modelImageUrl = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400';

    console.log('📸 Test Configuration:');
    console.log(`   Clothing Image: ${clothingImageUrl}`);
    console.log(`   Model Image: ${modelImageUrl}`);
    console.log(`   Category: upper_body\n`);

    try {
        console.log('🚀 Generating virtual try-on...\n');

        const result = await generateVirtualTryOn(
            clothingImageUrl,
            modelImageUrl,
            'upper_body'
        );

        if (result) {
            console.log('✅ Success!');
            console.log(`   Result Image URL: ${result.imageUrl}\n`);
        } else {
            console.log('⚠️  No image generated (Gemini returned text-only response)');
            console.log('   Check logs for the description.\n');
            console.log('💡 Next Steps:');
            console.log('   - Consider integrating Google Imagen API');
            console.log('   - Or use another image generation service\n');
        }
    } catch (error) {
        console.error('❌ Error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

main();
