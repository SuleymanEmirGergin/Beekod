import { Request, Response } from "express";
import * as SessionService from "../../../services/chatSessionService.js";
import { generateDailyBrief } from "../../../services/dailyBriefService.js";
import { sendSuccessResponse, sendErrorResponse } from "../../../utils/responseHelper.js";
import { logger } from "../../../logger.js";
import { Locale } from "../../../types.js";

export const getDailyBrief = async (req: Request, res: Response) => {
    const sessionKey = SessionService.getSessionKey(req);
    const locale = (req.query.locale as Locale) || "tr";

    try {
        const brief = await generateDailyBrief(sessionKey, locale);
        return sendSuccessResponse(res, { brief });
    } catch (error) {
        logger.error("chat.daily_brief_failed", { sessionKey, err: error });
        return sendErrorResponse({ res, statusCode: 500, message: "Brief generation failed", error: "generation_failed" });
    }
};
