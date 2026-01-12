import express from "express";
import crypto from "crypto";
import { chatService } from "../chatbot/chatService.js";
import { logger } from "../logger.js";

const router = express.Router();

/**
 * POST /api/chat/message
 * Ana chat endpoint
 */
router.post("/message", async (req, res) => {
    try {
        const { sessionId, userId, message } = req.body;

        if (!message || typeof message !== "string") {
            return res.status(400).json({
                error: "Message is required",
            });
        }

        // SessionId yoksa oluştur
        const finalSessionId = sessionId || crypto.randomUUID();

        // Process message
        const response = await chatService.processMessage(finalSessionId, userId, message);

        return res.json({
            success: true,
            data: {
                sessionId: finalSessionId,
                ...response,
            },
        });
    } catch (error: any) {
        logger.error("chatRoutes.message_failed", {
            error: error?.message || error,
            stack: error?.stack
        });
        return res.status(500).json({
            success: false,
            error: {
                code: "CHAT_MESSAGE_FAILED",
                message: "Failed to process message",
                details: error?.message || String(error),
            },
        });
    }
});

/**
 * GET /api/chat/sessions/:sessionId
 * Session history
 */
router.get("/sessions/:sessionId", async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { limit } = req.query;

        const history = await chatService.getHistory(
            sessionId,
            limit ? parseInt(limit as string) : 50
        );

        return res.json({
            success: true,
            data: {
                sessionId,
                messages: history,
            },
        });
    } catch (error) {
        logger.error("chatRoutes.get_history_failed", { error });
        return res.status(500).json({
            success: false,
            error: {
                code: "CHAT_HISTORY_FAILED",
                message: "Failed to get chat history",
            },
        });
    }
});

/**
 * GET /api/chat/sessions
 * User's all sessions
 */
router.get("/sessions", async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "USER_ID_REQUIRED",
                    message: "userId is required",
                },
            });
        }

        const sessions = await chatService.getUserSessions(userId as string);

        return res.json({
            success: true,
            data: {
                sessions,
            },
        });
    } catch (error) {
        logger.error("chatRoutes.get_sessions_failed", { error });
        return res.status(500).json({
            success: false,
            error: {
                code: "CHAT_SESSIONS_FAILED",
                message: "Failed to get sessions",
            },
        });
    }
});

export default router;
