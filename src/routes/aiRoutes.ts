import express from "express";
import { rateLimit } from "express-rate-limit";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { getOrchestrator } from "../ai/orchestrator.js";
import { logger } from "../logger.js";

const router = express.Router();

const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: "Too many requests, please try again later.",
});

router.post("/chat", authenticate, aiLimiter, async (req, res) => {
  try {
    const { message } = req.body;
    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Message is required." });
    }

    const user = (req as AuthRequest).user;
    const tenantHeader = req.headers["x-tenant-id"];
    const tenantId =
      (typeof tenantHeader === "string" && tenantHeader.trim()) ||
      String(user?.id ?? "default");
    const userId = String(user?.id ?? "anonymous");
    const requestId = String(res.locals?.requestId || "");

    const orchestrator = getOrchestrator();
    const result = await orchestrator.process({
      message: message.trim(),
      context: {
        tenantId,
        userId,
        requestId,
      },
    });

    return res.json({
      intent: result.intent,
      toolResults: result.toolResults,
      answer: result.answer,
    });
  } catch (error) {
    logger.error("ai.chat.failed", { error: String(error) });
    return res.status(500).json({ error: "Failed to process AI request." });
  }
});

export default router;
