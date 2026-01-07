import { Router } from "express";
import { requireAdminKey } from "../middleware/adminKey.js";
import { logger } from "../logger.js";
import {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  generateAIRecommendations,
} from "../services/notificationService.js";
import { getAllProducts } from "../services/productService.js";
import { query } from "../db.js";

const router = Router();

// GET /api/notifications - Get recent notifications
router.get("/", requireAdminKey, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const includeRead = req.query.includeRead === "true";

    const notifications = await getNotifications(limit, includeRead);
    res.json({ notifications });
  } catch (error) {
    logger.error("notifications.get_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "failed_to_get_notifications" });
  }
});

// GET /api/notifications/unread-count
router.get("/unread-count", requireAdminKey, async (req, res) => {
  try {
    const count = await getUnreadCount();
    res.json({ count });
  } catch (error) {
    logger.error("notifications.count_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "failed_to_count_notifications" });
  }
});

// POST /api/notifications/:id/mark-read
router.post("/:id/mark-read", requireAdminKey, async (req, res) => {
  try {
    const { id } = req.params;
    const success = await markAsRead(id);

    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "notification_not_found" });
    }
  } catch (error) {
    logger.error("notifications.mark_read_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "failed_to_mark_read" });
  }
});

// POST /api/notifications/mark-all-read
router.post("/mark-all-read", requireAdminKey, async (req, res) => {
  try {
    const count = await markAllAsRead();
    res.json({ success: true, count });
  } catch (error) {
    logger.error("notifications.mark_all_read_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "failed_to_mark_all_read" });
  }
});

// POST /api/notifications/generate-recommendations - Generate AI recommendations
router.post("/generate-recommendations", requireAdminKey, async (req, res) => {
  try {
    // Gather business context
    const products = await getAllProducts(1000);
    const lowStockProducts = products.filter((p) => p.stock < (p.alert_threshold || 10)).length;

    // Count pending orders from MySQL
    const pendingOrdersResult = await query<any[]>(
      "SELECT COUNT(*) as count FROM orders WHERE status_label IN ('Pending', 'Processing')",
      [],
    );
    const pendingOrders = parseInt(pendingOrdersResult[0]?.count || "0");

    // Calculate average profit (simplified)
    const averageProfit = 22; // Placeholder, would calculate from actual data

    const recommendations = await generateAIRecommendations({
      lowStockProducts,
      pendingOrders,
      averageProfit,
    });

    res.json({
      success: true,
      count: recommendations.length,
      recommendations,
    });
  } catch (error) {
    logger.error("notifications.generate_recommendations_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "failed_to_generate_recommendations" });
  }
});

// POST /api/notifications - Create a custom notification
router.post("/", requireAdminKey, async (req, res) => {
  try {
    const notification = await createNotification(req.body);
    res.json({ success: true, notification });
  } catch (error) {
    logger.error("notifications.create_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "failed_to_create_notification" });
  }
});

export { router as notificationRouter };
