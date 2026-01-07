import { Router } from "express";
import multer from "multer";
import { requireJsonBody } from "../../middleware/requireJsonBody.js";
import { validateBody } from "../../validation.js";
import { ChatBodySchema } from "../../validation/schemas.js";
import { sendErrorResponse } from "../../utils/responseHelper.js";

import { handleChatMessage } from "./controllers/messageController.js";
import { getHistory } from "./controllers/historyController.js";
import { getDailyBrief } from "./controllers/dailyBriefController.js";
import { getPreferences, updatePreferences } from "./controllers/preferenceController.js";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
});

const router = Router();

router.get("/chat/preferences", requireJsonBody, getPreferences);
router.post("/chat/preferences", requireJsonBody, updatePreferences);
router.get("/chat/history", requireJsonBody, getHistory);
router.get("/chat/daily-brief", requireJsonBody, getDailyBrief);

router.post("/chat", upload.single("image"), async (req, res, next) => {
    // FormData ve JSON için esnek validation
    const isFormData = req.is("multipart/form-data");

    if (isFormData) {
        // FormData için validation'ı atla, multer zaten parse etti
        // Sadece gerekli alanları kontrol et
        if (!req.body?.message && !req.body?.action) {
            return sendErrorResponse({
                res,
                statusCode: 400,
                code: "BAD_REQUEST",
                message: "Either 'message' or 'action' must be provided",
                error: "Missing parameters",
            });
        }
        return next();
    } else {
        // JSON için normal validation
        return validateBody(ChatBodySchema)(req, res, next);
    }
}, handleChatMessage);

export { router as chatRouter };
