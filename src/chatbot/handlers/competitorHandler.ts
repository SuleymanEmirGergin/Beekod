import { ChatHandler } from "./baseHandler.js";
import { ChatEntity, HandlerResult } from "../types.js";
import { logger } from "../../logger.js";
import { scrapeProductDetails } from "../../services/webScraperService.js";
import { pool } from "../../db.js";

/**
 * Competitor Handler
 * 
 * Rakip fiyat/satıcı analizi:
 * - competitor_analysis: BuyBox ve diğer satıcıların fiyatlarını gösterir
 */
export class CompetitorHandler implements ChatHandler {
    name = "CompetitorHandler";
    supportedIntents = ["competitor_analysis"];

    async handle(
        entities: ChatEntity,
        _userId?: string,
        _sessionId?: string,
        _intent?: string
    ): Promise<HandlerResult> {
        try {
            logger.info("competitorHandler.executing", { entities });
            return await this.analyzeCompetitors(entities);
        } catch (error) {
            logger.error("competitorHandler.failed", { error, entities });
            return {
                success: false,
                message: "Rakip analizi sırasında hata oluştu.",
            };
        }
    }

    /**
     * Rakip analizi yap
     */
    private async analyzeCompetitors(entities: ChatEntity): Promise<HandlerResult> {
        const barcode = entities.barcode;
        const productName = entities.productName;

        if (!barcode && !productName) {
            return {
                success: false,
                message: "Rakip analizi için barkod veya ürün adı belirtin.\n\nÖrnek: `8690000001234 ürününü kimler satıyor?`",
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

        // Ürün URL'sini bul (marketplace_listings tablosundan)
        const [listingRows] = await pool.execute(
            `SELECT marketplace, url FROM marketplace_listings WHERE barcode = ? AND url IS NOT NULL`,
            [targetBarcode]
        );
        const listings = listingRows as { marketplace: string; url: string }[];

        if (listings.length === 0) {
            return {
                success: false,
                message: `Barkod ${targetBarcode} için pazaryeri kaydı bulunamadı. Önce ürünü bir pazaryerine yükleyin.`,
            };
        }

        // Her pazaryerinden rakip verilerini çek
        const allCompetitors: {
            marketplace: string;
            sellerName: string;
            price: number;
            currency: string;
            shippingInfo?: string;
        }[] = [];

        const marketplacesScraped: string[] = [];

        for (const listing of listings) {
            try {
                const result = await scrapeProductDetails(listing.url, listing.marketplace, {
                    timeout: 30000,
                    retries: 2,
                });

                if (result.competitors && result.competitors.length > 0) {
                    marketplacesScraped.push(listing.marketplace);
                    result.competitors.forEach((comp) => {
                        allCompetitors.push({
                            marketplace: listing.marketplace,
                            sellerName: comp.sellerName,
                            price: comp.price,
                            currency: comp.currency,
                            shippingInfo: comp.shippingInfo,
                        });
                    });
                }
            } catch (error) {
                logger.warn("competitorHandler.scrape_failed", {
                    marketplace: listing.marketplace,
                    error: (error as Error).message,
                });
            }
        }

        if (allCompetitors.length === 0) {
            return {
                success: true,
                message: `📊 **${productDisplayName}** için rakip analizi\n\nBu ürün için diğer satıcı bilgisi bulunamadı veya pazaryerlerinden veri çekilemedi.`,
                data: { barcode: targetBarcode, competitors: [] },
            };
        }

        // Fiyata göre sırala
        allCompetitors.sort((a, b) => a.price - b.price);

        // Sonuçları formatla
        let message = `📊 **Rakip Analizi: ${productDisplayName}**\n`;
        message += `🔍 Barkod: \`${targetBarcode}\`\n\n`;
        message += `| Pazaryeri | Satıcı | Fiyat | Kargo |\n`;
        message += `|-----------|--------|-------|-------|\n`;

        allCompetitors.forEach((comp) => {
            const shipping = comp.shippingInfo || "-";
            message += `| ${comp.marketplace} | ${comp.sellerName} | ${comp.price} ${comp.currency} | ${shipping} |\n`;
        });

        message += `\n📈 **En Düşük Fiyat:** ${allCompetitors[0].price} ${allCompetitors[0].currency} (${allCompetitors[0].sellerName})`;
        message += `\n📉 **En Yüksek Fiyat:** ${allCompetitors[allCompetitors.length - 1].price} ${allCompetitors[allCompetitors.length - 1].currency}`;
        message += `\n👥 **Toplam Satıcı:** ${allCompetitors.length}`;

        return {
            success: true,
            message,
            data: {
                barcode: targetBarcode,
                productName: productDisplayName,
                competitors: allCompetitors,
                lowestPrice: allCompetitors[0].price,
                highestPrice: allCompetitors[allCompetitors.length - 1].price,
                sellerCount: allCompetitors.length,
                marketplacesScraped,
            },
        };
    }
}

// Singleton instance
export const competitorHandler = new CompetitorHandler();
