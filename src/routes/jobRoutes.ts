import { Router } from "express";
import { z } from "zod";
import { requireAdminKey } from "../middleware/adminKey.js";
import { requireJsonBody } from "../middleware/requireJsonBody.js";
import { logger } from "../logger.js";
import { enqueueJob, getDeadLetters, getJobById, getJobStats, getJobs } from "../services/jobQueue.js";
import { validateBody } from "../validation/middleware.js";

const router = Router();

const jobSchema = z
  .object({
    type: z.enum(["cache.refresh", "marketplace.sync_all"]),
  })
  .passthrough();

router.use(requireJsonBody);

router.get("/jobs", requireAdminKey, async (req, res) => {
  const limitRaw = Number(req.query.limit ?? 50);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 50;
  try {
    const items = await getJobs(limit);
    res.json({ items });
  } catch (error) {
    logger.error("jobs.list_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "job_list_failed" });
  }
});

router.get("/jobs/stats", requireAdminKey, async (_req, res) => {
  try {
    const stats = await getJobStats();
    res.json({ stats });
  } catch (error) {
    logger.error("jobs.stats_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "job_stats_failed" });
  }
});

router.get("/jobs/dead-letter", requireAdminKey, async (req, res) => {
  const limitRaw = Number(req.query.limit ?? 50);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 50;
  try {
    const items = await getDeadLetters(limit);
    res.json({ items });
  } catch (error) {
    logger.error("jobs.dead_letter_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "dead_letter_list_failed" });
  }
});

router.post("/jobs", requireAdminKey, validateBody(jobSchema), async (req, res) => {
  try {
    const job = await enqueueJob(req.body.type);
    res.json({ job });
  } catch (error) {
    logger.error("jobs.enqueue_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "job_enqueue_failed" });
  }
});

router.get("/jobs/:id", requireAdminKey, async (req, res) => {
  const id = req.params.id.trim();
  if (!id) {
    return res.status(400).json({ error: "job_id_required" });
  }
  try {
    const job = await getJobById(id);
    if (!job) {
      return res.status(404).json({ error: "job_not_found" });
    }
    return res.json({ job });
  } catch (error) {
    logger.error("jobs.read_failed", { requestId: res.locals?.requestId, err: error });
    return res.status(500).json({ error: "job_read_failed" });
  }
});

export { router as jobRouter };
