import { ChatHandler } from "./baseHandler.js";
import { ChatEntity, HandlerResult, WholesalerStockHolder } from "../types.js";
import { logger } from "../../logger.js";
import { wholesalerService } from "../../services/wholesalerService.js";
import { confirmationService } from "../confirmationService.js";

/**
 * Wholesaler Handler
 * 
 * Toptancı ağı operasyonları:
 * - wholesaler_search: Ürün ara (toptancı ağında)
 * - stock_holders_query: Kimde var?
 * - send_message: Platform içi mesaj gönder
 * - request_quote: Fiyat teklifi iste
 * - share_phone: Telefon paylaş (özel onay gerektirir)
 */
export class WholesalerHandler implements ChatHandler {
    name = "WholesalerHandler";
    supportedIntents = [
        "wholesaler_search",
        "stock_holders_query",
        "send_message",
        "request_quote",
        "view_messages",
        "share_phone",
    ];

    async handle(
        entities: ChatEntity,
        userId?: string,
        sessionId?: string,
        intent?: string
    ): Promise<HandlerResult> {
        try {
            logger.info("wholesalerHandler.executing", { entities, userId, intent });

            // Intent'e göre routing
            switch (intent) {
                case "stock_holders_query":
                    return await this.handleStockHoldersQuery(entities, userId);

                case "wholesaler_search":
                    return await this.handleSearch(entities);

                case "send_message":
                case "request_quote":
                    return await this.handleSendMessage(entities, userId, sessionId!);

                default:
                    return {
                        success: false,
                        message: "Bilinmeyen toptancı ağı işlemi.",
                    };
            }
        } catch (error) {
            logger.error("wholesalerHandler.failed", { error, entities, intent });
            return {
                success: false,
                message: "Toptancı ağı işlemi sırasında hata oluştu.",
            };
        }
    }

    /**
     * Kimde var? query
     */
    private async handleStockHoldersQuery(
        entities: ChatEntity,
        userId?: string
    ): Promise<HandlerResult> {
        const barcode = entities.barcode;

        if (!barcode) {
            return {
                success: false,
                message: "Kimde olduğunu sorgulamak için bir barkod belirtin.",
            };
        }

        // Get viewer wholesaler ID (current user)
        const viewerWholesaler = userId
            ? await wholesalerService.getWholesalerByUserId(parseInt(userId))
            : null;

        const viewerWholesalerId = viewerWholesaler?.id;

        // Stock holders listesi
        const stockHolders = await wholesalerService.listStockHolders(barcode, viewerWholesalerId);

        if (stockHolders.length === 0) {
            return {
                success: true,
                message: `Barkod ${barcode} toptancı ağında bulunamadı.`,
                wholesalerList: [],
            };
        }

        // VAR olanları filtrele
        const availableHolders = stockHolders.filter((h) => h.availability === "VAR");

        let message = `**Barkod ${barcode}** için ${stockHolders.length} toptancı bulundu.\n\n`;

        if (availableHolders.length > 0) {
            message += `✅ **Stokta olanlar** (${availableHolders.length}):\n`;
            availableHolders.forEach((h) => {
                message += `- ${h.displayName}`;
                if (h.stockQuantity !== undefined) {
                    message += ` - ${h.stockQuantity} adet`;
                }
                if (h.city) {
                    message += ` (${h.city})`;
                }
                message += "\n";
            });
        }

        const unavailableHolders = stockHolders.filter((h) => h.availability === "YOK");
        if (unavailableHolders.length > 0) {
            message += `\n❌ **Stokta olmayanlar** (${unavailableHolders.length}):\n`;
            unavailableHolders.forEach((h) => {
                message += `- ${h.displayName}`;
                if (h.city) {
                    message += ` (${h.city})`;
                }
                message += "\n";
            });
        }

        message += `\n💬 İstersen VAR olanlara platform içinden mesaj gönderebilirim.`;

        return {
            success: true,
            message,
            wholesalerList: stockHolders,
        };
    }

    /**
     * Toptancı ağında arama
     */
    private async handleSearch(entities: ChatEntity): Promise<HandlerResult> {
        const query =
            entities.productName || entities.barcode || "";

        if (!query) {
            return {
                success: false,
                message: "Aramak için bir ürün adı veya barkod belirtin.",
            };
        }

        const products = await wholesalerService.searchProducts(query);

        if (products.length === 0) {
            return {
                success: true,
                message: `"${query}" için toptancı ağında ürün bulunamadı.`,
            };
        }

        let message = `**"${query}"** için ${products.length} sonuç bulundu:\n\n`;

        // Group by barcode
        const grouped = new Map<string, any[]>();
        products.forEach((p) => {
            if (!grouped.has(p.barcode)) {
                grouped.set(p.barcode, []);
            }
            grouped.get(p.barcode)!.push(p);
        });

        grouped.forEach((items, barcode) => {
            const firstItem = items[0];
            message += `📦 **${firstItem.product_name || barcode}** (${barcode})\n`;
            message += `   ${items.filter((i) => i.is_available).length} / ${items.length} toptancıda stokta\n\n`;
        });

        return {
            success: true,
            message,
            data: { products },
        };
    }

    /**
     * Mesaj gönder
     */
    private async handleSendMessage(
        entities: ChatEntity,
        userId?: string,
        sessionId?: string
    ): Promise<HandlerResult> {
        if (!userId) {
            return {
                success: false,
                message: "Mesaj göndermek için giriş yapmalısınız.",
            };
        }

        // Get sender wholesaler
        const senderWholesaler = await wholesalerService.getWholesalerByUserId(parseInt(userId));

        if (!senderWholesaler) {
            return {
                success: false,
                message: "Toptancı hesabınız bulunamadı.",
            };
        }

        // Validate receiver
        if (!entities.wholesalerId) {
            return {
                success: false,
                message: "Kime mesaj göndereceğinizi belirtin.",
            };
        }

        // Build message
        let messageText = "";

        if (entities.barcode) {
            messageText += `Barkod: ${entities.barcode}\n`;
        }

        if (entities.productName) {
            messageText += `Ürün: ${entities.productName}\n`;
        }

        if (entities.requestedQty) {
            messageText += `Talep: ${entities.requestedQty} adet\n`;
        }

        messageText += `\nMerhaba, bu ürün hakkında bilgi almak istiyorum.`;

        // Send message (without phone by default)
        await wholesalerService.sendMessage({
            fromWholesalerId: senderWholesaler.id,
            toWholesalerId: entities.wholesalerId,
            barcode: entities.barcode,
            productName: entities.productName,
            requestedQty: entities.requestedQty,
            messageText,
            includePhone: false,
        });

        return {
            success: true,
            message: `Mesajınız gönderildi. İstersen numaranı da paylaşabilirim.`,
        };
    }
}

// Singleton instance
export const wholesalerHandler = new WholesalerHandler();
