import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { runVirtualTryOn, getTaskDetail, killTask, cancelTask, runImageToVideo, generateBaseModelWithFlux, pollFluxTaskForImage } from "../services/wiroService.js";
import { aiModelQueue } from "../queue/index.js";
import { logger } from "../logger.js";


const router = express.Router();

// Configure Multer for temporary file storage
const upload = multer({
    dest: path.join(process.cwd(), "tmp/uploads"),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// ... previous imports

// POST /api/ai-model/generate
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

        // --- Hybrid Model Generator Logic (Flux -> Wiro) ---
        let finalHumanImage = humanImage;

        // Only generate new model if attributes are provided AND user didn't upload their own photo
        if (Object.keys(modelAttributes).length > 0 && !isUserUploadedHuman) {
            try {
                const attrs = modelAttributes;
                logger.info("ai-model.generate.hybrid_start", { attrs });

                // Construct detailed prompt from granular attributes
                const gender = attrs.gender || 'model';
                const ethnicity = attrs.ethnicity ? `${attrs.ethnicity} ` : '';
                const bodyType = attrs.bodyType ? `${attrs.bodyType} body type, ` : '';
                const hairColor = attrs.hairColor ? `${attrs.hairColor} hair, ` : '';
                const hairLength = attrs.hairLength ? `${attrs.hairLength} hair length, ` : '';
                const eyeColor = attrs.eyeColor ? `${attrs.eyeColor} eyes, ` : '';
                const height = attrs.height ? `${attrs.height} height, ` : '';
                const pose = attrs.pose ? `${attrs.pose} pose` : 'standing pose';

                // Prompt Engineering
                const prompt = `${ethnicity}${gender}, ${bodyType}${hairColor}${hairLength}${eyeColor}${height}${pose}`;

                logger.info("ai-model.generate.hybrid_prompt", { prompt });

                // 1. Generate Base Model via Wiro AI FLUX.2-dev
                const fluxTask = await generateBaseModelWithFlux(prompt);

                if (fluxTask.socketaccesstoken) {
                    const generatedModelUrl = await pollFluxTaskForImage(fluxTask.socketaccesstoken);
                    if (generatedModelUrl) {
                        finalHumanImage = generatedModelUrl;
                        logger.info("ai-model.generate.hybrid_model_created", { url: finalHumanImage });
                    }
                }

            } catch (e) {
                logger.warn("Hybrid generation failed, falling back to selected preset", { error: e });
            }
        }

        logger.info("ai-model.generate.start_wiro", {
            human: finalHumanImage.substring(0, 50),
            clothesCount: clothesImages.length,
            category: modelAttributes.category
        });

        // 2. Run Virtual Try-On (Wiro AI) using the (possibly generated) human image
        const result = await runVirtualTryOn(finalHumanImage, clothesImages, modelAttributes.category);

        // Cleanup files
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
        const wiroResponse = await getTaskDetail(token);

        // Wiro returns data in tasklist array
        // Structure: { tasklist: [{ status, outputs: [{url: "..."}] }], result: true }

        let task = wiroResponse;
        let outputUrls: string[] = [];
        let taskStatus = "unknown";

        // Check if response has tasklist structure
        if (wiroResponse.tasklist && Array.isArray(wiroResponse.tasklist) && wiroResponse.tasklist.length > 0) {
            task = wiroResponse.tasklist[0];
            taskStatus = task.status || "unknown";

            // Extract URLs from outputs array - outputs contain objects with 'url' field OR direct strings
            if (task.outputs && Array.isArray(task.outputs)) {
                outputUrls = task.outputs
                    .map((o: any) => {
                        if (typeof o === 'string') return o;
                        if (o && typeof o === 'object' && o.url) return o.url;
                        return null;
                    })
                    .filter((url: string | null) => url !== null);
            }
        } else {
            // Fallback for direct response structure
            taskStatus = wiroResponse.status || wiroResponse.type || "unknown";
            if (wiroResponse.outputs && Array.isArray(wiroResponse.outputs)) {
                outputUrls = wiroResponse.outputs;
            }
        }

        const normalizedResponse = {
            id: task.id || task.taskid || token,
            status: taskStatus,
            result: outputUrls.length > 0 ? outputUrls[0] : null,
            outputs: outputUrls,
            raw: wiroResponse
        };

        logger.info("ai-model.status.mapped", {
            token,
            taskStatus,
            hasOutputs: outputUrls.length > 0,
            firstOutput: outputUrls[0] || null
        });

        if (outputUrls.length === 0) {
            logger.warn("ai-model.status.no_outputs", {
                token,
                taskStatus,
                rawTask: JSON.stringify(task),
                rawResponse: JSON.stringify(wiroResponse).substring(0, 1000)
            });
        }

        res.json(normalizedResponse);
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

// ============================================
// QUEUE-BASED AI MODEL ENDPOINTS (Async)
// ============================================

/**
 * POST /api/ai-model/queue/virtual-try-on
 * Virtual Try-On job'ı queue'ya ekler (ASYNC)
 * Body: { productId, barcode, modelType, garmentImageUrl, modelImageUrl, category }
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
            priority: 5, // High priority for VTO
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
 * AI Model job durumunu kontrol eder
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
 * Queue istatistikleri
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
