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
        const { getProductByBarcode } = await import("../../services/productService.js");
        const product = await getProductByBarcode(barcode);

        if (!product) {
            return {
                success: false,
                message: `Barkod ${barcode} sistemde bulunamadı. Önce ürünü ekleyin.`,
            };
        }

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
                    name: product.name, // Ensure required 'name' field
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
        const totalCount = results.filter(r => r.status !== "skipped").length;

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

        const results: any[] = [];

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
        const { marketplace, barcode } = entities;

        // If no specific barcode, show cross-marketplace summary
        if (!barcode) {
            return await this.getCrossMarketplaceSummary();
        }

        // Get price comparison across marketplaces for specific barcode
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

    /**
     * Get cross-marketplace price summary
     */
    private async getCrossMarketplaceSummary(): Promise<HandlerResult> {
        const fs = await import("fs");
        const path = await import("path");
        
        // Try to read the price comparison report
        const reportPath = path.join(process.cwd(), "price_comparison_report.json");
        
        try {
            if (fs.existsSync(reportPath)) {
                const reportData = JSON.parse(fs.readFileSync(reportPath, "utf-8"));
                
                let message = "📊 **Pazaryerleri Arası Fiyat Karşılaştırması**\n\n";
                
                // Summary by marketplace
                message += "**📈 Ortalama Fiyatlar:**\n";
                const summary = reportData.summary?.byMarketplace || {};
                const sortedMPs = Object.entries(summary).sort((a: any, b: any) => a[1].avgPrice - b[1].avgPrice);
                
                for (const [mp, data] of sortedMPs as [string, { count: number; avgPrice: number }][]) {
                    const cheapIcon = sortedMPs[0][0] === mp ? "💰" : "";
                    message += `  ${cheapIcon} **${mp}**: ${data.avgPrice.toFixed(2)}₺ (${data.count} ürün)\n`;
                }
                
                // Top differences
                if (reportData.topDifferences?.length > 0) {
                    message += "\n**🔥 En Büyük Fiyat Farkları:**\n";
                    const top5 = reportData.topDifferences.slice(0, 5);
                    for (const diff of top5) {
                        message += `  • ${diff.title?.substring(0, 35)}...\n`;
                        message += `    ${diff.cheapestAt}: ${diff.minPrice}₺ vs diğerleri: ${diff.maxPrice}₺ (**${diff.priceDiff.toFixed(0)}₺ fark**)\n`;
                    }
                }
                
                message += `\n📅 Rapor: ${new Date(reportData.timestamp).toLocaleString("tr-TR")}`;
                message += `\n🔢 Toplam: ${reportData.totalProducts} ürün, ${reportData.comparisonsFound} eşleşme`;
                
                return {
                    success: true,
                    message,
                    data: reportData,
                };
            }
        } catch (err) {
            logger.error("marketplaceHandler.getCrossMarketplaceSummary.error", { error: err });
        }
        
        // If no report, generate one on-the-fly with live data
        return await this.generateLivePriceComparison();
    }
    
    /**
     * Generate live price comparison from all marketplaces
     */
    private async generateLivePriceComparison(): Promise<HandlerResult> {
        const providerInstances = getMarketplaceProviders();
        const allProducts: { mp: string; barcode: string; price: number; stock: number }[] = [];
        
        let message = "📊 **Canlı Pazaryeri Analizi**\n\n";
        
        for (const provider of providerInstances) {
            if (!provider.isConfigured()) continue;
            
            try {
                const result = await provider.listListings({ size: 50 });
                if (result.status === "ok" && result.items.length > 0) {
                    for (const item of result.items) {
                        allProducts.push({
                            mp: provider.name,
                            barcode: item.barcode,
                            price: item.price || 0,
                            stock: item.stock || 0,
                        });
                    }
                    message += `✅ **${provider.name}**: ${result.items.length} ürün\n`;
                }
            } catch (err) {
                message += `❌ **${provider.name}**: Bağlantı hatası\n`;
            }
        }
        
        // Calculate average prices per marketplace
        const mpStats = new Map<string, { count: number; total: number }>();
        for (const p of allProducts) {
            if (!mpStats.has(p.mp)) mpStats.set(p.mp, { count: 0, total: 0 });
            const stat = mpStats.get(p.mp)!;
            stat.count++;
            stat.total += p.price;
        }
        
        message += "\n**📈 Ortalama Fiyatlar:**\n";
        for (const [mp, stat] of mpStats) {
            const avg = stat.total / stat.count;
            message += `  • ${mp}: ${avg.toFixed(2)}₺\n`;
        }
        
        return {
            success: true,
            message,
            data: { totalProducts: allProducts.length, byMarketplace: Object.fromEntries(mpStats) },
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

        // Map SearchResult to ProductCard/MarketplaceComparisonCard
        const productCards = foundProducts.map(p => ({
            name: p.title,
            price: p.price,
            currency: p.currency || "TRY",
            imageUrl: p.image,
            marketplace: p.site as MarketplaceName,
            url: p.url,
            barcode: p.barcode,
            canImport: true // Allow importing found products to user's shop
        }));

        const comparison = foundProducts.map(p => ({
            marketplace: p.site as MarketplaceName,
            price: p.price,
            stock: p.stockCount ?? (p.inStock ? 100 : 0),
            currency: p.currency || "TRY",
            available: p.inStock,
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
