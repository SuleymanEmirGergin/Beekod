import { ChatHandler } from "./baseHandler.js";
import { ChatEntity, HandlerResult, MarketplaceComparisonCard } from "../types.js";
import { logger } from "../../logger.js";
import { getMarketplaceProvider, getMarketplaceProviders, listMarketplaceProviders } from "../../services/marketplace/index.js";
import { MarketplaceName } from "../../services/marketplace/types.js";
import { auditService } from "../auditService.js";

/**
 * Marketplace Handler
 * 
 * Pazaryeri operasyonları:
 * - marketplace_sync: Pazaryeri senkronizasyon
 * - marketplace_publish: Ürün yayınla
 * - listing_update: Listing güncelle
 * - batch_operation: Toplu işlem
 * - analytics_query: Pazaryeri analitik sorgusu
 * - order_sync: Sipariş senkronizasyonu
 */
export class MarketplaceHandler implements ChatHandler {
    name = "MarketplaceHandler";
    supportedIntents = [
        "marketplace_sync",
        "marketplace_publish",
        "listing_update",
        "batch_operation",
        "analytics_query",
        "product_search",
        "order_sync",
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

                case "order_sync":
                    return await this.syncOrders();

                case "marketplace_publish":
                    return await this.publishProduct(entities, userId, sessionId);

                case "listing_update":
                    return await this.updateListing(entities, userId, sessionId);

                case "analytics_query":
                    return await this.getMarketplaceAnalytics(entities);

                case "batch_operation":
                    return await this.handleBatchOperation(entities, userId, sessionId);

                case "product_search":
                    return await this.handleProductSearch(entities);
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
     * Siparişleri senkronize et
     */
    private async syncOrders(): Promise<HandlerResult> {
        const { marketplaceOrderSyncService } = await import("../../services/marketplaceOrderSyncService.js");
        const results = await marketplaceOrderSyncService.syncAllOrders();

        let message = "📦 **Sipariş Senkronizasyonu Tamamlandı**\n\n";
        results.forEach((r: { marketplace: string; error?: string; fetched?: number; created?: number }) => {
            if (r.error) {
                message += `❌ **${r.marketplace}**: Hata (${r.error})\n`;
            } else {
                message += `✅ **${r.marketplace}**: ${r.fetched} sipariş bulundu, ${r.created} yeni sipariş eklendi.\n`;
            }
        });

        return {
            success: true,
            message,
            data: { results }
        };
    }

    /**
     * Pazaryeri senkronizasyonu
     */
    private async syncMarketplace(
        entities: ChatEntity,
        _userId?: string,
        _sessionId?: string
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
        const result = await provider.listListings({ barcode });

        if (!result.ok) {
            return {
                success: false,
                message: `${marketplace} senkronizasyon hatası: ${result.error.message}`,
            };
        }

        const items = result.value.items;
        const message = barcode
            ? `✅ **${marketplace}** - Barkod ${barcode} senkronize edildi.`
            : `✅ **${marketplace}** - ${items.length} ürün çekildi.`;

        return {
            success: true,
            message,
            data: { items },
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

        // Get product from database
        const { getProductByBarcode } = await import("../../services/product/productService.js");
        const productResult = await getProductByBarcode(barcode);
        if (!productResult.ok) {
            return {
                success: false,
                message: `Barkod ${barcode} sistemde bulunamadı. Önce ürünü ekleyin.`,
            };
        }
        const product = productResult.value;

        // Prepare payload for marketplace
        const payload = {
            barcode: product.barcode,
            title: product.name,
            description: product.description || "",
            price: product.price,
            stock: product.stock,
            currency: product.currency || "TRY",
            images: product.images || [],
            brand: product.brand || "",
            category: product.category || "",
            attributes: product.attributes || {},
        };

        // Determine target marketplaces
        const targetMarketplaces = marketplace
            ? [marketplace as MarketplaceName]
            : (["Trendyol", "Hepsiburada", "N11", "Ciceksepeti"] as MarketplaceName[]);

        const results: { marketplace: string; status: string; message?: string }[] = [];

        for (const mp of targetMarketplaces) {
            const provider = getMarketplaceProvider(mp);
            if (!provider || !provider.isConfigured()) {
                results.push({ marketplace: mp, status: "skipped", message: "Yapılandırılmamış" });
                continue;
            }

            try {
                const result = await provider.upsertProduct({
                    ...payload,
                    name: product.name,
                });
                
                if (result.ok) {
                    results.push({
                        marketplace: mp,
                        status: "ok",
                        message: result.value.message,
                    });
                } else {
                    results.push({
                        marketplace: mp,
                        status: "failed",
                        message: result.error.message,
                    });
                }
            } catch (error) {
                logger.error("marketplaceHandler.publish.error", { marketplace: mp, error });
                results.push({
                    marketplace: mp,
                    status: "error",
                    message: error instanceof Error ? error.message : "Bilinmeyen hata",
                });
            }
        }

        // Audit log
        if (sessionId) {
            await auditService.log({
                userId,
                sessionId,
                action: "marketplace_publish",
                entity: "product",
                entityId: barcode,
                newValue: { marketplaces: targetMarketplaces, results },
            });
        }

        const successCount = results.filter(r => r.status === "ok" || r.status === "queued").length;

        let message = `📤 **${product.name}** (${barcode})\n\n`;
        results.forEach(r => {
            const icon = r.status === "ok" || r.status === "queued" ? "✅" : r.status === "skipped" ? "⏭️" : "❌";
            message += `${icon} ${r.marketplace}: ${r.message || r.status}\n`;
        });

        return {
            success: successCount > 0,
            message,
            data: { barcode, results },
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

        const results: { marketplace: string; status: string; message: string }[] = [];

        for (const mp of targetMarketplaces) {
            const provider = getMarketplaceProvider(mp as MarketplaceName);
            if (!provider || !provider.isConfigured()) continue;

            const result = await provider.updateListing({
                barcode,
                price,
                stock,
            });

            if (result.ok) {
                results.push({
                    marketplace: mp,
                    status: "ok",
                    message: result.value.message,
                });
            } else {
                results.push({
                    marketplace: mp,
                    status: "failed",
                    message: result.error.message,
                });
            }
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
        const { barcode } = entities;

        if (!barcode) {
            return await this.getCrossMarketplaceSummary();
        }

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

    private async getCrossMarketplaceSummary(): Promise<HandlerResult> {
        const providers = listMarketplaceProviders();
        let message = "🌐 **Genel Pazaryeri Özeti**\n\n";
        
        for (const p of providers) {
            const icon = p.configured ? "✅" : "❌";
            message += `${icon} **${p.name}**: ${p.configured ? "Bağlı" : "Bağlı Değil"}\n`;
        }

        return {
            success: true,
            message,
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

                if (result.ok && result.value.items.length > 0) {
                    const item = result.value.items[0];
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
     * Evrensel Ürün Arama (Unified Search)
     */
    private async handleProductSearch(entities: ChatEntity): Promise<HandlerResult> {
        const query = entities.productName || entities.barcode;
        if (!query) {
            return {
                success: false,
                message: "Aramak istediğiniz ürünün adını veya barkodunu belirtin.",
            };
        }

        const { unifiedMarketplaceSearch } = await import("../../services/search/unifiedMarketplaceSearch.js");
        const result = await unifiedMarketplaceSearch(query, entities);

        if (!result.ok) {
            return {
                success: false,
                message: "Ürün araması sırasında bir hata oluştu: " + result.error.message,
            };
        }

        const foundProducts = result.value;
        if (foundProducts.length === 0) {
            return {
                success: true,
                message: `🔍 **"${query}"** için herhangi bir pazaryerinde sonuç bulunamadı.`,
            };
        }

        const productCards = foundProducts.map(p => ({
            name: p.title,
            price: p.price,
            currency: p.currency || "TRY",
            imageUrl: p.image,
            marketplace: p.marketplace as MarketplaceName,
            url: p.url,
            barcode: p.barcode,
            canImport: true
        }));

        const comparison = foundProducts.map(p => ({
            marketplace: p.marketplace as MarketplaceName,
            price: p.price,
            stock: p.stockCount ?? (p.inStock ? 100 : 0),
            currency: p.currency || "TRY",
            available: p.inStock ?? false,
            url: p.url
        }));

        let message = `🔍 **"${query}"** araması için **${foundProducts.length}** pazaryerinde sonuç bulundu:\n\n`;
        message += "Aşağıdaki kartlardan ürün detaylarını inceleyebilir ve karşılaştırma yapabilirsiniz.";

        return {
            success: true,
            message,
            productCards,
            marketplaceComparison: comparison
        };
    }

    /**
     * Toplu işlem (requires confirmation)
     */
    private async handleBatchOperation(
        _entities: ChatEntity,
        _userId?: string,
        _sessionId?: string
    ): Promise<HandlerResult> {
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
