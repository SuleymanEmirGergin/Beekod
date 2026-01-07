import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../validation.js";
import { logger } from "../logger.js";
import { requireAdminKey } from "../middleware/adminKey.js";
import {
  createPost,
  getPosts,
  updatePostStatus,
  deletePost,
  simulateAutoPost,
  generateSocialContent,
} from "../services/socialService.js";

const router = Router();

const postSchema = z.object({
  platform: z.enum(["Instagram", "TikTok", "Facebook", "Twitter", "LinkedIn"]),
  content: z.string().min(1),
  mediaUrl: z.string().optional(),
  scheduledDate: z.string(),
  status: z.enum(["Draft", "Scheduled"]).optional(),
  productId: z.string().optional(),
  aiGenerated: z.boolean().optional(),
});

// GET /api/social/posts
router.get("/posts", async (req, res) => {
  try {
    const posts = await getPosts(req.query);
    res.json(posts);
  } catch (error) {
    logger.error("social.get_posts_failed", { err: error });
    res.status(500).json({ error: "Failed to fetch social posts" });
  }
});

// POST /api/social/posts
router.post("/posts", validateBody(postSchema), async (req, res) => {
  try {
    const post = await createPost({
      ...req.body,
      scheduledDate: new Date(req.body.scheduledDate)
    });
    res.status(201).json(post);
  } catch (error) {
    logger.error("social.create_post_failed", { err: error });
    res.status(500).json({ error: "Failed to create social post" });
  }
});

// PATCH /api/social/posts/:id/status
router.patch("/posts/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const post = await updatePostStatus(req.params.id, status);
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  } catch (error) {
    logger.error("social.update_post_failed", { err: error });
    res.status(500).json({ error: "Failed to update post status" });
  }
});

// DELETE /api/social/posts/:id
router.delete("/posts/:id", async (req, res) => {
  try {
    const success = await deletePost(req.params.id);
    res.json({ success });
  } catch (error) {
    logger.error("social.delete_post_failed", { err: error });
    res.status(500).json({ error: "Failed to delete post" });
  }
});

// POST /api/social/posts/:id/post-now
router.post("/posts/:id/post-now", async (req, res) => {
  try {
    const success = await simulateAutoPost(req.params.id);
    res.json({ success });
  } catch (error) {
    logger.error("social.auto_post_failed", { err: error });
    res.status(500).json({ error: "Auto-posting failed" });
  }
});

// POST /api/social/generate-content
router.post("/generate-content", requireAdminKey, async (req, res) => {
  const { productId, platform } = req.body;
  if (!productId || !platform) {
    return res.status(400).json({ error: "product_id_and_platform_required" });
  }

  try {
    const content = await generateSocialContent(productId, platform);
    res.json({ status: "ok", content });
  } catch (error) {
    logger.error("social.generate_content_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "generate_content_failed" });
  }
});

router.post("/bulk-generate-content", requireAdminKey, async (req, res) => {
  const { productIds, platform } = req.body;
  if (!Array.isArray(productIds) || !platform) {
    return res.status(400).json({ error: "product_ids_array_and_platform_required" });
  }

  try {
    const { generateBulkSocialContent } = await import("../services/socialService.js");
    const results = await generateBulkSocialContent(productIds, platform);
    res.json({ status: "ok", results });
  } catch (error) {
    logger.error("social.bulk_generate_content_failed", { requestId: res.locals?.requestId, err: error });
    res.status(500).json({ error: "bulk_generate_content_failed" });
  }
});

export { router as socialRouter };
