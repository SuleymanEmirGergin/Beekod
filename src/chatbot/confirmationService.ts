import crypto from "crypto";
import { logger } from "../logger.js";
import { PendingConfirmation } from "./types.js";

/**
 * Confirmation Service
 * 
 * 2 tip onay mekanizması:
 * 1. DESTRUCTIVE (Yıkıcı/Toplu İşlemler): "ONAY 4831"
 * 2. PRIVACY (Kişisel Veri Paylaşımı): "PAYLAŞ 7392"
 */
export class ConfirmationService {
    private pendingConfirmations = new Map<string, PendingConfirmation>();

    /**
     * Yıkıcı işlem için onay kodu oluştur
     */
    createDestructiveConfirmation(
        sessionId: string,
        userId: string | undefined,
        action: string,
        payload: Record<string, unknown>
    ): PendingConfirmation {
        const code = this.generateConfirmationCode();
        const id = crypto.randomUUID();

        const confirmation: PendingConfirmation = {
            id,
            sessionId,
            userId,
            type: "destructive",
            code,
            action,
            payload,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 dakika
            createdAt: new Date(),
        };

        this.pendingConfirmations.set(id, confirmation);

        logger.info("confirmationService.destructive_created", {
            sessionId,
            action,
            code,
            expiresAt: confirmation.expiresAt,
        });

        return confirmation;
    }

    /**
     * Kişisel veri paylaşımı için onay kodu oluştur
     */
    createPrivacyConfirmation(
        sessionId: string,
        userId: string | undefined,
        action: string,
        payload: Record<string, unknown>
    ): PendingConfirmation {
        const code = this.generateConfirmationCode();
        const id = crypto.randomUUID();

        const confirmation: PendingConfirmation = {
            id,
            sessionId,
            userId,
            type: "privacy",
            code,
            action,
            payload,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 dakika
            createdAt: new Date(),
        };

        this.pendingConfirmations.set(id, confirmation);

        logger.info("confirmationService.privacy_created", {
            sessionId,
            action,
            code,
            expiresAt: confirmation.expiresAt,
        });

        return confirmation;
    }

    /**
     * Onay kodunu doğrula
     * 
     * @param sessionId - Session ID
     * @param userInput - Kullanıcının yazdığı: "ONAY 4831" veya "PAYLAŞ 7392"
     */
    async verifyConfirmation(
        sessionId: string,
        userInput: string
    ): Promise<{ verified: boolean; confirmation?: PendingConfirmation; error?: string }> {
        // Parse input
        const destructiveMatch = userInput.match(/^ONAY\s+(\d{4})$/i);
        const privacyMatch = userInput.match(/^PAYLAŞ\s+(\d{4})$/i);

        if (!destructiveMatch && !privacyMatch) {
            return {
                verified: false,
                error: "Geçersiz format. 'ONAY 4831' veya 'PAYLAŞ 7392' formatında yazın.",
            };
        }

        const code = destructiveMatch ? destructiveMatch[1] : privacyMatch![1];
        const expectedType = destructiveMatch ? "destructive" : "privacy";

        // Find matching confirmation
        const confirmation = Array.from(this.pendingConfirmations.values()).find(
            (c) => c.sessionId === sessionId && c.code === code && c.type === expectedType
        );

        if (!confirmation) {
            logger.warn("confirmationService.code_not_found", { sessionId, code, type: expectedType });
            return {
                verified: false,
                error: "Onay kodu bulunamadı veya geçersiz.",
            };
        }

        // Check expiration
        if (confirmation.expiresAt < new Date()) {
            this.pendingConfirmations.delete(confirmation.id);
            logger.warn("confirmationService.code_expired", { sessionId, code });
            return {
                verified: false,
                error: "Onay kodu süresi doldu. Lütfen işlemi tekrar başlatın.",
            };
        }

        // Success - remove confirmation
        this.pendingConfirmations.delete(confirmation.id);

        logger.info("confirmationService.verified", {
            sessionId,
            action: confirmation.action,
            type: confirmation.type,
        });

        return {
            verified: true,
            confirmation,
        };
    }

    /**
     * Pending confirmation'ı getir (sessionId'ye göre son oluşturulan)
     */
    getPendingConfirmation(sessionId: string): PendingConfirmation | null {
        const confirmations = Array.from(this.pendingConfirmations.values())
            .filter((c) => c.sessionId === sessionId && c.expiresAt > new Date())
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        return confirmations[0] || null;
    }

    /**
     * Tüm bekleyen onayları temizle (testler için)
     */
    clearAll(): void {
        this.pendingConfirmations.clear();
    }

    /**
     * Tüm expired confirmations'ı temizle
     */
    cleanupExpired(): void {
        const now = new Date();
        let cleanedCount = 0;

        for (const [id, confirmation] of this.pendingConfirmations.entries()) {
            if (confirmation.expiresAt < now) {
                this.pendingConfirmations.delete(id);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            logger.info("confirmationService.cleanup", { cleanedCount });
        }
    }

    /**
     * 4 haneli rastgele onay kodu oluştur
     */
    private generateConfirmationCode(): string {
        return Math.floor(1000 + Math.random() * 9000).toString();
    }

    /**
     * Destructive confirmation mesajı oluştur
     */
    formatDestructiveMessage(code: string, action: string): string {
        return `⚠️ **Onay Gerekiyor**

İşlem: **${action}**

Bu işlem birden fazla ürünü/kaydı etkileyecek. Devam etmek için aşağıdaki kodu yazın:

**ONAY ${code}**

(5 dakika içinde geçerli)`;
    }

    /**
     * Privacy confirmation mesajı oluştur
     */
    formatPrivacyMessage(code: string, dataType: string = "telefon numaranız"): string {
        return `🔒 **Kişisel Veri Paylaşımı**

${dataType} bu mesajla paylaşılacak.

Onaylamak için aşağıdaki kodu yazın:

**PAYLAŞ ${code}**

(10 dakika içinde geçerli)`;
    }
}

// Singleton instance
export const confirmationService = new ConfirmationService();

// Cleanup expired confirmations every 5 minutes
setInterval(() => {
    confirmationService.cleanupExpired();
}, 5 * 60 * 1000);
