import "dotenv/config";
import { pricingIntelligenceService } from "../../src/services/ai/pricingIntelligenceService.js";
import { inventoryAuditService } from "../../src/services/ai/inventoryAuditService.js";
import { logger } from "../../src/logger.js";
import { query } from "../../src/db.js";

async function runTest() {
  console.log("=== Phase 5: Operational Intelligence Test ===\n");

  try {
    // 1. Get a sample product barcode from DB
    const sampleProduct = await query<any[]>("SELECT barcode, name FROM products LIMIT 1");
    if (!sampleProduct[0]) {
      console.error("No products found in DB. Please add a product first.");
      return;
    }
    const barcode = sampleProduct[0].barcode;
    console.log(`Testing with product: ${sampleProduct[0].name} (${barcode})\n`);

    // 2. Test Pricing Intelligence
    console.log("--- [1] Pricing Intelligence (Buy-Box Analysis) ---");
    const pricingRes = await pricingIntelligenceService.analyzeBuyBoxStatus(barcode);
    if (pricingRes.ok) {
      const p = pricingRes.value;
      console.log(`Current Price: ${p.myPrice}`);
      console.log(`Lowest Comp : ${p.lowestCompetitorPrice}`);
      console.log(`Is Lowest   : ${p.isLowest}`);
      console.log(`Suggest Price: ${p.suggestedPrice}`);
      console.log(`Strategy    : ${p.strategy}`);
      console.log(`AI Insight  : ${p.aiInsight}\n`);
    } else {
      console.error("Pricing Analysis Failed:", pricingRes.error.message);
    }

    // 3. Test Inventory Audit
    console.log("--- [2] Inventory Audit (Consistency Check) ---");
    const auditRes = await inventoryAuditService.auditStockConsistency(barcode);
    if (auditRes.ok) {
      const a = auditRes.value;
      console.log(`Central Stock: ${a.centralStock}`);
      console.log(`Total MP Stock: ${a.totalMarketplaceStock}`);
      console.log(`Status        : ${a.status}`);
      console.log(`Recommendation: ${a.recommendation}\n`);
    } else {
      console.error("Inventory Audit Failed:", auditRes.error.message);
    }

    // 4. Test Over-Selling Risk Detection
    console.log("--- [3] Global Over-Selling Risk Detection ---");
    const riskRes = await inventoryAuditService.detectOverSellingRisks();
    if (riskRes.ok) {
      console.log(`Found ${riskRes.value.length} products with risk.`);
      riskRes.value.forEach((r, i) => {
        console.log(`${i+1}. ${r.productName} (${r.barcode}): MP Stock ${r.totalMarketplaceStock} > Central ${r.centralStock}`);
      });
    } else {
      console.error("Risk Detection Failed:", riskRes.error.message);
    }

  } catch (error) {
    console.error("Test execution failed:", error);
  } finally {
    process.exit(0);
  }
}

runTest();
