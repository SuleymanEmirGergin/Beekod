import express from "express";
import { getConfig, updateConfig } from "../services/configService.js";
import { logger } from "../logger.js";

const router = express.Router();

router.get("/api/config", async (req, res, next) => {
  try {
    const config = await getConfig();
    res.json(config);
  } catch (error) {
    next(error);
  }
});

router.put("/api/config", async (req, res, next) => {
  try {
    const config = await updateConfig(req.body);
    logger.info("Configuration updated");
    res.json(config);
  } catch (error) {
    next(error);
  }
});

export { router as configRouter };
