import { Router } from "express";
import { requireAdminKey } from "../middleware/adminKey.js";
import { logger } from "../logger.js";
import { cacheMiddleware } from "../services/product/cacheService.js";
import {
  getDashboardStats,
  getProductPerformance,
  getRevenueTimeline,
  getProfitMargins,
  getInventoryHealth,
  getMarketplacePerformance,
  getInventoryForecast
} from "../services/analyticsService.js";
import { generateFinancialInsights } from "../services/financialService.js";
import { profitCalculationService } from "../services/profitCalculationService.js";

const router = Router();

// Cache for 30 seconds (dashboard stats change frequently)
router.get("/dashboard", requireAdminKey, cacheMiddleware(30), async (req, res) => {
  try {
    const stats = await getDashboardStats();
    res.json({ status: "ok", ...stats });
  } catch (error) {
    logger.error("analytics.dashboard_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "dashboard_stats_failed" });
  }
});

// Alias for frontend compatibility
router.get("/dashboard-stats", requireAdminKey, cacheMiddleware(30), async (req, res) => {
  try {
    const stats = await getDashboardStats();
    res.json(stats);
  } catch (error) {
    logger.error("analytics.dashboard_stats_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "dashboard_stats_failed" });
  }
});

router.get("/sales-report", requireAdminKey, async (req, res) => {
  try {
    const stats = await getDashboardStats();
    res.json({
      totalSales: stats.topPerformers.reduce((sum, p) => sum + p.totalSales, 0),
      totalRevenue: stats.totalRevenue,
      averageOrderValue:
        stats.totalRevenue /
        Math.max(
          stats.topPerformers.reduce((sum, p) => sum + p.totalSales, 0),
          1,
        ),
      topProducts: stats.topPerformers,
    });
  } catch (error) {
    logger.error("analytics.sales_report_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "sales_report_failed" });
  }
});

// GET /api/analytics/top-sellers?range=30d&limit=5
router.get("/top-sellers", requireAdminKey, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const range = (req.query.range as string) || "30d";

    const stats = await getDashboardStats();
    const topSellers = stats.topPerformers.slice(0, limit).map((p: any) => ({
      barcode: p.barcode,
      name: p.name,
      totalSales: p.totalSales,
      revenue: p.revenue || 0,
      stock: p.stock || 0,
    }));

    res.json({
      success: true,
      range,
      limit,
      products: topSellers,
    });
  } catch (error) {
    logger.error("analytics.top_sellers_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "top_sellers_failed", success: false });
  }
});

router.get("/analytics/products/:barcode", requireAdminKey, async (req, res) => {
  const barcode = req.params.barcode?.trim();

  if (!barcode) {
    return res.status(400).json({ error: "barcode_required" });
  }

  try {
    const performance = await getProductPerformance(barcode);

    if (!performance) {
      return res.status(404).json({ error: "product_not_found" });
    }

    res.json({ status: "ok", performance });
  } catch (error) {
    logger.error("analytics.product_performance_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "product_performance_failed" });
  }
});

router.get("/ai-insights", requireAdminKey, async (req, res) => {
  try {
    const insights = await generateFinancialInsights();
    res.json({ status: "ok", insights });
  } catch (error) {
    logger.error("analytics.ai_insights_failed", { err: error });
    res.status(500).json({ error: "ai_insights_failed" });
  }
});

router.get("/forecasting", requireAdminKey, async (req, res) => {
  try {
    const forecast = await getInventoryForecast();
    res.json({ status: "ok", forecast });
  } catch (error) {
    logger.error("analytics.forecasting_failed", { err: error });
    res.status(500).json({ error: "forecasting_failed" });
  }
});

router.get("/revenue-timeline", requireAdminKey, async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const timeline = await getRevenueTimeline(days);
    res.json({ status: "ok", timeline });
  } catch (error) {
    logger.error("analytics.revenue_timeline_failed", { err: error });
    res.status(500).json({ error: "revenue_timeline_failed" });
  }
});

router.get("/profit-margins", requireAdminKey, async (req, res) => {
  try {
    const margins = await getProfitMargins();
    res.json({ status: "ok", margins });
  } catch (error) {
    logger.error("analytics.profit_margins_failed", { err: error });
    res.status(500).json({ error: "profit_margins_failed" });
  }
});

router.get("/inventory-health", requireAdminKey, async (req, res) => {
  try {
    const health = await getInventoryHealth();
    res.json({ status: "ok", health });
  } catch (error) {
    logger.error("analytics.inventory_health_failed", { err: error });
    res.status(500).json({ error: "inventory_health_failed" });
  }
});

router.get("/marketplace-performance", requireAdminKey, async (req, res) => {
  try {
    const performance = await getMarketplacePerformance();
    res.json({ status: "ok", performance });
  } catch (error) {
    logger.error("analytics.marketplace_performance_failed", { err: error });
    res.status(500).json({ error: "marketplace_performance_failed" });
  }
});

// Top sellers endpoint
router.get("/top-sellers", requireAdminKey, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const { getTopSellers } = await import("../services/analyticsService.js");
    const topSellers = await getTopSellers(limit);
    res.json({ status: "ok", topSellers });
  } catch (error) {
    logger.error("analytics.top_sellers_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "top_sellers_failed" });
  }
});

// Product search endpoint
router.get("/search-products", requireAdminKey, async (req, res) => {
  try {
    const searchTerm = (req.query.q as string) || "";
    const limit = parseInt(req.query.limit as string) || 10;
    const { searchProducts } = await import("../services/analyticsService.js");
    const products = await searchProducts(searchTerm, limit);
    res.json({ status: "ok", products });
  } catch (error) {
    logger.error("analytics.search_products_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "search_products_failed" });
  }
});

// Product sales detail endpoint
router.get("/product-sales/:productId", requireAdminKey, async (req, res) => {
  try {
    const productId = req.params.productId;
    const { getProductSalesDetail } = await import("../services/analyticsService.js");
    const detail = await getProductSalesDetail(productId);

    if (!detail) {
      return res.status(404).json({ error: "product_not_found" });
    }

    res.json({ status: "ok", detail });
  } catch (error) {
    logger.error("analytics.product_sales_detail_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "product_sales_detail_failed" });
  }
});

// Phase 11: Top profitable products
router.get("/top-profitable", requireAdminKey, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const days = parseInt(req.query.days as string) || 30;
    const products = await profitCalculationService.getMostProfitable(limit, days);
    res.json({ status: "ok", products });
  } catch (error) {
    logger.error("analytics.top_profitable_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "top_profitable_failed" });
  }
});

// Phase 11: Profit summary
router.get("/profit-summary", requireAdminKey, async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const summary = await profitCalculationService.getProfitSummary(days);
    res.json({ status: "ok", summary });
  } catch (error) {
    logger.error("analytics.profit_summary_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "profit_summary_failed" });
  }
});

// Phase 11: Sales trends (daily breakdown)
router.get("/sales-trends", requireAdminKey, async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const timeline = await getRevenueTimeline(days);
    res.json({ status: "ok", trends: timeline });
  } catch (error) {
    logger.error("analytics.sales_trends_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "sales_trends_failed" });
  }
});

export { router as analyticsRouter };
