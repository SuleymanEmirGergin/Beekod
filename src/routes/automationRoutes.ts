import { Router } from "express";
import { requireAdminKey } from "../middleware/adminKey.js";
import { logger } from "../logger.js";
import { autonomousPricingService } from "../services/pricing/autonomousPricingService.js";
import { stockForecastingService } from "../services/product/stockForecastingService.js";

const router = Router();

/**
 * POST /api/automation/pricing/run
 * Otonom fiyatlandırmayı tetikler.
 */
router.post("/pricing/run", requireAdminKey, async (req, res) => {
  try {
    const { barcode, minMargin } = req.body;
    
    if (barcode) {
      const success = await autonomousPricingService.processProduct(barcode, {
        type: "buybox",
        minMargin: minMargin || 0.15
      });
      return res.json({ success, message: success ? "İşlem başarılı" : "İşlem başarısız veya rakip bulunamadı" });
    } else {
      const stats = await autonomousPricingService.processAllProducts();
      return res.json({ success: true, stats });
    }
  } catch (error) {
    logger.error("automation.pricing_run_failed", { err: error });
    res.status(500).json({ error: "automated_pricing_failed" });
  }
});

/**
 * GET /api/automation/stock/forecast/:barcode
 * Belirli bir ürün için stok tahmini alır.
 */
router.get("/stock/forecast/:barcode", requireAdminKey, async (req, res) => {
  try {
    const { barcode } = req.params;
    const forecast = await stockForecastingService.getForecast(barcode);
    
    if (!forecast) {
      return res.status(404).json({ error: "forecast_not_found" });
    }
    
    res.json(forecast);
  } catch (error) {
    logger.error("automation.stock_forecast_failed", { err: error });
    res.status(500).json({ error: "stock_forecast_failed" });
  }
});

/**
 * GET /api/automation/stock/reports/critical
 * Kritik durumda olan ürünlerin stok tahmin raporunu alır.
 */
router.get("/stock/reports/critical", requireAdminKey, async (req, res) => {
  try {
    const reports = await stockForecastingService.getBulkForecast(20);
    res.json(reports);
  } catch (error) {
    logger.error("automation.stock_reports_failed", { err: error });
    res.status(500).json({ error: "stock_reports_failed" });
  }
});

export { router as automationRouter };
