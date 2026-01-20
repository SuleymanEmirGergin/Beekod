
import { ChatHandler } from "./baseHandler.js";
import { ChatEntity, ChatIntent, HandlerResult, ProductCard } from "../types.js";
import { MarketplaceName } from "../../services/marketplace/types.js";
import { logger } from "../../logger.js";

export class ProductSearchHandler implements ChatHandler {
    name = "productSearchHandler";
    supportedIntents: ChatIntent[] = ["product_search"];

    async handle(
        entities: ChatEntity,
        _userId: string | undefined,
        _sessionId: string,
        _intent: ChatIntent,
        message?: string
    ): Promise<HandlerResult> {
        let query = entities.productName || entities.barcode;

        // If NLU failed to extract product name, try to grab the whole message
        if (!query && message) {
            // Clean common prefixes
            query = message
                .replace(/^(ara|bul|getir|göster)\s+/i, "")
                .replace(/\s+(ara|bul)$/i, "")
                .trim();
        }

        if (!query) {
            return {
                success: false,
                message: "Aramak istediğiniz ürünün adını belirtin.\n\nÖrnek: `iPhone 15 ara`",
            };
        }

        logger.info("productSearchHandler.searching", { query });

        try {
            // Use ProductSearchService (Factory Pattern)
            const { productSearchService } = await import(
                "../../services/productSearchService.js"
            );

            const productCards = await productSearchService.searchProducts(query);

            if (productCards.length === 0) {
                return {
                    success: true,
                    message: `🔍 **"${query}"** için pazaryerlerinde sonuç bulunamadı.\n\nFarklı bir arama terimi deneyin.`,
                };
            }

            // Build response message
            let responseMessage = `🔍 **"${query}"** için **${productCards.length}** sonuç bulundu:\n\n`;
            responseMessage += "Kartlardan ürün detaylarını inceleyebilir, beğendiğinizi **Mağazama Ekle** ile ekleyebilirsiniz.";

            logger.info("productSearchHandler.success", {
                query,
                resultCount: productCards.length,
            });

            return {
                success: true,
                message: responseMessage,
                productCards,
            };
        } catch (error) {
            logger.error("productSearchHandler.error", { query, error });
            return {
                success: false,
                message: "Pazaryeri araması sırasında bir hata oluştu. Lütfen tekrar deneyin.",
            };
        }
    }
}

export const productSearchHandler = new ProductSearchHandler();
