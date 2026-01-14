import { ChatHandler } from "./baseHandler.js";
import { ChatEntity, HandlerResult } from "../types.js";
import { logger } from "../../logger.js";
import { pool } from "../../db.js";
import { getMarketplaceProvider } from "../../services/marketplace/index.js";
import { MarketplaceName } from "../../services/marketplace/types.js";

/**
 * Review Handler
 * 
 * Ürün yorumları sorgulama:
 * - review_query: Pazaryerlerinden ürün yorumlarını çeker
 */
export class ReviewHandler implements ChatHandler {
    name = "ReviewHandler";
    supportedIntents = ["review_query"];

    async handle(
        entities: ChatEntity,
        _userId?: string,
        _sessionId?: string,
        _intent?: string
    ): Promise<HandlerResult> {
        try {
            logger.info("reviewHandler.executing", { entities });
            return await this.queryReviews(entities);
        } catch (error) {
            logger.error("reviewHandler.failed", { error, entities });
            return {
                success: false,
                message: "Yorum sorgulama sırasında hata oluştu.",
            };
        }
    }

    /**
     * Ürün yorumlarını sorgula
     */
    private async queryReviews(entities: ChatEntity): Promise<HandlerResult> {
        const barcode = entities.barcode;
        const productName = entities.productName;
        const marketplace = entities.marketplace;

        if (!barcode && !productName) {
            return {
                success: false,
                message: "Yorum sorgulamak için barkod veya ürün adı belirtin.\n\nÖrnek: `8690000001234 ürünü hakkında yorumlar`",
            };
        }

        // Eğer sadece productName varsa, veritabanından barkod bulmaya çalış
        let targetBarcode = barcode;
        let productDisplayName = productName || barcode;

        if (!targetBarcode && productName) {
            const [rows] = await pool.execute(
                "SELECT barcode, name FROM products WHERE name LIKE ? LIMIT 1",
                [`%${productName}%`]
            );
            const products = rows as { barcode: string; name: string }[];
            if (products.length > 0) {
                targetBarcode = products[0].barcode;
                productDisplayName = products[0].name;
            } else {
                return {
                    success: false,
                    message: `"${productName}" ile eşleşen ürün bulunamadı. Lütfen barkod ile deneyin.`,
                };
            }
        }

        // Hangi pazaryerlerinden yorum çekileceğini belirle
        const marketplacesToQuery: MarketplaceName[] = marketplace
            ? [marketplace]
            : ["Trendyol", "Hepsiburada", "N11"];

        const allReviews: {
            marketplace: string;
            reviewerName?: string;
            rating: number;
            comment: string;
            date: string;
        }[] = [];

        const reviewStats: {
            marketplace: string;
            averageRating: number;
            totalReviews: number;
        }[] = [];

        // Her pazaryerinden yorum çek
        for (const mp of marketplacesToQuery) {
            try {
                const provider = getMarketplaceProvider(mp);
                if (!provider || !provider.getProductReviews) {
                    continue;
                }

                const result = await provider.getProductReviews(targetBarcode!);
                
                if (result.ok && result.value.reviews && result.value.reviews.length > 0) {
                    const reviews = result.value.reviews;
                    
                    // İstatistikleri hesapla
                    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
                    reviewStats.push({
                        marketplace: mp,
                        averageRating: Math.round(avgRating * 10) / 10,
                        totalReviews: reviews.length,
                    });

                    // İlk 3 yorumu al
                    reviews.slice(0, 3).forEach((review) => {
                        allReviews.push({
                            marketplace: mp,
                            reviewerName: review.reviewerName,
                            rating: review.rating,
                            comment: review.comment,
                            date: review.date,
                        });
                    });
                }
            } catch (error) {
                logger.warn("reviewHandler.fetch_failed", {
                    marketplace: mp,
                    error: (error as Error).message,
                });
            }
        }

        if (allReviews.length === 0) {
            return {
                success: true,
                message: `📝 **${productDisplayName}** için yorum bulunamadı.\n\nBu ürün için pazaryerlerinde henüz yorum yapılmamış olabilir veya API erişimi kısıtlı olabilir.`,
                data: { barcode: targetBarcode, reviews: [] },
            };
        }

        // Sonuçları formatla
        let message = `📝 **Ürün Yorumları: ${productDisplayName}**\n`;
        message += `🔍 Barkod: \`${targetBarcode}\`\n\n`;

        // İstatistik özeti
        if (reviewStats.length > 0) {
            message += `**📊 Özet:**\n`;
            reviewStats.forEach((stat) => {
                const stars = "⭐".repeat(Math.round(stat.averageRating));
                message += `- ${stat.marketplace}: ${stars} (${stat.averageRating}/5) - ${stat.totalReviews} yorum\n`;
            });
            message += `\n`;
        }

        // Örnek yorumlar
        message += `**💬 Son Yorumlar:**\n\n`;
        allReviews.forEach((review, index) => {
            const stars = "⭐".repeat(review.rating);
            message += `**${index + 1}. ${review.marketplace}** - ${stars}\n`;
            if (review.reviewerName) {
                message += `_${review.reviewerName}_\n`;
            }
            message += `"${review.comment.substring(0, 150)}${review.comment.length > 150 ? "..." : ""}"\n\n`;
        });

        return {
            success: true,
            message,
            data: {
                barcode: targetBarcode,
                productName: productDisplayName,
                reviews: allReviews,
                stats: reviewStats,
            },
        };
    }
}

// Singleton instance
export const reviewHandler = new ReviewHandler();
