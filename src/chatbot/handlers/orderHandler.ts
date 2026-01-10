import { ChatHandler } from "./baseHandler.js";
import { ChatEntity, HandlerResult } from "../types.js";
import { logger } from "../../logger.js";
import { pool } from "../../db.js";
import { getMarketplaceProvider } from "../../marketplaces/index.js";
import { MarketplaceName } from "../../marketplaces/types.js";

/**
 * Order Handler
 * 
 * Sipariş sorgu işlemleri:
 * - order_query: Sipariş sorgula (barkod, tarih, durum)
 * - sales_report: Satış raporu
 */
export class OrderHandler implements ChatHandler {
    name = "OrderHandler";
    supportedIntents = ["order_query", "sales_report"];

    async handle(
        entities: ChatEntity,
        userId?: string,
        sessionId?: string,
        intent?: string
    ): Promise<HandlerResult> {
        try {
            logger.info("orderHandler.executing", { entities, userId, intent });

            switch (intent) {
                case "order_query":
                    return await this.queryOrders(entities);

                case "sales_report":
                    return await this.getSalesReport(entities);

                default:
                    return {
                        success: false,
                        message: "Bilinmeyen sipariş işlemi.",
                    };
            }
        } catch (error) {
            logger.error("orderHandler.failed", { error, entities, intent });
            return {
                success: false,
                message: "Sipariş işlemi sırasında hata oluştu.",
            };
        }
    }

    /**
     * Sipariş sorgula
     */
    private async queryOrders(entities: ChatEntity): Promise<HandlerResult> {
        // Get orders from database or marketplace
        const { barcode, marketplace, dateRange } = entities;

        let query = `
      SELECT 
        o.order_number,
        o.marketplace,
        o.order_date,
        o.status,
        o.total_amount,
        o.currency,
        oi.barcode,
        oi.product_name,
        oi.quantity,
        oi.unit_price
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE 1=1
    `;
        const params: any[] = [];

        if (barcode) {
            query += " AND oi.barcode = ?";
            params.push(barcode);
        }

        if (marketplace) {
            query += " AND o.marketplace = ?";
            params.push(marketplace);
        }

        if (dateRange?.start) {
            query += " AND o.order_date >= ?";
            params.push(dateRange.start);
        }

        if (dateRange?.end) {
            query += " AND o.order_date <= ?";
            params.push(dateRange.end);
        }

        query += " ORDER BY o.order_date DESC LIMIT 50";

        try {
            const [rows] = await pool.execute(query, params);
            const orders = rows as any[];

            if (orders.length === 0) {
                return {
                    success: true,
                    message: barcode
                        ? `Barkod ${barcode} için sipariş bulunamadı.`
                        : "Belirtilen kriterlere uyan sipariş bulunamadı.",
                    data: { orders: [] },
                };
            }

            // Group by order_number
            const groupedOrders = this.groupOrdersByNumber(orders);

            let message = `📦 **${Object.keys(groupedOrders).length} sipariş bulundu**\n\n`;

            Object.entries(groupedOrders).slice(0, 5).forEach(([orderNum, items]) => {
                const firstItem = items[0];
                message += `**#${orderNum}** (${firstItem.marketplace})\n`;
                message += `   📅 ${this.formatDate(firstItem.order_date)}\n`;
                message += `   💰 ${firstItem.total_amount} ${firstItem.currency}\n`;
                message += `   📋 ${firstItem.status}\n`;
                message += `   🛒 ${items.length} ürün\n\n`;
            });

            if (Object.keys(groupedOrders).length > 5) {
                message += `...ve ${Object.keys(groupedOrders).length - 5} sipariş daha.`;
            }

            return {
                success: true,
                message,
                data: { orders: groupedOrders },
            };

        } catch (error) {
            logger.error("orderHandler.queryOrders.db_error", { error });
            return {
                success: false,
                message: "Sipariş sorgulanırken hata oluştu.",
            };
        }
    }

    /**
     * Satış raporu
     */
    private async getSalesReport(entities: ChatEntity): Promise<HandlerResult> {
        const { dateRange, marketplace, barcode } = entities;

        // Default: last 7 days
        const endDate = dateRange?.end || new Date().toISOString().split('T')[0];
        const startDate = dateRange?.start || this.getDateDaysAgo(7);

        let query = `
      SELECT 
        DATE(o.order_date) as date,
        COUNT(DISTINCT o.id) as order_count,
        SUM(o.total_amount) as total_revenue,
        SUM(oi.quantity) as total_items,
        o.marketplace
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.order_date BETWEEN ? AND ?
    `;
        const params: any[] = [startDate, endDate];

        if (marketplace) {
            query += " AND o.marketplace = ?";
            params.push(marketplace);
        }

        if (barcode) {
            query += " AND oi.barcode = ?";
            params.push(barcode);
        }

        query += " GROUP BY DATE(o.order_date), o.marketplace ORDER BY date DESC";

        try {
            const [rows] = await pool.execute(query, params);
            const report = rows as any[];

            // Calculate totals
            const totalRevenue = report.reduce((sum, r) => sum + (parseFloat(r.total_revenue) || 0), 0);
            const totalOrders = report.reduce((sum, r) => sum + (parseInt(r.order_count) || 0), 0);
            const totalItems = report.reduce((sum, r) => sum + (parseInt(r.total_items) || 0), 0);

            let message = `📊 **Satış Raporu**\n`;
            message += `📅 ${startDate} - ${endDate}\n\n`;
            message += `💰 Toplam Ciro: **${totalRevenue.toFixed(2)} TRY**\n`;
            message += `📦 Toplam Sipariş: **${totalOrders}**\n`;
            message += `🛒 Satılan Ürün: **${totalItems} adet**\n\n`;

            // By marketplace
            const byMarketplace = this.groupByMarketplace(report);
            if (Object.keys(byMarketplace).length > 1) {
                message += `**Pazaryerine Göre:**\n`;
                Object.entries(byMarketplace).forEach(([mp, data]: [string, any]) => {
                    message += `- ${mp}: ${data.revenue.toFixed(2)} TRY (${data.orders} sipariş)\n`;
                });
            }

            return {
                success: true,
                message,
                data: { report, totals: { totalRevenue, totalOrders, totalItems } },
            };

        } catch (error) {
            logger.error("orderHandler.getSalesReport.db_error", { error });
            return {
                success: false,
                message: "Satış raporu oluşturulurken hata oluştu.",
            };
        }
    }

    /**
     * Group orders by order number
     */
    private groupOrdersByNumber(orders: any[]): Record<string, any[]> {
        const grouped: Record<string, any[]> = {};
        orders.forEach(o => {
            if (!grouped[o.order_number]) {
                grouped[o.order_number] = [];
            }
            grouped[o.order_number].push(o);
        });
        return grouped;
    }

    /**
     * Group report by marketplace
     */
    private groupByMarketplace(report: any[]): Record<string, { revenue: number; orders: number }> {
        const grouped: Record<string, { revenue: number; orders: number }> = {};
        report.forEach(r => {
            const mp = r.marketplace || "Unknown";
            if (!grouped[mp]) {
                grouped[mp] = { revenue: 0, orders: 0 };
            }
            grouped[mp].revenue += parseFloat(r.total_revenue) || 0;
            grouped[mp].orders += parseInt(r.order_count) || 0;
        });
        return grouped;
    }

    /**
     * Format date for display
     */
    private formatDate(dateStr: string): string {
        try {
            return new Date(dateStr).toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
            return dateStr;
        }
    }

    /**
     * Get date N days ago
     */
    private getDateDaysAgo(days: number): string {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date.toISOString().split('T')[0];
    }
}

// Singleton instance
export const orderHandler = new OrderHandler();
