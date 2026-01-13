import "dotenv/config";
import { 
    generateAIModel, 
    runVirtualTryOn, 
    generateProductVideo 
} from "./src/services/visualIntelligenceService.js";

async function testFullPipeline() {
    console.log("🎨 Testing Full Visual Intelligence Pipeline (Fal.ai)...\n");

    if (!process.env.FAL_KEY) {
        console.error("❌ FAL_KEY is missing! Please add it to .env");
        process.exit(1);
    }

    try {
        // 1. Generate Model (FLUX)
        console.log("1️⃣  Generating AI Model (FLUX.1 [dev])...");
        const modelPrompt = "Studio portrait of a stylish young man wearing a white t-shirt, neutral background, 8k, photorealistic";
        const modelUrl = await generateAIModel(modelPrompt);
        console.log("   ✅ Model Generated:", modelUrl);

        // 2. Virtual Try-On (IDM-VTON)
        console.log("\n2️⃣  Running Virtual Try-On (IDM-VTON)...");
        // Using a sample cloth image (e.g. a blue jacket)
        const sampleCloth = "https://storage.googleapis.com/falserverless/model_tests/jacket_sample.jpg"; 
        
        const tryOnUrl = await runVirtualTryOn(modelUrl, sampleCloth, "tops");
        console.log("   ✅ Try-On Result:", tryOnUrl);

        // 3. Generate Video (Kling AI)
        console.log("\n3️⃣  Animating Result (Kling 1.5 Pro)...");
        const videoRes = await generateProductVideo(tryOnUrl, "Man posing and smiling slightly, realistic movement");
        console.log("   ✅ Video Generated:", videoRes.videoUrl);

        console.log("\n✨ PIPELINE SUCCESS! ✨");

    } catch (error: any) {
        console.error("\n❌ Pipeline Failed:", error.message);
        console.error("Details:", error);
    }
}

testFullPipeline();
