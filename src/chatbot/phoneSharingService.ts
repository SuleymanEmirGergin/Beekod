import { logger } from "../logger.js";
import { wholesalerService } from "../services/wholesalerService.js";
import { confirmationService } from "./confirmationService.js";
import { auditService } from "./auditService.js";
import { ChatResponse } from "./types.js";

/**
 * Phone Sharing Service
 * 
 * Toptancı ağında telefon numarası paylaşımı için özel akış
 * PAYLAŞ XXXX formatında onay gerektirir
 */
export class PhoneSharingService {
    /**
     * Telefon paylaşımı isteği oluştur
     */
    async requestPhoneSharing(params: {
        sessionId: string;
        userId?: string;
        fromWholesalerId: number;
        toWholesalerId: number;
        barcode?: string;
        productName?: string;
        requestedQty?: number;
        phone: string;
    }): Promise<ChatResponse> {
        logger.info("phoneSharingService.request", {
            sessionId: params.sessionId,
            fromWholesalerId: params.fromWholesalerId,
            toWholesalerId: params.toWholesalerId,
        });

        // Mask phone for display
        const maskedPhone = this.maskPhone(params.phone);

        // Create confirmation
        const confirmation = confirmationService.createPrivacyConfirmation(
            params.sessionId,
            params.userId,
            "Telefon paylaşımı",
            {
                fromWholesalerId: params.fromWholesalerId,
                toWholesalerId: params.toWholesalerId,
                barcode: params.barcode,
                productName: params.productName,
                requestedQty: params.requestedQty,
                phone: params.phone,
                action: "share_phone",
            }
        );

        const message = `🔒 **Telefon Numarası Paylaşımı**

Telefon numaranız (${maskedPhone}) bu mesajla birlikte paylaşılacak.

Alıcı: **Toptancı #${params.toWholesalerId}**
${params.barcode ? `Ürün: ${params.barcode}` : ""}
${params.requestedQty ? `Talep: ${params.requestedQty} adet` : ""}

Onaylamak için yazın:

**PAYLAŞ ${confirmation.code}**

(10 dakika içinde geçerli)`;

        return {
            message,
            requiresConfirmation: true,
            confirmationCode: confirmation.code,
            confirmationType: "privacy",
        };
    }

    /**
     * Telefon paylaşımını onayla ve mesaj gönder
     */
    async confirmPhoneSharing(params: {
        sessionId: string;
        userId?: string;
        confirmationPayload: any;
    }): Promise<ChatResponse> {
        const {
            fromWholesalerId,
            toWholesalerId,
            barcode,
            productName,
            requestedQty,
            phone,
        } = params.confirmationPayload;

        logger.info("phoneSharingService.confirming", {
            sessionId: params.sessionId,
            toWholesalerId,
        });

        // Build message text
        let messageText = "";
        if (barcode) messageText += `Barkod: ${barcode}\n`;
        if (productName) messageText += `Ürün: ${productName}\n`;
        if (requestedQty) messageText += `Talep: ${requestedQty} adet\n`;
        messageText += `\nMerhaba, bu ürün hakkında iletişime geçmek istiyorum.`;
        messageText += `\n\n📞 İletişim: ${phone}`;

        // Send message with phone
        await wholesalerService.sendMessage({
            fromWholesalerId,
            toWholesalerId,
            barcode,
            productName,
            requestedQty,
            messageText,
            includePhone: true,
            senderPhone: phone,
        });

        // Audit log
        await auditService.logMessageSend({
            userId: params.userId,
            sessionId: params.sessionId,
            fromWholesalerId,
            toWholesalerId,
            barcode,
            includePhone: true,
            phone,
        });

        const maskedPhone = this.maskPhone(phone);

        return {
            message: `✅ Mesajınız telefon numaranız (${maskedPhone}) ile birlikte gönderildi.

📬 Alıcı: Toptancı #${toWholesalerId}
${barcode ? `📦 Ürün: ${barcode}` : ""}

Karşı taraf mesajınızı görüntülediğinde iletişime geçebilir.`,
        };
    }

    /**
     * Mask phone number for display (e.g., 0532***4567)
     */
    private maskPhone(phone: string): string {
        if (!phone || phone.length < 7) return phone;

        // Remove non-digits
        const digits = phone.replace(/\D/g, "");

        if (digits.length >= 10) {
            // Turkish format: show first 4 and last 4
            return digits.slice(0, 4) + "***" + digits.slice(-4);
        }

        return phone.slice(0, 3) + "***" + phone.slice(-2);
    }

    /**
     * Validate phone number format
     */
    isValidPhone(phone: string): boolean {
        if (!phone) return false;

        // Remove common formatting
        const cleaned = phone.replace(/[\s\-\(\)]/g, "");

        // Turkish phone: 10-11 digits, starts with 0 or 5
        if (/^0?5\d{9}$/.test(cleaned)) return true;

        // Landline: starts with 0 + area code
        if (/^0[1-4]\d{9}$/.test(cleaned)) return true;

        return false;
    }
}

// Singleton instance
export const phoneSharingService = new PhoneSharingService();
