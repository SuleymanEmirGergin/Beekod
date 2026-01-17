import { runVirtualTryOn } from "../../src/services/wiroService.js";
import fs from "fs";

async function testVtoBase64() {
    const humanPath = "C:/Users/emirg/.gemini/antigravity/brain/2f4f53c8-022a-4405-b4e7-4e5b002e34ee/uploaded_image_1767829082756.jpg";
    const clothesPath = "C:/Users/emirg/.gemini/antigravity/brain/2f4f53c8-022a-4405-b4e7-4e5b002e34ee/uploaded_image_1_1767828437806.png";

    const humanBase64 = `data:image/jpeg;base64,${fs.readFileSync(humanPath, { encoding: 'base64' })}`;
    const clothesBase64 = `data:image/png;base64,${fs.readFileSync(clothesPath, { encoding: 'base64' })}`;

    console.log("Starting real VTO request with NEW human image and Base64...");
    try {
        const result = await runVirtualTryOn(humanBase64, clothesBase64);
        console.log("VTO_RESULT_START");
        console.log(JSON.stringify(result));
        console.log("VTO_RESULT_END");
    } catch (err) {
        console.error("VTO_ERROR:", err);
    }
}

testVtoBase64();
