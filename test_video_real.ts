import { runImageToVideo } from "./src/services/wiroService.js";
import fs from "fs";

async function testVideo() {
    const inputImagePath = "C:/Users/emirg/.gemini/antigravity/brain/2f4f53c8-022a-4405-b4e7-4e5b002e34ee/uploaded_image_1_1767828437806.png";
    const prompt = "Cinematic product reveal, blue hoodie, vibrant lightning, detailed textures, 4k high quality.";

    console.log("Starting real Video request...");
    try {
        const result = await runImageToVideo(inputImagePath, prompt);
        console.log("VIDEO_RESULT_START");
        console.log(JSON.stringify(result));
        console.log("VIDEO_RESULT_END");
    } catch (err) {
        console.error("VIDEO_ERROR:", err);
    }
}

testVideo();
