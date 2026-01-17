import { logger } from "../logger.js";
import { repricerService } from "../services/ai/repricerService.js";
import { RepricingConfig, PricingStrategy } from "../types.js";
// Mock DB for config (In real app, fetch from DB)
import { getAllProducts } from "../services/product/productService.js";

export async function runRepricerJob() {
  logger.info("job.repricer.start");

  try {
    // 1. Fetch enabled configs (Mocking this part as we haven't modified DB schema yet)
    // We will assume all products have a default config for demonstration
    const productsRes = await getAllProducts(50); // Process top 50
    if (!productsRes.ok) return;

    const products = productsRes.value;

    for (const product of products) {
      // Mock Config: Try to beat competitor, but never go below cost + 10%
      const minPrice = (product.cost_price || product.price * 0.5) * 1.10;
      const maxPrice = product.price * 2.0;

      const config: RepricingConfig = {
        barcode: product.barcode,
        enabled: true,
        min_price: minPrice,
        max_price: maxPrice,
        strategy: PricingStrategy.BEAT_COMPETITOR,
        beat_amount: 0.50, // 50 kurus below
        target_margin: 0.15
      };

      // Run Repricer
      const result = await repricerService.executeRepricing(product.barcode, config);
      
      if (result.ok && result.value.action === 'UPDATED') {
        logger.info(`Repriced ${product.name}: ${result.value.oldPrice} -> ${result.value.newPrice}`);
      }
    }

  } catch (error) {
    logger.error("job.repricer.error", { error });
  }

  logger.info("job.repricer.end");
}
