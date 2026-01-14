/**
 * AI Services Test
 * Wiro AI (Chat) ve Fal.ai (VTO/Video) test eder
 */

import "dotenv/config";

async function testWiroChat() {
    console.log("\n🔵 Wiro AI (Gemini) Test...");
    
    try {
        const { runChatCompletion, isConfigured } = await import("../../src/services/geminiService.js");
        
        if (!isConfigured()) {
            console.log("❌ WIRO_API_KEY tanımlı değil!");
            return false;
        }
        
        console.log("   ✅ WIRO_API_KEY mevcut");
        
        const response = await runChatCompletion("Merhaba! Sadece 'Test başarılı' yaz.", {
            temperature: 0.5,
            maxOutputTokens: 100
        });
        
        const responseText = response || "";
        console.log(`   ✅ Cevap: "${responseText.substring(0, 50)}${responseText.length > 50 ? '...' : ''}"`);
        return true;
    } catch (error) {
        console.log(`   ❌ Hata: ${error}`);
        return false;
    }
}

async function testFalImage() {
    console.log("\n🟣 Fal.ai (FLUX Image) Test...");
    
    try {
        if (!process.env.FAL_KEY) {
            console.log("❌ FAL_KEY tanımlı değil!");
            return false;
        }
        
        console.log("   ✅ FAL_KEY mevcut");
        
        const { getFalImageProvider } = await import("../../src/ai/providers/index.js");
        const provider = getFalImageProvider();
        
        // Just check if provider is initialized, don't actually generate (costs credits)
        console.log(`   ✅ FalImageProvider hazır: ${provider.name}`);
        return true;
    } catch (error) {
        console.log(`   ❌ Hata: ${error}`);
        return false;
    }
}

async function testFalTryOn() {
    console.log("\n🟢 Fal.ai (IDM-VTON) Test...");
    
    try {
        if (!process.env.FAL_KEY) {
            console.log("❌ FAL_KEY tanımlı değil!");
            return false;
        }
        
        const { getFalTryOnProvider } = await import("../../src/ai/providers/index.js");
        const provider = getFalTryOnProvider();
        
        console.log(`   ✅ FalTryOnProvider hazır: ${provider.name}`);
        return true;
    } catch (error) {
        console.log(`   ❌ Hata: ${error}`);
        return false;
    }
}

async function testFalVideo() {
    console.log("\n🟠 Fal.ai (Kling Video) Test...");
    
    try {
        if (!process.env.FAL_KEY) {
            console.log("❌ FAL_KEY tanımlı değil!");
            return false;
        }
        
        const { getFalVideoProvider } = await import("../../src/ai/providers/index.js");
        const provider = getFalVideoProvider();
        
        console.log(`   ✅ FalVideoProvider hazır: ${provider.name}`);
        return true;
    } catch (error) {
        console.log(`   ❌ Hata: ${error}`);
        return false;
    }
}

async function main() {
    console.log("═══════════════════════════════════════");
    console.log("   🧪 AI Services Test");
    console.log("═══════════════════════════════════════");
    
    const results = {
        wiro: await testWiroChat(),
        falImage: await testFalImage(),
        falTryOn: await testFalTryOn(),
        falVideo: await testFalVideo(),
    };
    
    console.log("\n═══════════════════════════════════════");
    console.log("   📊 Sonuçlar");
    console.log("═══════════════════════════════════════");
    console.log(`   Wiro AI (Chat):     ${results.wiro ? "✅ OK" : "❌ FAIL"}`);
    console.log(`   Fal.ai (Image):     ${results.falImage ? "✅ OK" : "❌ FAIL"}`);
    console.log(`   Fal.ai (Try-On):    ${results.falTryOn ? "✅ OK" : "❌ FAIL"}`);
    console.log(`   Fal.ai (Video):     ${results.falVideo ? "✅ OK" : "❌ FAIL"}`);
    console.log("═══════════════════════════════════════\n");
    
    const allPassed = Object.values(results).every(r => r);
    process.exit(allPassed ? 0 : 1);
}

main();
