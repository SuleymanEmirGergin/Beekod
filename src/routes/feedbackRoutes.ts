import express from "express";
import { chatLogger } from "../logger.js";

const router = express.Router();

interface FeedbackRequest {
  messageId?: string;
  rating: "positive" | "negative";
  comment?: string;
  context?: string; // e.g. "product_card", "content_card"
}

// POST /api/feedback
router.post("/", async (req, res) => {
  try {
    const { messageId, rating, comment, context } = req.body as FeedbackRequest;

    if (!rating) {
      return res.status(400).json({ error: "Rating is required" });
    }

    // Log the feedback
    chatLogger.info("chat.feedback", {
      event: "feedback",
      messageId: messageId || "unknown",
      rating,
      comment: comment || "",
      context: context || "general",
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({ success: true, message: "Feedback received" });
  } catch (error) {
    chatLogger.error("feedback.error", { error });
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
