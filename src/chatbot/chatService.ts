import crypto from "crypto";
import { pool } from "../db.js";
import { logger } from "../logger.js";
import { runChatCompletion } from "../services/wiroService.js";
import { intentEngine } from "./intentEngine.js";
import { handlerRegistry } from "./handlerRegistry.js";
import { confirmationService } from "./confirmationService.js";
import { auditService } from "./auditService.js";
import {
    ChatMessage,
    ChatSession,
    ChatResponse,
    ChatIntent,
    ChatMode,
} from "./types.js";

/**
 * Chat Service (Main Orchestrator)
 * 
 * Chatbot'un merkezi yönetim katmanı:
 * 1. Session yönetimi
 * 2. Intent detection
 * 3. Handler routing
 * 4. Confirmation system
 * 5. Conversational response generation
 */
export class ChatService {
    /**
     * Ana mesaj işleme fonksiyonu
     */
    async processMessage(
        sessionId: string,
        userId: string | undefined,
        message: string
    ): Promise<ChatResponse> {
        try {
            logger.info("chatService.processing_message", { sessionId, userId, message });

            // 1. Session var mı kontrol et, yoksa oluştur
            await this.ensureSession(sessionId, userId);

            // 2. Save user message
            await this.saveMessage(sessionId, "user", message);

            // 3. Check for confirmation code
            const confirmationCheck = await confirmationService.verifyConfirmation(sessionId, message);

            if (message.match(/^(ONAY|PAYLAŞ)\s+\d{4}$/i)) {
                if (confirmationCheck.verified && confirmationCheck.confirmation) {
                    // Execute confirmed action
                    const result = await this.executeConfirmedAction(
                        confirmationCheck.confirmation,
                        userId,
                        sessionId
                    );

                    // Save assistant response
                    await this.saveMessage(sessionId, "assistant", result.message);

                    return result;
                } else {
                    const errorMsg = confirmationCheck.error || "Onay kodu geçersiz.";
                    await this.saveMessage(sessionId, "assistant", errorMsg);

                    return {
                        message: errorMsg,
                    };
                }
            }

            // 4. Intent detection
            const intentResult = await intentEngine.detectIntent(message, userId);

            logger.info("chatService.intent_detected", {
                intent: intentResult.intent,
                mode: intentResult.mode,
                confidence: intentResult.confidence,
            });

            // 5. Update session mode
            await this.updateSessionMode(sessionId, intentResult.mode);

            // 6. Check if requires confirmation
            if (intentResult.requiresConfirmation) {
                const confirmationResponse = await this.handleConfirmationRequest(
                    intentResult,
                    userId,
                    sessionId
                );

                await this.saveMessage(sessionId, "assistant", confirmationResponse.message, {
                    intent: intentResult.intent,
                    confirmationCode: confirmationResponse.confirmationCode,
                });

                return confirmationResponse;
            }

            // 7. Get handler
            const handler = handlerRegistry.getHandler(intentResult.intent);

            if (!handler) {
                const fallbackMsg = await this.generateFallbackResponse(message);
                await this.saveMessage(sessionId, "assistant", fallbackMsg);

                return {
                    message: fallbackMsg,
                };
            }

            // 8. Execute handler
            const handlerResult = await handler.handle(
                intentResult.entities,
                userId,
                sessionId,
                intentResult.intent,
                message
            );

            // 9. Generate conversational response
            const conversationalResponse = await this.generateConversationalResponse(
                handlerResult,
                intentResult.intent
            );

            // 10. Save assistant message
            await this.saveMessage(sessionId, "assistant", conversationalResponse, {
                intent: intentResult.intent,
                entities: intentResult.entities,
                productCards: handlerResult.productCards,
                marketplaceComparison: handlerResult.marketplaceComparison,
                wholesalerList: handlerResult.wholesalerList,
            });

            return {
                message: conversationalResponse,
                intent: intentResult.intent,
                data: handlerResult.data,
                productCards: handlerResult.productCards,
                marketplaceComparison: handlerResult.marketplaceComparison,
                wholesalerList: handlerResult.wholesalerList,
            };
        } catch (error) {
            logger.error("chatService.process_failed", { error, sessionId, message });

            const errorMsg = "Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.";
            await this.saveMessage(sessionId, "assistant", errorMsg);

            return {
                message: errorMsg,
            };
        }
    }

    /**
     * Session oluştur/kontrol et
     */
    private async ensureSession(sessionId: string, userId?: string): Promise<void> {
        const [rows] = await pool.execute(
            "SELECT id FROM chat_sessions WHERE id = ?",
            [sessionId]
        );

        if ((rows as { id: string }[]).length === 0) {
            // Create new session
            await pool.execute(
                "INSERT INTO chat_sessions (id, user_id, is_active) VALUES (?, ?, TRUE)",
                [sessionId, userId || null]
            );

            logger.info("chatService.session_created", { sessionId, userId });
        }
    }

    /**
     * Session mode güncelle
     */
    private async updateSessionMode(sessionId: string, mode: ChatMode): Promise<void> {
        await pool.execute(
            "UPDATE chat_sessions SET mode = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            [mode, sessionId]
        );
    }

    /**
     * Mesaj kaydet
     */
    private async saveMessage(
        sessionId: string,
        role: "user" | "assistant" | "system",
        content: string,
        metadata?: Record<string, any>
    ): Promise<void> {
        await pool.execute(
            `INSERT INTO chat_messages (session_id, role, content, intent, entities, metadata)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [
                sessionId,
                role,
                content,
                metadata?.intent || null,
                metadata?.entities ? JSON.stringify(metadata.entities) : null,
                metadata ? JSON.stringify(metadata) : null,
            ]
        );
    }

    /**
     * Confirmation request handle et
     */
    private async handleConfirmationRequest(
        intentResult: any,
        userId: string | undefined,
        sessionId: string
    ): Promise<ChatResponse> {
        const type = intentResult.confirmationType || "destructive";

        const confirmation =
            type === "destructive"
                ? confirmationService.createDestructiveConfirmation(
                    sessionId,
                    userId,
                    `${intentResult.intent} işlemi`,
                    intentResult.entities
                )
                : confirmationService.createPrivacyConfirmation(
                    sessionId,
                    userId,
                    "Telefon paylaşımı",
                    intentResult.entities
                );

        const message =
            type === "destructive"
                ? confirmationService.formatDestructiveMessage(confirmation.code, confirmation.action)
                : confirmationService.formatPrivacyMessage(confirmation.code);

        return {
            message,
            requiresConfirmation: true,
            confirmationCode: confirmation.code,
            confirmationType: type,
        };
    }

    /**
     * Confirmed action'ı execute et
     */
    private async executeConfirmedAction(
        confirmation: any,
        userId: string | undefined,
        sessionId: string
    ): Promise<ChatResponse> {
        logger.info("chatService.executing_confirmed_action", {
            action: confirmation.action,
            payload: confirmation.payload,
        });

        // Get intent from payload and re-execute handler
        const intent = confirmation.payload.intent || confirmation.action.split(" ")[0];
        const handler = handlerRegistry.getHandler(intent as ChatIntent);

        if (!handler) {
            return {
                message: "Onaylanan işlem bulunamadı.",
            };
        }

        const result = await handler.handle(confirmation.payload, userId, sessionId, intent);

        return {
            message: result.message,
            data: result.data,
        };
    }

    /**
     * Conversational response oluştur (Gemini 2.0 Flash)
     */
    private async generateConversationalResponse(
        handlerResult: any,
        intent: ChatIntent
    ): Promise<string> {
        // Eğer handler zaten güzel bir mesaj döndüyse, onu kullan
        if (handlerResult.message && handlerResult.message.length > 20) {
            return handlerResult.message;
        }

        // Yoksa Gemini ile generate et
        try {
            const prompt = `Sen Beekod e-ticaret asistanısın. Kullanıcının "${intent}" intent'ine cevap veriyorsun.

Handler sonucu: ${JSON.stringify(handlerResult)}

Doğal, yardımsever ve kısa bir cevap oluştur (max 100 kelime):`;

            const response = await runChatCompletion(prompt, {
                thinkingLevel: "low",
                temperature: 0.7,
                maxOutputTokens: 200,
            });

            return response || handlerResult.message || "İşlem tamamlandı.";
        } catch (error) {
            logger.error("chatService.conversational_response_failed", { error });
            return handlerResult.message || "İşlem tamamlandı.";
        }
    }

    /**
     * Fallback response (intent bulunamadığında)
     */
    private async generateFallbackResponse(message: string): Promise<string> {
        try {
            const prompt = `Sen Beekod e-ticaret asistanısın. Kullanıcı: "${message}"

Yapabileceğin işlemler:
- Ürün ara
- Fiyat sorgula/güncelle
- Stok sorgula/güncelle
- Sipariş sorgula
- Toptancı ağında ara

Kullanıcıya yardımcı ol, kısa ve dostça cevap ver (max 50 kelime):`;

            const response = await runChatCompletion(prompt, {
                thinkingLevel: "low",
                temperature: 0.7,
                maxOutputTokens: 150,
            });

            return response || "Anlamadım, lütfen tekrar eder misiniz?";
        } catch (error) {
            logger.error("chatService.fallback_failed", { error });
            return "Nasıl yardımcı olabilirim?";
        }
    }

    /**
     * Session history getir
     */
    async getHistory(sessionId: string, limit = 50): Promise<ChatMessage[]> {
        const [rows] = await pool.execute(
            `SELECT id, session_id, role, content, intent, entities, metadata, created_at
       FROM chat_messages
       WHERE session_id = ?
       ORDER BY created_at ASC
       LIMIT ?`,
            [sessionId, limit]
        );

        return (rows as any[]).map((row) => ({
            id: row.id,
            sessionId: row.session_id,
            role: row.role,
            content: row.content,
            metadata: {
                intent: row.intent,
                entities: row.entities ? JSON.parse(row.entities) : undefined,
                ...(row.metadata ? JSON.parse(row.metadata) : {}),
            },
            createdAt: row.created_at,
        }));
    }

    /**
     * User'ın tüm session'larını getir
     */
    async getUserSessions(userId: string): Promise<ChatSession[]> {
        const [rows] = await pool.execute(
            `SELECT * FROM chat_sessions WHERE user_id = ? ORDER BY updated_at DESC LIMIT 20`,
            [userId]
        );

        return rows as ChatSession[];
    }
}

// Singleton instance
export const chatService = new ChatService();
