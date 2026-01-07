
import { googleSearchService } from "./services/googleSearchService.js";

async function run() {
    console.log("--- VERIFICATION START ---");

    // 1. Trendyol Test
    const trendyolUrl = "https://www.trendyol.com/apple/iphone-13-128-gb-siyah-cep-telefonu-apple-turkiye-garantili-p-150058735";
    console.log("\n1. Testing Trendyol URL:", trendyolUrl);
    try {
        const details = await googleSearchService.extractProductDetails(trendyolUrl);
        console.log("Extracted Snippet:", details.snippet?.substring(0, 50) + "...");
        console.log("Extracted Attributes:", JSON.stringify(details.attributes, null, 2));

        if (details.attributes && Object.keys(details.attributes).length > 0) {
            console.log("✅ TRENDYOL PASS: Attributes found.");
        } else {
            console.error("❌ TRENDYOL FAIL: No attributes.");
        }
    } catch (e) {
        console.error("Trendyol extraction error:", e);
    }

    // 2. Hepsiburada Test
    const hbUrl = "https://www.hepsiburada.com/samsung-galaxy-s23-256-gb-8-gb-ram-samsung-turkiye-garantili-siyah-pm-HBC00003P2GFX";
    console.log("\n2. Testing Hepsiburada URL:", hbUrl);
    try {
        const details = await googleSearchService.extractProductDetails(hbUrl);
        console.log("Extracted Attributes:", JSON.stringify(details.attributes, null, 2));
        if (details.attributes && Object.keys(details.attributes).length > 0) {
            console.log("✅ HEPSIBURADA PASS: Attributes found.");
        } else {
            console.warn("⚠️ HEPSIBURADA WARNING: No attributes (Maybe regex needed).");
        }
    } catch (e) {
        console.error("HB extraction error:", e);
    }

    console.log("--- VERIFICATION END ---");
}

run().catch(console.error);
