import { Router } from "express";
import {
  getQuestions,
  getQuestionById,
  answerQuestion,
  getQuestionsStats,
  suggestAnswer,
} from "../services/questionService.js";
import { requireJsonBody } from "../middleware/requireJsonBody.js";

const router = Router();

// Get all questions (supports ?status=replied|unreplied filter)
router.get("/", async (req, res) => {
  try {
    const status = req.query.status as "replied" | "unreplied" | undefined;
    const questions = await getQuestions(status);
    res.json({ success: true, count: questions.length, data: questions });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch questions" });
  }
});

// Get stats
router.get("/stats", async (req, res) => {
  try {
    const stats = await getQuestionsStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch stats" });
  }
});

// Get single question
router.get("/:id", async (req, res) => {
  try {
    const question = await getQuestionById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, error: "Question not found" });
    }
    res.json({ success: true, data: question });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch question" });
  }
});

// Answer a question
router.post("/:id/answer", requireJsonBody, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ success: false, error: "Answer text is required" });
    }

    const updatedQuestion = await answerQuestion(req.params.id, text);

    if (!updatedQuestion) {
      return res.status(404).json({ success: false, error: "Question not found" });
    }

    res.json({ success: true, message: "Answer submitted successfully", data: updatedQuestion });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to answer question" });
  }
});

// AI Suggest answer
router.post("/:id/suggest-answer", async (req, res) => {
  try {
    const suggestion = await suggestAnswer(req.params.id);
    res.json({ success: true, data: { suggestion } });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to suggest answer" });
  }
});

export default router;
