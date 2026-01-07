import fs from "fs/promises";
import path from "path";
import { Router } from "express";
import { config } from "../config.js";
import { logger } from "../logger.js";
import { requireAdminKey } from "../middleware/adminKey.js";
import { requireJsonBody } from "../middleware/requireJsonBody.js";

const router = Router();

router.use(requireJsonBody);

router.get("/content-config", requireAdminKey, async (_req, res) => {
  try {
    const filePath = path.resolve(config.data.contentConfigPath);
    const raw = await fs.readFile(filePath, "utf8");
    const data = JSON.parse(raw);
    res.json(data);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return res.json({});
    }
    logger.error("content_config.read_failed", { requestId: res.locals?.requestId, err });
    res.status(500).json({ error: "content_config_read_failed" });
  }
});

router.post("/content-config", requireAdminKey, async (req, res) => {
  try {
    const filePath = path.resolve(config.data.contentConfigPath);
    const raw = JSON.stringify(req.body, null, 2);
    await fs.writeFile(filePath, raw, "utf8");
    res.json({ status: "ok" });
  } catch (error) {
    logger.error("content_config.write_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "content_config_write_failed" });
  }
});

router.post("/content-config/reset", requireAdminKey, async (_req, res) => {
  try {
    const sourcePath = path.resolve(config.data.contentConfigDefaultPath);
    const targetPath = path.resolve(config.data.contentConfigPath);
    const raw = await fs.readFile(sourcePath, "utf8");
    await fs.writeFile(targetPath, raw, "utf8");
    res.json({ status: "ok" });
  } catch (error) {
    logger.error("content_config.reset_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "content_config_reset_failed" });
  }
});

export { router as contentConfigRouter };
