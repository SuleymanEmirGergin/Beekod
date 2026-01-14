import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { generateAIModel, runVirtualTryOn } from "../services/visualIntelligenceService.js";
import { aiModelQueue } from "../queue/index.js";
import { logger } from "../logger.js";


const router = express.Router();

// Configure Multer for temporary file storage
const upload = multer({
    dest: path.join(process.cwd(), "tmp/uploads"),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// POST /api/ai-model/generate
// Uses Fal.ai for synchronous AI model generation
router.post("/generate", upload.fields([
    { name: 'inputImageHuman', maxCount: 1 },
    { name: 'inputImageClothes', maxCount: 2 }
]), async (req: any, res: any) => {
    try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const body = req.body;

        logger.info("ai-model.generate.request", { bodyKeys: Object.keys(body), fileKeys: Object.keys(files || {}) });

        // Determine Human Image (File or URL)
        let humanImage = "";
        let isUserUploadedHuman = false;

        if (files['inputImageHuman'] && files['inputImageHuman'][0]) {
            humanImage = files['inputImageHuman'][0].path;
            isUserUploadedHuman = true;
        } else if (body.inputImageHuman) {
            humanImage = body.inputImageHuman;
        }

        // Determine Clothes Images
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
            return res.status(400).json({ error: "inputImageHuman and at least one inputImageClothes are required" });
        }

        // Determine attributes (parsing if exists)
        let modelAttributes: any = {};
        if (body.attributes) {
            try {
                modelAttributes = JSON.parse(body.attributes);
            } catch (e) {
                logger.warn("Failed to parse attributes JSON", { attributes: body.attributes });
            }
        }

        // --- Fal.ai-based Model Generator ---
        let finalHumanImage = humanImage;

        // Generate new model if attributes are provided AND user didn't upload their own photo
        if (Object.keys(modelAttributes).length > 0 && !isUserUploadedHuman) {
            try {
                const attrs = modelAttributes;
                logger.info("ai-model.generate.flux_start", { attrs });

                // Construct detailed prompt from granular attributes
                const gender = attrs.gender || 'model';
                const ethnicity = attrs.ethnicity ? `${attrs.ethnicity} ` : '';
                const bodyType = attrs.bodyType ? `${attrs.bodyType} body type, ` : '';
                const hairColor = attrs.hairColor ? `${attrs.hairColor} hair, ` : '';
                const hairLength = attrs.hairLength ? `${attrs.hairLength} hair length, ` : '';
                const eyeColor = attrs.eyeColor ? `${attrs.eyeColor} eyes, ` : '';
                const height = attrs.height ? `${attrs.height} height, ` : '';
                const pose = attrs.pose ? `${attrs.pose} pose` : 'standing pose';

                const prompt = `Professional fashion model photo, ${ethnicity}${gender}, ${bodyType}${hairColor}${hairLength}${eyeColor}${height}${pose}, studio lighting, high quality`;

                logger.info("ai-model.generate.flux_prompt", { prompt });

                // Generate Base Model via Fal.ai FLUX
                const generatedModelUrl = await generateAIModel(prompt, {
                    appearance: attrs.appearance,
                    mood: attrs.mood,
                    origin: attrs.ethnicity
                });

                if (generatedModelUrl) {
                    finalHumanImage = generatedModelUrl;
                    logger.info("ai-model.generate.flux_model_created", { url: finalHumanImage });
                }

            } catch (e) {
                logger.warn("FLUX generation failed, using provided image", { error: e });
            }
        }

        logger.info("ai-model.generate.start_vto", {
            human: finalHumanImage.substring(0, 50),
            clothesCount: clothesImages.length,
            category: modelAttributes.category
        });

        // Run Virtual Try-On using Fal.ai IDM-VTON (synchronous)
        const category = modelAttributes.category || "tops";
        const resultUrl = await runVirtualTryOn(finalHumanImage, clothesImages[0], category);

        // Cleanup files
        if (files['inputImageHuman'] && files['inputImageHuman'][0]) {
            fs.unlink(files['inputImageHuman'][0].path, () => { });
        }
        if (files['inputImageClothes']) {
            files['inputImageClothes'].forEach(f => fs.unlink(f.path, () => { }));
        }

        // Fal.ai returns result directly (no polling needed)
        res.json({
            status: "complete",
            result: resultUrl,
            outputs: [resultUrl]
        });

    } catch (error: any) {
        logger.error("ai-model.generate.error", { error: error.message });
        res.status(500).json({ error: "Generation failed", details: error.message });
    }
});

// GET /api/ai-model/status/:token
// Deprecated: Fal.ai is synchronous, no polling needed
router.get("/status/:token", async (req: any, res: any) => {
    res.status(410).json({
        error: "Deprecated",
        message: "Fal.ai is synchronous. Status polling is no longer needed. The /generate endpoint now returns results directly."
    });
});

// POST /api/ai-model/kill/:id - Deprecated
router.post("/kill/:id", async (req: any, res: any) => {
    res.status(410).json({
        error: "Deprecated",
        message: "Fal.ai is synchronous. Task management is no longer needed."
    });
});

// POST /api/ai-model/cancel/:id - Deprecated
router.post("/cancel/:id", async (req: any, res: any) => {
    res.status(410).json({
        error: "Deprecated",
        message: "Fal.ai is synchronous. Task management is no longer needed."
    });
});

// POST /api/ai-model/animate
// Now uses Fal.ai Kling for video generation
router.post("/animate", async (req: any, res: any) => {
    try {
        const { imageUrl, prompt } = req.body;

        if (!imageUrl) {
            return res.status(400).json({ error: "imageUrl is required" });
        }

        logger.info("ai-model.animate.start", { imageUrl, prompt });

        const { generateProductVideo } = await import("../services/visualIntelligenceService.js");
        const videoPrompt = prompt || "Bring this fashion model to life, natural movement, high quality, 4k";
        const result = await generateProductVideo(imageUrl, videoPrompt);

        res.json({
            status: "complete",
            videoUrl: result.videoUrl
        });
    } catch (error: any) {
        logger.error("ai-model.animate.error", { error: error.message });
        res.status(500).json({ error: "Animation failed", details: error.message });
    }
});

// ============================================
// QUEUE-BASED AI MODEL ENDPOINTS (Async)
// ============================================

/**
 * POST /api/ai-model/queue/virtual-try-on
 * Virtual Try-On job'ı queue'ya ekler (ASYNC)
 */
router.post("/queue/virtual-try-on", async (req, res) => {
    try {
        const { productId, barcode, modelType, garmentImageUrl, modelImageUrl, category, userId } = req.body;

        if (!productId && !barcode && !garmentImageUrl) {
            return res.status(400).json({
                success: false,
                error: "At least one of productId, barcode, or garmentImageUrl is required"
            });
        }

        logger.info("ai_model.queue.add_job", { productId, barcode, modelType });

        const job = await aiModelQueue.add('virtual-try-on', {
            userId,
            productId,
            barcode,
            modelType: modelType || 'latin_female',
            garmentImageUrl,
            modelImageUrl,
            category: category || 'upper_body',
        }, {
            priority: 5,
        });

        res.json({
            success: true,
            jobId: job.id,
            status: 'queued',
            message: 'Virtual Try-On job queued. Use /api/ai-model/queue/status/:jobId to check progress.'
        });

    } catch (error: any) {
        logger.error("ai_model.queue.add_job_failed", { err: error });
        res.status(500).json({
            success: false,
            error: error.message || "Failed to queue Virtual Try-On job"
        });
    }
});

/**
 * GET /api/ai-model/queue/status/:jobId
 */
router.get("/queue/status/:jobId", async (req, res) => {
    try {
        const { jobId } = req.params;

        const job = await aiModelQueue.getJob(jobId);

        if (!job) {
            return res.status(404).json({
                success: false,
                error: "Job not found"
            });
        }

        const state = await job.getState();
        const progress = job.progress;
        const result = job.returnvalue;
        const failedReason = job.failedReason;

        res.json({
            success: true,
            jobId: job.id,
            status: state,
            progress: progress || 0,
            result: state === 'completed' ? result : undefined,
            error: state === 'failed' ? failedReason : undefined,
        });

    } catch (error: any) {
        logger.error("ai_model.queue.status_check_failed", { err: error });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/ai-model/queue/stats
 */
router.get("/queue/stats", async (req, res) => {
    try {
        const [waiting, active, completed, failed] = await Promise.all([
            aiModelQueue.getWaitingCount(),
            aiModelQueue.getActiveCount(),
            aiModelQueue.getCompletedCount(),
            aiModelQueue.getFailedCount(),
        ]);

        res.json({
            success: true,
            stats: {
                waiting,
                active,
                completed,
                failed,
                total: waiting + active + completed + failed,
            }
        });

    } catch (error: any) {
        logger.error("ai_model.queue.stats_failed", { err: error });
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
