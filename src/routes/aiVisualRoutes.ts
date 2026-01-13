import express from "express";
import { generateAIModel, runVirtualTryOn, generateProductVideo } from "../services/visualIntelligenceService.js";
import { logger } from "../core/logging/index.js";

const router = express.Router();

// POST /api/ai/visual/generate-model
router.post("/generate-model", async (req, res) => {
    try {
        const { prompt, appearance, mood, origin } = req.body;
        if (!prompt) return res.status(400).json({ error: "Prompt is required" });

        const imageUrl = await generateAIModel(prompt, { appearance, mood, origin });
        res.json({ imageUrl });
    } catch (error) {
        logger.error("api.ai.visual.generate-model", error);
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
});

// POST /api/ai/visual/virtual-try-on
router.post("/virtual-try-on", async (req, res) => {
    try {
        const { humanImageUrl, clothImageUrl, category, appearance, mood, origin } = req.body;
        if (!humanImageUrl || !clothImageUrl) {
            return res.status(400).json({ error: "Human and Cloth images are required" });
        }

        const validCategories = ["tops", "bottoms", "one-pieces"];
        const safeCategory = validCategories.includes(category) ? category : "tops";

        const resultUrl = await runVirtualTryOn(
          humanImageUrl, 
          clothImageUrl, 
          safeCategory as any,
          { appearance, mood, origin }
        );
        res.json({ imageUrl: resultUrl });
    } catch (error) {
        logger.error("api.ai.visual.vton", error);
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
});

// POST /api/ai/visual/generate-video
router.post("/generate-video", async (req, res) => {
    try {
        const { imageUrl, prompt } = req.body;
        if (!imageUrl) return res.status(400).json({ error: "Image URL is required" });

        const result = await generateProductVideo(imageUrl, prompt || "Fashion model moving naturally");
        res.json(result);
    } catch (error) {
        logger.error("api.ai.visual.video", error);
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
});

export default router;
