import { generateVideoScript } from "./src/services/videoService.js";
import { logger } from "./src/logger.js";

async function generateTestScript() {
    const dummyProduct = {
        name: "Electric Blue Premium Hoodie",
        barcode: "TEST-HOODIE-001",
        price: 899,
        stock: 50,
        currency: "TRY",
        description: "Soft cotton blend, vibrant electric blue color, premium stitching, oversized fit.",
        category: "Clothing"
    };

    console.log("Generating Director Script...");
    try {
        const script = await generateVideoScript(dummyProduct as any, "energetic", "Instagram Reels");
        console.log("SCRIPT_RESULT_START");
        console.log(JSON.stringify(script));
        console.log("SCRIPT_RESULT_END");
    } catch (err) {
        console.error("SCRIPT_ERROR:", err);
    }
}

generateTestScript();
