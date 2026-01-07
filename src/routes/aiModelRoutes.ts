import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { runVirtualTryOn, getTaskDetail, killTask, cancelTask, runImageToVideo } from "../services/wiroService.js";
import { logger } from "../logger.js";

const router = express.Router();

// Configure Multer for temporary file storage
const upload = multer({
    dest: path.join(process.cwd(), "tmp/uploads"),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// POST /api/ai-model/generate
router.post("/generate", upload.fields([
    { name: 'inputImageHuman', maxCount: 1 },
    { name: 'inputImageClothes', maxCount: 2 }
]), async (req: any, res: any) => {
    try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const body = req.body;

        // Determine Human Image (File or URL)
        let humanImage = "";
        if (files['inputImageHuman'] && files['inputImageHuman'][0]) {
            humanImage = files['inputImageHuman'][0].path;
        } else if (body.inputImageHuman) {
            humanImage = body.inputImageHuman;
        }

        // Determine Clothes Images (Files or URLs)
        const clothesImages: string[] = [];
        if (files['inputImageClothes']) {
            files['inputImageClothes'].forEach(f => clothesImages.push(f.path));
        }

        if (body.inputImageClothes) {
            if (Array.isArray(body.inputImageClothes)) {
                clothesImages.push(...body.inputImageClothes);
            } else {
                clothesImages.push(body.inputImageClothes);
            }
        }

        if (!humanImage || clothesImages.length === 0) {
            return res.status(400).json({ error: "inputImageHuman and at least one inputImageClothes are required (File or URL)" });
        }

        logger.info("ai-model.generate.start", {
            human: humanImage.substring(0, 50),
            clothesCount: clothesImages.length
        });

        const result = await runVirtualTryOn(humanImage, clothesImages);

        // Cleanup files if they were uploaded
        if (files['inputImageHuman'] && files['inputImageHuman'][0]) {
            fs.unlink(files['inputImageHuman'][0].path, () => { });
        }
        if (files['inputImageClothes']) {
            files['inputImageClothes'].forEach(f => fs.unlink(f.path, () => { }));
        }

        res.json(result);

    } catch (error: any) {
        logger.error("ai-model.generate.error", { error: error.message });
        res.status(500).json({ error: "Generation failed", details: error.message });
    }
});

// GET /api/ai-model/status/:token
router.get("/status/:token", async (req: any, res: any) => {
    try {
        const { token } = req.params;
        const status = await getTaskDetail(token);
        res.json(status);
    } catch (error: any) {
        logger.error("ai-model.status.error", { error: error.message });
        res.status(500).json({ error: "Failed to get status" });
    }
});

// POST /api/ai-model/kill/:id
router.post("/kill/:id", async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const status = await killTask(id);
        res.json(status);
    } catch (error: any) {
        logger.error("ai-model.kill.error", { error: error.message });
        res.status(500).json({ error: "Failed to kill task" });
    }
});

// POST /api/ai-model/cancel/:id
router.post("/cancel/:id", async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const status = await cancelTask(id);
        res.json(status);
    } catch (error: any) {
        logger.error("ai-model.cancel.error", { error: error.message });
        res.status(500).json({ error: "Failed to cancel task" });
    }
});

// POST /api/ai-model/animate
router.post("/animate", async (req: any, res: any) => {
    try {
        const { imageUrl, prompt } = req.body;

        if (!imageUrl) {
            return res.status(400).json({ error: "imageUrl is required" });
        }

        logger.info("ai-model.animate.start", { imageUrl, prompt });

        const videoPrompt = prompt || "Bring this fashion model to life, natural movement, high quality, 4k";
        const result = await runImageToVideo(imageUrl, videoPrompt);

        res.json(result);
    } catch (error: any) {
        logger.error("ai-model.animate.error", { error: error.message });
        res.status(500).json({ error: "Animation failed", details: error.message });
    }
});

export default router;
