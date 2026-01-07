import { Router } from "express";
import { logger } from "../logger.js";
import { getDashboardData } from "../services/dashboardService.js";

const router = Router();

// GET /api/dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const data = await getDashboardData();
    res.json(data);
  } catch (error) {
    const { message, stack } = error as Error;
    logger.error("dashboard.get_failed", { message, stack });
    res.status(500).json({
      error: "Failed to get dashboard data",
      details: message,
    });
  }
});

export { router as dashboardRouter };
