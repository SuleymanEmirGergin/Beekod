import fs from "fs/promises";
import path from "path";
import { Router } from "express";
import { config } from "../config.js";
import { logger } from "../logger.js";
import { requireAdminKey } from "../middleware/adminKey.js";
import { requireJsonBody } from "../middleware/requireJsonBody.js";

const router = Router();

router.use(requireJsonBody);

router.get("/marketplace/mappings", requireAdminKey, async (_req, res) => {
  try {
    const filePath = path.resolve(config.data.marketplaceMappingPath);
    const raw = await fs.readFile(filePath, "utf8");
    const data = JSON.parse(raw);
    res.json(data);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return res.json({});
    }
    logger.error("marketplace_mapping.read_failed", { requestId: res.locals?.requestId, err });
    res.status(500).json({ error: "marketplace_mapping_read_failed" });
  }
});

router.post("/marketplace/mappings", requireAdminKey, async (req, res) => {
  try {
    const filePath = path.resolve(config.data.marketplaceMappingPath);
    const raw = JSON.stringify(req.body ?? {}, null, 2);
    await fs.writeFile(filePath, raw, "utf8");
    res.json({ status: "ok" });
  } catch (error) {
    logger.error("marketplace_mapping.write_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "marketplace_mapping_write_failed" });
  }
});

router.post("/marketplace/mappings/reset", requireAdminKey, async (_req, res) => {
  try {
    const sourcePath = path.resolve(config.data.marketplaceMappingDefaultPath);
    const targetPath = path.resolve(config.data.marketplaceMappingPath);
    const raw = await fs.readFile(sourcePath, "utf8");
    await fs.writeFile(targetPath, raw, "utf8");
    res.json({ status: "ok" });
  } catch (error) {
    logger.error("marketplace_mapping.reset_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "marketplace_mapping_reset_failed" });
  }
});

export { router as marketplaceMappingRouter };
