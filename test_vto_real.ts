import { runVirtualTryOn } from "./src/services/wiroService.js";
import { logger } from "./src/logger.js";

async function testVto() {
    const humanImage = "C:/Users/emirg/.gemini/antigravity/brain/2f4f53c8-022a-4405-b4e7-4e5b002e34ee/uploaded_image_0_1767828437806.jpg";
    const clothingImage = "C:/Users/emirg/.gemini/antigravity/brain/2f4f53c8-022a-4405-b4e7-4e5b002e34ee/uploaded_image_1_1767828437806.png";

    console.log("Starting real VTO request...");
    try {
        const result = await runVirtualTryOn(humanImage, clothingImage);
        console.log("VTO_RESULT_START");
        console.log(JSON.stringify(result));
        console.log("VTO_RESULT_END");
    } catch (err) {
        console.error("VTO_ERROR:", err);
    }
}

testVto();
