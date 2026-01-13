
import { googleSearchService } from "./services/googleSearchService.js";
import { logger } from "./logger.js";

async function run() {
    logger.info("--- VERIFICATION START ---");

    // 1. Trendyol Test
    const trendyolUrl = "https://www.trendyol.com/apple/iphone-13-128-gb-siyah-cep-telefonu-apple-turkiye-garantili-p-150058735";
    logger.info(`1. Testing Trendyol URL: ${trendyolUrl}`);
    try {
        const details = await googleSearchService.extractProductDetails(trendyolUrl);
        logger.info(`Extracted Snippet: ${details.snippet?.substring(0, 50)}...`);
        logger.info("Extracted Attributes", { attributes: details.attributes });

        if (details.attributes && Object.keys(details.attributes).length > 0) {
            logger.info("✅ TRENDYOL PASS: Attributes found.");
        } else {
            logger.error("❌ TRENDYOL FAIL: No attributes.");
        }
    } catch (e) {
        logger.error("Trendyol extraction error", { error: e });
    }

    // 2. Hepsiburada Test
    const hbUrl = "https://www.hepsiburada.com/samsung-galaxy-s23-256-gb-8-gb-ram-samsung-turkiye-garantili-siyah-pm-HBC00003P2GFX";
    logger.info(`2. Testing Hepsiburada URL: ${hbUrl}`);
    try {
        const details = await googleSearchService.extractProductDetails(hbUrl);
        logger.info("Extracted Attributes", { attributes: details.attributes });
        if (details.attributes && Object.keys(details.attributes).length > 0) {
            logger.info("✅ HEPSIBURADA PASS: Attributes found.");
        } else {
            logger.warn("⚠️ HEPSIBURADA WARNING: No attributes (Maybe regex needed).");
        }
    } catch (e) {
        logger.error("HB extraction error", { error: e });
    }

    logger.info("--- VERIFICATION END ---");
}

run().catch((e) => logger.error("Fatal error", { error: e }));
