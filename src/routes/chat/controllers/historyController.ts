import { Request, Response } from "express";
import * as SessionService from "../../../services/chatSessionService.js";
import { generateDailyBrief } from "../../../services/dailyBriefService.js";
import { sendSuccessResponse } from "../../../utils/responseHelper.js";
import { Locale } from "../../../types.js";

export const getHistory = async (req: Request, res: Response) => {
    const sessionKey = SessionService.getSessionKey(req);
    const locale = (req.query.locale as Locale) || "tr";

    // Try to generate daily brief if not already done today (Proactive check removed/commented out logic kept minimal here)
    // Logic from original file was mostly disabled/commented out regarding proactive brief sending on history fetch.
    // We keep the structure but cleaned up.

    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const history = await SessionService.getHistory(sessionKey, limit);
    return sendSuccessResponse(res, history);
};
