import { pricingIntelligenceService } from "../../src/services/ai/pricingIntelligenceService.js";
import { getMarketplaceProvider } from "../../src/services/marketplace/index.js";
import { query } from "../../src/db.js";
import { logger } from "../../src/logger.js";

async function testLivePricing() {
    console.log("=== Testing Live AI Pricing Loop ===");

    // 1. Pick a test product from DB
    const [product] = await query<any[]>("SELECT barcode, name, price, cost_price FROM products LIMIT 1");
    if (!product) {
        console.error("No products found in DB for testing.");
        return;
    }

    console.log(`\n1. Target Product: ${product.name} (${product.barcode})`);
    console.log(`Current Price: ${product.price}, Cost: ${product.cost_price}`);

    // 2. Run AI Analysis
    console.log("\n2. Running AI Buy-Box Analysis...");
    const analysisRes = await pricingIntelligenceService.analyzeBuyBoxStatus(product.barcode);
    
    if (!analysisRes.ok) {
        console.error("Analysis failed:", analysisRes.error);
        return;
    }

    const analysis = analysisRes.value;
    console.log("--- Analysis Results ---");
    console.log(`Suggested Price: ${analysis.suggestedPrice}`);
    console.log(`Strategy: ${analysis.strategy}`);
    console.log(`AI Insight: ${analysis.aiInsight}`);
    console.log("------------------------");

    // 3. Trigger Live Update (Simulated for this test or Real if configured)
    console.log("\n3. Triggering Marketplace Price Update...");
    const marketplace = "Trendyol"; // Example
    const provider = getMarketplaceProvider(marketplace);
    
    if (!provider) {
        console.error(`Provider not found: ${marketplace}`);
        return;
    }

    console.log(`Provider Mode: ${provider.getConfigStatus().mode}`);

    // We use a small adjustment to avoid real damaging changes if live
    const testPrice = analysis.suggestedPrice > 0 ? analysis.suggestedPrice : product.price + 0.01;
    
    console.log(`Updating ${marketplace} listing for ${product.barcode} to ${testPrice}...`);
    
    const updateRes = await provider.updateListing({
        barcode: product.barcode,
        price: testPrice
    });

    if (updateRes.ok) {
        console.log("✅ Update SUCCESSFUL!");
        console.log("Response:", updateRes.value);
    } else {
        console.error("❌ Update FAILED!");
        console.error("Error:", updateRes.error);
    }
}

testLivePricing().catch(console.error);
