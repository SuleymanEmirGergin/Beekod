import { Router } from "express";
import { getExecutiveSummary, getActionItems, getTrends, getDailyBrief, askAssistant } from "../services/intelligenceService.js";
import { logger } from "../logger.js";

const router = Router();

// GET /api/intelligence/summary
router.get("/summary", async (req, res) => {
  try {
    const summary = await getExecutiveSummary();
    res.json(summary);
  } catch (error) {
    logger.error("intelligence.summary_route_failed", { error });
    res.status(500).json({ error: "Failed to fetch executive summary" });
  }
});

// GET /api/intelligence/actions
router.get("/actions", async (req, res) => {
  try {
    const actions = await getActionItems();
    res.json(actions);
  } catch (error) {
    logger.error("intelligence.actions_route_failed", { error });
    res.status(500).json({ error: "Failed to fetch action items" });
  }
});

// GET /api/intelligence/trends
router.get("/trends", async (req, res) => {
  try {
    const trends = await getTrends();
    res.json(trends);
  } catch (error) {
    logger.error("intelligence.trends_route_failed", { error });
    res.status(500).json({ error: "Failed to fetch trends data" });
  }
});


// GET /api/intelligence/daily-brief
router.get("/daily-brief", async (req, res) => {
  try {
    const summary = await getDailyBrief();
    res.json(summary);
  } catch (error) {
    logger.error("intelligence.daily_brief_route_failed", { error });
    res.status(500).json({ error: "Failed to fetch daily brief" });
  }
});

export { router as intelligenceRouter };
