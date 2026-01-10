import express from "express";
import { generateVideoScript, generateVideoMedia, generateAIDrivenVideo, generateTryOnVideo } from "../services/videoService.js";
import { getTaskDetail } from "../services/wiroService.js";
import { logger } from "../logger.js";

const router = express.Router();

router.post("/generate-script", async (req, res) => {
  try {
    const { productId, vibe, platform } = req.body;

    if (!productId || !vibe) {
      return res.status(400).json({ success: false, error: "Product ID and Vibe are required" });
    }

    const script = await generateVideoScript(productId, vibe, platform || "instagram");
    res.json({ success: true, data: script });
  } catch (error: any) {
    logger.error("video.script_route_failed", { err: error });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/generate-media", async (req, res) => {
  try {
    const { productId, script } = req.body;

    if (!productId || !script) {
      return res.status(400).json({ success: false, error: "Product ID (barcode) and Script are required" });
    }

    const media = await generateVideoMedia(productId, script);
    res.json({ success: true, data: media });
  } catch (error: any) {
    logger.error("video.media_route_failed", { err: error });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/generate-ai-media", async (req, res) => {
  try {
    const { productId, vibe, customPrompt } = req.body;

    if (!productId || !vibe) {
      return res.status(400).json({ success: false, error: "Product ID (barcode) and Vibe are required" });
    }

    const taskInfo = await generateAIDrivenVideo(productId, vibe, customPrompt);
    res.json({ success: true, data: taskInfo });
  } catch (error: any) {
    logger.error("video.ai_media_route_failed", { err: error });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/video/generate-try-on-video
 * Generate video using virtual try-on workflow
 * Body: { productId: string, gender?: 'male'|'female'|'neutral', vibe?: string }
 */
router.post("/generate-try-on-video", async (req, res) => {
  try {
    const { productId, gender, vibe } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        error: "Product ID (barcode) is required"
      });
    }

    logger.info("video.try_on_video_request", { productId, gender, vibe });

    const result = await generateTryOnVideo(productId, { gender, vibe });

    res.json({
      success: true,
      videoUrl: result.videoUrl,
      taskToken: result.taskToken
    });
  } catch (error: any) {
    logger.error("video.try_on_video_route_failed", { err: error });
    const statusCode = error.name === 'NotFoundError' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message || "Failed to generate try-on video"
    });
  }
});

router.get("/task-status/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const detail = await getTaskDetail(token);

    // Wiro returns tasklist. We look for status and outputs.
    // status "task_postprocess_end" usually means done.
    const task = detail.tasklist && detail.tasklist[0];

    if (!task) {
      return res.status(404).json({ success: false, error: "Task not found" });
    }

    let url = null;
    if (task.status === "task_postprocess_end" && task.outputs && task.outputs.length > 0) {
      // Find the video file or just take the first output
      url = task.outputs[0].url || `https://api.wiro.ai/v1/File/Download/${task.outputs[0].id}`;
      // Note: The download URL might need a key or different structure, 
      // but task.outputs[0].url is usually present if hosted.
    }

    res.json({
      success: true,
      status: task.status,
      url: url,
      progress: task.status === "task_postprocess_end" ? 100 : 50 // simplistic progress
    });
  } catch (error: any) {
    logger.error("video.task_status_failed", { err: error });
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
