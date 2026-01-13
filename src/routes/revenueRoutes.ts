import { Router } from "express";
import { generateDynamicPricingAI } from "../services/pricingService.js";
import { predictCustomerLTV, getBundleSuggestions, getRevenueInsights } from "../services/order/revenueService.js";
import { logger } from "../logger.js";
import { getAllProducts } from '../services/product/productService.js';
import { Locale } from "../types.js";

const router = Router();

/**
 * GET /api/revenue/dynamic-pricing
 * Returns AI-driven pricing recommendations for all products
 */
router.get("/dynamic-pricing", async (req, res) => {
  try {
    const productsResult = await getAllProducts(50); // Reduced limit for stability
    const products = productsResult.ok ? productsResult.value : [];
    const recommendations: { barcode: string; name: string; stock: number; suggestedPrice?: number; currentPrice?: number }[] = [];

    // Process in small batches of 5 to prevent rate limits and DB pool exhaustion
    const BATCH_SIZE = 5;
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (p) => {
          try {
            const suggestion = await generateDynamicPricingAI(p.barcode);
            if (!suggestion) return null;
            return {
              barcode: p.barcode,
              name: p.name,
              stock: p.stock,
              ...suggestion,
            };
          } catch (err) {
            logger.error("revenue.pricing_product_failed", { barcode: p.barcode, err });
            return null;
          }
        }),
      );
      recommendations.push(...batchResults.filter((r) => r !== null));
    }

    res.json({
      success: true,
      recommendations: recommendations.filter((r) => r.suggestedPrice !== r.currentPrice),
    });
  } catch (error) {
    logger.error("revenue.pricing_route_failed", { err: error });
    res.status(500).json({ success: false, error: "Fiyat önerileri alınamadı." });
  }
});

/**
 * GET /api/revenue/ltv
 * Returns Customer Lifetime Value analysis
 */
router.get("/ltv", async (req, res) => {
  try {
    const ltvData = await predictCustomerLTV();
    res.json({
      success: true,
      customers: ltvData,
    });
  } catch (error) {
    logger.error("revenue.ltv_route_failed", { err: error });
    res.status(500).json({ success: false, error: "Müşteri değeri analizi alınamadı." });
  }
});

/**
 * GET /api/revenue/bundles
 * Returns product bundle suggestions
 */
router.get("/bundles", async (req, res) => {
  try {
    const bundles = await getBundleSuggestions();
    res.json({
      success: true,
      bundles,
    });
  } catch (error) {
    logger.error("revenue.bundles_route_failed", { err: error });
    res.status(500).json({ success: false, error: "Paket önerileri alınamadı." });
  }
});

/**
 * GET /api/revenue/insights
 * Returns AI-driven revenue insights
 */
router.get("/insights", async (req, res) => {
  try {
    const locale = (req.query.locale as Locale) || "tr";
    const insights = await getRevenueInsights(locale);
    res.json({
      success: true,
      insights,
    });
  } catch (error) {
    logger.error("revenue.insights_route_failed", { err: error });
    res.status(500).json({ success: false, error: "Gelir öngörüleri alınamadı." });
  }
});

export { router as revenueRouter };
