import "dotenv/config";
import { falVideoProvider } from "./src/ai/providers/FalVideoProvider.js";

async function testVideo() {
    console.log("🎬 Testing Fal.ai (Kling 1.5 Pro) Integration...");
    
    if (!process.env.FAL_KEY) {
        console.error("❌ FAL_KEY is missing in .env! Please add it to run this test.");
        process.exit(1);
    }

    // A reliable static image for testing (placeholder fashion image)
    const testImage = "https://storage.googleapis.com/falserverless/model_tests/fashion_test.jpg";
    const prompt = "A cinematic shot of a fashion model walking on a runway, high quality, 4k, realistic texture";

    try {
        console.log("🚀 Sending request to Kling AI...");
        const result = await falVideoProvider.generateVideo(testImage, prompt);
        console.log("\n✅ Video Generated Successfully!");
        console.log("📹 Video URL:", result.videoUrl);
        console.log("🖼️ Cover URL:", result.coverUrl);
    } catch (error: any) {
        console.error("\n❌ Error:", error.message);
    }
}

testVideo();
