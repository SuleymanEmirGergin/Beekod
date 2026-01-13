import express from "express";
import { labelService } from "../services/product/labelService.js";
import { shippingService } from '../services/order/shippingService.js';
import { logger } from "../core/logging/index.js";

const router = express.Router();

/**
 * GET /api/shipping/labels/:trackingNumber
 * Renders the HTML label for printing
 */
router.get("/labels/:trackingNumber", async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const provider = (req.query.provider as 'yurtici' | 'aras' | 'mng') || 'yurtici';
    
    // In a real app, we might fetch order details by tracking number here
    // For simulation, we pass minimal data or let standard defaults take over
    const html = labelService.generateLabelHtml(trackingNumber, provider);
    
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    logger.error("shipping.label_view_error", { error });
    res.status(500).send("Etiket oluşturulurken hata oluştu.");
  }
});

/**
 * GET /api/shipping/stats
 * Returns shipping dashboard statistics
 */
router.get("/stats", async (req, res) => {
  try {
    const stats = await shippingService.getStats();
    res.json(stats);
  } catch (error) {
    logger.error("shipping.stats_error", { error });
    res.status(500).json({ error: "İstatistikler alınamadı" });
  }
});

export { router as shippingRouter };
