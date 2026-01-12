import { ChatHandler } from "./baseHandler.js";
import { ChatEntity, HandlerResult } from "../types.js";
import { logger } from "../../logger.js";
import { pool } from "../../db.js";
import { auditService } from "../auditService.js";

/**
 * Price Handler
 * 
 * Fiyat sorgu/güncelleme işlemleri
 * - price_query: Fiyat sorgula
 * - price_update: Fiyat güncelle (audit log zorunlu)
 */
export class PriceHandler implements ChatHandler {
    name = "PriceHandler";
    supportedIntents = ["price_query", "price_update"];

    async handle(
        entities: ChatEntity,
        userId?: string,
        sessionId?: string,
        intent?: string
    ): Promise<HandlerResult> {
        try {
            logger.info("priceHandler.executing", { entities, userId, intent });

            if (intent === "price_query") {
                return await this.queryPrice(entities);
            } else if (intent === "price_update") {
                return await this.updatePrice(entities, userId!, sessionId!);
            }

            return {
                success: false,
                message: "Bilinmeyen fiyat işlemi.",
            };
        } catch (error) {
            logger.error("priceHandler.failed", { error, entities, intent });
            return {
                success: false,
                message: "Fiyat işlemi sırasında hata oluştu.",
            };
        }
    }

    /**
     * Fiyat sorgula
     */
    private async queryPrice(entities: ChatEntity): Promise<HandlerResult> {
        const barcode = entities.barcode;

        if (!barcode) {
            return {
                success: false,
                message: "Fiyat sorgulamak için bir barkod belirtin.",
            };
        }

        // Get product
        const [rows] = await pool.execute(
            "SELECT barcode, name, price, currency FROM products WHERE barcode = ?",
            [barcode]
        );

        const products = rows as any[];

        if (products.length === 0) {
            return {
                success: false,
                message: `Barkod ${barcode} ile ürün bulunamadı.`,
            };
        }

        const product = products[0];

        const message = `📦 **${product.name}**\nBarkod: ${product.barcode}\n💰 Fiyat: ${product.price} ${product.currency}`;

        return {
            success: true,
            message,
            data: { product },
        };
    }

    /**
     * Fiyat güncelle (audit log)
     */
    private async updatePrice(
        entities: ChatEntity,
        userId: string,
        sessionId: string
    ): Promise<HandlerResult> {
        const barcode = entities.barcode;
        const newPrice = entities.price;

        if (!barcode || newPrice === undefined) {
            return {
                success: false,
                message: "Fiyat güncellemek için barkod ve yeni fiyat belirtin.",
            };
        }

        // Get current price for audit
        const [rows] = await pool.execute(
            "SELECT price FROM products WHERE barcode = ?",
            [barcode]
        );

        const products = rows as any[];

        if (products.length === 0) {
            return {
                success: false,
                message: `Barkod ${barcode} ile ürün bulunamadı.`,
            };
        }

        const oldPrice = products[0].price;

        // Update price
        await pool.execute(
            "UPDATE products SET price = ?, updated_at = CURRENT_TIMESTAMP WHERE barcode = ?",
            [newPrice, barcode]
        );

        // Audit log
        await auditService.logPriceUpdate({
            userId,
            sessionId,
            barcode,
            oldPrice: parseFloat(oldPrice),
            newPrice,
        });

        logger.info("priceHandler.updated", { barcode, oldPrice, newPrice });

        return {
            success: true,
            message: `✅ Fiyat güncellendi\nBarkod: ${barcode}\n${oldPrice} ${entities.marketplace || "TRY"} → ${newPrice} ${entities.marketplace || "TRY"}`,
            data: { barcode, oldPrice, newPrice },
        };
    }
}

// Singleton instance
export const priceHandler = new PriceHandler();
