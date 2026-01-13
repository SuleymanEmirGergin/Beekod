import { ChatHandler } from "./baseHandler.js";
import { ChatEntity, HandlerResult, ProductCard } from "../types.js";
import { logger } from "../../logger.js";
import { unifiedMarketplaceSearch } from "../../services/search/unifiedMarketplaceSearch.js";

/**
 * Search Handler
 * 
 * Ürün arama (6 pazaryerinde)
 * Aksesuar filtreleme mantığı built-in
 */
export class SearchHandler implements ChatHandler {
    name = "SearchHandler";
    supportedIntents = ["product_search", "product_import"];

    async handle(entities: ChatEntity, userId?: string, sessionId?: string): Promise<HandlerResult> {
        try {
            logger.info("searchHandler.executing", { entities, userId });

            // Query oluştur
            const query = this.buildSearchQuery(entities);

            if (!query) {
                return {
                    success: false,
                    message: "Aranacak ürün adı veya barkod belirtilmedi.",
                };
            }

            // Unified marketplace search (6 pazaryeri)
            const resultsResult = await unifiedMarketplaceSearch(query, entities);
            const results = resultsResult.ok ? resultsResult.value : [];

            if (results.length === 0) {
                return {
                    success: true,
                    message: "Pazaryerlerinde bu ürün bulunamadı.",
                    productCards: [],
                };
            }

            // Convert to ProductCard format
            const productCards: ProductCard[] = results.map((r) => ({
                name: r.title,
                price: r.price,
                currency: r.currency,
                imageUrl: r.image,
                marketplace: r.site as any,
                url: r.url,
                canImport: true, // Mağazama Ekle butonu
            }));

            logger.info("searchHandler.results_found", {
                query,
                resultCount: productCards.length,
            });

            return {
                success: true,
                message: `${productCards.length} ürün bulundu:`,
                productCards,
            };
        } catch (error) {
            logger.error("searchHandler.failed", { error, entities });
            return {
                success: false,
                message: "Arama sırasında hata oluştu.",
            };
        }
    }

    /**
     * Search query builder
     */
    private buildSearchQuery(entities: ChatEntity): string {
        if (entities.barcode) {
            return entities.barcode;
        }

        if (entities.productName) {
            return entities.productName;
        }

        return "";
    }
}

// Singleton instance
export const searchHandler = new SearchHandler();
