import { Request, Response } from "express";
import * as SessionService from "../../../services/chatSessionService.js";
import { getUserPreferences, updateUserPreferences } from "../../../services/userPreferenceService.js";
import { sendSuccessResponse, sendErrorResponse } from "../../../utils/responseHelper.js";

export const getPreferences = async (req: Request, res: Response) => {
    const sessionKey = SessionService.getSessionKey(req);
    const prefs = getUserPreferences(sessionKey);
    return sendSuccessResponse(res, prefs);
};

export const updatePreferences = async (req: Request, res: Response) => {
    const sessionKey = SessionService.getSessionKey(req);
    const prefs = req.body;
    if (!prefs) {
        return sendErrorResponse({ res, statusCode: 400, message: "Missing preferences", error: "missing_body" });
    }
    // Ideally we should validate prefs here
    await updateUserPreferences(sessionKey, prefs);
    return sendSuccessResponse(res, { success: true });
};
