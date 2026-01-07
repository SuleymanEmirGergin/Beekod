import { Router } from "express";
import { requireAdminKey } from "../middleware/adminKey.js";
import { logger } from "../logger.js";
import {
  recordVideoAnalytics,
  getVideoAnalytics,
  getTopPerformingVideos,
  getProductVideoAnalytics,
  generateVideoRecommendations,
  syncPlatformAnalytics,
} from "../services/videoAnalyticsService.js";

const router = Router();

// GET /api/video-analytics/:videoId - Get analytics for a specific video
router.get("/:videoId", requireAdminKey, async (req, res) => {
  try {
    const { videoId } = req.params;
    const analytics = await getVideoAnalytics(videoId);
    res.json({ analytics });
  } catch (error) {
    logger.error("video_analytics.get_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "failed_to_get_analytics" });
  }
});

// GET /api/video-analytics/top/performers - Get top performing videos
router.get("/top/performers", requireAdminKey, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const topVideos = await getTopPerformingVideos(limit);
    res.json({ videos: topVideos });
  } catch (error) {
    logger.error("video_analytics.get_top_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "failed_to_get_top_videos" });
  }
});

// GET /api/video-analytics/product/:barcode - Get analytics for product videos
router.get("/product/:barcode", requireAdminKey, async (req, res) => {
  try {
    const { barcode } = req.params;
    const analytics = await getProductVideoAnalytics(barcode);
    res.json({ analytics });
  } catch (error) {
    logger.error("video_analytics.get_product_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "failed_to_get_product_analytics" });
  }
});

// POST /api/video-analytics/recommendations - Generate AI recommendations
router.post("/recommendations", requireAdminKey, async (req, res) => {
  try {
    const { productBarcode } = req.body;
    const recommendations = await generateVideoRecommendations(productBarcode);
    res.json({ recommendations });
  } catch (error) {
    logger.error("video_analytics.recommendations_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "failed_to_generate_recommendations" });
  }
});

// POST /api/video-analytics/sync - Sync analytics from platform
router.post("/sync", requireAdminKey, async (req, res) => {
  try {
    const { videoId, platform, platformVideoId } = req.body;

    if (!videoId || !platform || !platformVideoId) {
      return res.status(400).json({ error: "missing_required_fields" });
    }

    const analytics = await syncPlatformAnalytics(videoId, platform, platformVideoId);

    if (analytics) {
      res.json({ success: true, analytics });
    } else {
      res.status(500).json({ error: "sync_failed" });
    }
  } catch (error) {
    logger.error("video_analytics.sync_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "failed_to_sync_analytics" });
  }
});

// POST /api/video-analytics - Record/update analytics manually
router.post("/", requireAdminKey, async (req, res) => {
  try {
    const analytics = await recordVideoAnalytics(req.body);
    res.json({ success: true, analytics });
  } catch (error) {
    logger.error("video_analytics.record_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "failed_to_record_analytics" });
  }
});

export { router as videoAnalyticsRouter };
