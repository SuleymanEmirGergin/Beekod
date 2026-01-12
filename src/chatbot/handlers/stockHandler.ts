import { ChatHandler } from "./baseHandler.js";
import { ChatEntity, HandlerResult } from "../types.js";
import { logger } from "../../logger.js";
import { pool } from "../../db.js";
import { auditService } from "../auditService.js";

/**
 * Stock Handler
 * 
 * Stok sorgu/güncelleme işlemleri
 * - stock_query: Stok sorgula
 * - stock_update: Stok güncelle (audit log zorunlu)
 * - stock_alert: Stok uyarı threshold ayarla
 */
export class StockHandler implements ChatHandler {
    name = "StockHandler";
    supportedIntents = ["stock_query", "stock_update", "stock_alert"];

    async handle(
        entities: ChatEntity,
        userId?: string,
        sessionId?: string,
        intent?: string
    ): Promise<HandlerResult> {
        try {
            logger.info("stockHandler.executing", { entities, userId, intent });

            switch (intent) {
                case "stock_query":
                    return await this.queryStock(entities);

                case "stock_update":
                    return await this.updateStock(entities, userId!, sessionId!);

                case "stock_alert":
                    return await this.setStockAlert(entities);

                default:
                    return {
                        success: false,
                        message: "Bilinmeyen stok işlemi.",
                    };
            }
        } catch (error) {
            logger.error("stockHandler.failed", { error, entities, intent });
            return {
                success: false,
                message: "Stok işlemi sırasında hata oluştu.",
            };
        }
    }

    /**
     * Stok sorgula
     */
    private async queryStock(entities: ChatEntity): Promise<HandlerResult> {
        const barcode = entities.barcode;

        if (!barcode) {
            return {
                success: false,
                message: "Stok sorgulamak için bir barkod belirtin.",
            };
        }

        // Get product
        const [rows] = await pool.execute(
            "SELECT barcode, name, stock, alert_threshold FROM products WHERE barcode = ?",
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

        let message = `📦 **${product.name}**\nBarkod: ${product.barcode}\n`;

        // Stock emoji
        const stockEmoji = product.stock > product.alert_threshold ? "✅" : product.stock > 0 ? "⚠️" : "❌";
        message += `${stockEmoji} Stok: ${product.stock} adet\n`;

        if (product.stock <= product.alert_threshold) {
            message += `🔔 Uyarı eşiği: ${product.alert_threshold} adet`;
        }

        return {
            success: true,
            message,
            data: { product },
        };
    }

    /**
     * Stok güncelle (audit log)
     */
    private async updateStock(
        entities: ChatEntity,
        userId: string,
        sessionId: string
    ): Promise<HandlerResult> {
        const barcode = entities.barcode;
        const newStock = entities.stock;

        if (!barcode || newStock === undefined) {
            return {
                success: false,
                message: "Stok güncellemek için barkod ve yeni stok adedi belirtin.",
            };
        }

        // Get current stock for audit
        const [rows] = await pool.execute(
            "SELECT stock FROM products WHERE barcode = ?",
            [barcode]
        );

        const products = rows as any[];

        if (products.length === 0) {
            return {
                success: false,
                message: `Barkod ${barcode} ile ürün bulunamadı.`,
            };
        }

        const oldStock = products[0].stock;

        // Update stock
        await pool.execute(
            "UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE barcode = ?",
            [newStock, barcode]
        );

        // Audit log
        await auditService.logStockUpdate({
            userId,
            sessionId,
            barcode,
            oldStock: parseInt(oldStock),
            newStock,
        });

        logger.info("stockHandler.updated", { barcode, oldStock, newStock });

        return {
            success: true,
            message: `✅ Stok güncellendi\nBarkod: ${barcode}\n${oldStock} adet → ${newStock} adet`,
            data: { barcode, oldStock, newStock },
        };
    }

    /**
     * Stok uyarı threshold ayarla
     */
    private async setStockAlert(entities: ChatEntity): Promise<HandlerResult> {
        const barcode = entities.barcode;
        const threshold = entities.threshold;

        if (!barcode || threshold === undefined) {
            return {
                success: false,
                message: "Stok uyarısı ayarlamak için barkod ve eşik değeri belirtin.",
            };
        }

        // Check product exists
        const [checkRows] = await pool.execute(
            "SELECT 1 FROM products WHERE barcode = ?",
            [barcode]
        );

        if ((checkRows as any[]).length === 0) {
            return {
                success: false,
                message: `Barkod ${barcode} ile ürün bulunamadı.`,
            };
        }

        // Update threshold
        await pool.execute(
            "UPDATE products SET alert_threshold = ? WHERE barcode = ?",
            [threshold, barcode]
        );

        logger.info("stockHandler.alert_set", { barcode, threshold });

        return {
            success: true,
            message: `✅ Stok uyarı eşiği ayarlandı\nBarkod: ${barcode}\nYeni eşik: ${threshold} adet`,
            data: { barcode, threshold },
        };
    }
}

// Singleton instance
export const stockHandler = new StockHandler();
