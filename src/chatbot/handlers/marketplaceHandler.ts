import { ChatHandler } from "./baseHandler.js";
import { ChatEntity, HandlerResult, MarketplaceComparisonCard } from "../types.js";
import { logger } from "../../logger.js";
import { getMarketplaceProvider, getMarketplaceProviders, listMarketplaceProviders } from "../../marketplaces/index.js";
import { MarketplaceName } from "../../marketplaces/types.js";
import { auditService } from "../auditService.js";
import { confirmationService } from "../confirmationService.js";

/**
 * Marketplace Handler
 * 
 * Pazaryeri operasyonları:
 * - marketplace_sync: Pazaryeri senkronizasyon
 * - marketplace_publish: Ürün yayınla
 * - listing_update: Listing güncelle
 * - batch_operation: Toplu işlem
 * - analytics_query: Pazaryeri analitik sorgusu
 */
export class MarketplaceHandler implements ChatHandler {
    name = "MarketplaceHandler";
    supportedIntents = [
        "marketplace_sync",
        "marketplace_publish",
        "listing_update",
        "batch_operation",
        "analytics_query",
    ];

    async handle(
        entities: ChatEntity,
        userId?: string,
        sessionId?: string,
        intent?: string
    ): Promise<HandlerResult> {
        try {
            logger.info("marketplaceHandler.executing", { entities, userId, intent });

            switch (intent) {
                case "marketplace_sync":
                    return await this.syncMarketplace(entities, userId, sessionId);

                case "marketplace_publish":
                    return await this.publishProduct(entities, userId, sessionId);

                case "listing_update":
                    return await this.updateListing(entities, userId, sessionId);

                case "analytics_query":
                    return await this.getMarketplaceAnalytics(entities);

                case "batch_operation":
                    return await this.handleBatchOperation(entities, userId, sessionId);

                default:
                    return {
                        success: false,
                        message: "Bilinmeyen pazaryeri işlemi.",
                    };
            }
        } catch (error) {
            logger.error("marketplaceHandler.failed", { error, entities, intent });
            return {
                success: false,
                message: "Pazaryeri işlemi sırasında hata oluştu.",
            };
        }
    }

    /**
     * Pazaryeri senkronizasyonu
     */
    private async syncMarketplace(
        entities: ChatEntity,
        userId?: string,
        sessionId?: string
    ): Promise<HandlerResult> {
        const { marketplace, barcode } = entities;

        if (!marketplace) {
            // List all marketplace statuses
            const providerList = listMarketplaceProviders();
            const statuses = providerList.map(p => ({
                name: p.name,
                configured: p.configured,
                tokenStatus: p.token,
            }));

            let message = "📊 **Pazaryeri Durumları**\n\n";
            statuses.forEach(s => {
                const icon = s.configured ? "✅" : "❌";
                message += `${icon} **${s.name}**: ${s.configured ? "Bağlı" : "Yapılandırılmamış"}\n`;
            });

            return {
                success: true,
                message,
                data: { statuses },
            };
        }

        // Sync specific marketplace
        const provider = getMarketplaceProvider(marketplace as MarketplaceName);
        if (!provider) {
            return {
                success: false,
                message: `${marketplace} pazaryeri bulunamadı.`,
            };
        }

        if (!provider.isConfigured()) {
            return {
                success: false,
                message: `${marketplace} pazaryeri yapılandırılmamış.`,
            };
        }

        // Get listings from marketplace
        const listResult = await provider.listListings({ barcode });

        if (listResult.status !== "ok") {
            return {
                success: false,
                message: `${marketplace} senkronizasyon hatası: ${listResult.message}`,
            };
        }

        const message = barcode
            ? `✅ **${marketplace}** - Barkod ${barcode} senkronize edildi.`
            : `✅ **${marketplace}** - ${listResult.items.length} ürün çekildi.`;

        return {
            success: true,
            message,
            data: { items: listResult.items },
        };
    }

    /**
     * Ürün yayınla
     */
    private async publishProduct(
        entities: ChatEntity,
        userId?: string,
        sessionId?: string
    ): Promise<HandlerResult> {
        const { marketplace, barcode } = entities;

        if (!barcode) {
            return {
                success: false,
                message: "Yayınlamak için barkod belirtin.",
            };
        }

        // TODO: Get product from database and publish to marketplace
        // This is a placeholder for now

        return {
            success: true,
            message: `📤 Barkod ${barcode} ${marketplace || "tüm pazaryerlerine"} yayınlanmak üzere kuyruğa alındı.`,
            data: { barcode, marketplace, status: "queued" },
        };
    }

    /**
     * Listing güncelle (fiyat/stok)
     */
    private async updateListing(
        entities: ChatEntity,
        userId?: string,
        sessionId?: string
    ): Promise<HandlerResult> {
        const { marketplace, barcode, price, stock } = entities;

        if (!barcode) {
            return {
                success: false,
                message: "Güncellemek için barkod belirtin.",
            };
        }

        if (price === undefined && stock === undefined) {
            return {
                success: false,
                message: "Fiyat veya stok değeri belirtin.",
            };
        }

        const targetMarketplaces = marketplace
            ? [marketplace]
            : ["Trendyol", "Hepsiburada", "N11", "Ciceksepeti", "PttAVM", "Pazarama"];

        const results: any[] = [];

        for (const mp of targetMarketplaces) {
            const provider = getMarketplaceProvider(mp as MarketplaceName);
            if (!provider || !provider.isConfigured()) continue;

            const result = await provider.updateListing({
                barcode,
                price,
                stock,
            });

            results.push({
                marketplace: mp,
                status: result.status,
                message: result.message,
            });
        }

        // Audit log
        if (sessionId) {
            await auditService.log({
                userId,
                sessionId,
                action: "listing_update",
                entity: "product",
                entityId: barcode,
                newValue: { price, stock, marketplaces: targetMarketplaces },
            });
        }

        const successCount = results.filter(r => r.status === "ok" || r.status === "queued").length;

        return {
            success: successCount > 0,
            message: `✅ ${successCount}/${results.length} pazaryerinde güncellendi.`,
            data: { results },
        };
    }

    /**
     * Pazaryeri analitikleri
     */
    private async getMarketplaceAnalytics(entities: ChatEntity): Promise<HandlerResult> {
        const { marketplace, barcode } = entities;

        // Get price comparison across marketplaces
        if (barcode) {
            const comparison = await this.getPriceComparison(barcode);

            if (comparison.length === 0) {
                return {
                    success: true,
                    message: `Barkod ${barcode} için pazaryerlerinde veri bulunamadı.`,
                    marketplaceComparison: [],
                };
            }

            let message = `📊 **Barkod ${barcode} - Pazaryeri Karşılaştırma**\n\n`;
            comparison.forEach(c => {
                const icon = c.available ? "✅" : "❌";
                message += `${icon} **${c.marketplace}**: ${c.price} ${c.currency}`;
                if (c.stock !== undefined) {
                    message += ` (${c.stock} adet)`;
                }
                message += "\n";
            });

            return {
                success: true,
                message,
                marketplaceComparison: comparison,
            };
        }

        return {
            success: true,
            message: "Pazaryeri analizi için barkod belirtin.",
        };
    }

    /**
     * Get price comparison from all marketplaces
     */
    private async getPriceComparison(barcode: string): Promise<MarketplaceComparisonCard[]> {
        const providerInstances = getMarketplaceProviders();
        const comparison: MarketplaceComparisonCard[] = [];

        for (const provider of providerInstances) {
            if (!provider.isConfigured()) continue;

            try {
                const result = await provider.listListings({ barcode });

                if (result.status === "ok" && result.items.length > 0) {
                    const item = result.items[0];
                    comparison.push({
                        marketplace: provider.name as MarketplaceName,
                        price: item.price || 0,
                        stock: item.stock || 0,
                        currency: item.currency || "TRY",
                        available: (item.stock || 0) > 0,
                    });
                }
            } catch (error) {
                logger.error("marketplaceHandler.comparison.error", {
                    marketplace: provider.name,
                    error
                });
            }
        }

        return comparison.sort((a, b) => a.price - b.price);
    }

    /**
     * Toplu işlem (requires confirmation)
     */
    private async handleBatchOperation(
        entities: ChatEntity,
        userId?: string,
        sessionId?: string
    ): Promise<HandlerResult> {
        // Batch operations require confirmation
        return {
            success: false,
            message: "Toplu işlemler için lütfen detay belirtin (örn: 'Tüm stokları %10 artır').",
            requiresConfirmation: true,
            confirmationType: "destructive",
        };
    }
}

// Singleton instance
export const marketplaceHandler = new MarketplaceHandler();
