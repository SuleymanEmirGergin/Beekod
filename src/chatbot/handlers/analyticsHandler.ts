
import { ChatHandler } from "./baseHandler.js";
import { ChatIntent, ChatEntity, HandlerResult } from "../types.js";

/**
 * Analytics & Report Handler
 * Handles profitability analysis, sales reports, and general analytics queries.
 */
export class AnalyticsHandler implements ChatHandler {
    name = "AnalyticsHandler";
    supportedIntents: ChatIntent[] = ["analytics_query", "sales_report"];

    async handle(
        entities: ChatEntity,
        userId: string | undefined,
        sessionId: string,
        intent: ChatIntent
    ): Promise<HandlerResult> {

        if (intent === "sales_report") {
            return this.handleSalesReport(entities);
        } else {
            return this.handleProfitabilityAnalysis(entities);
        }
    }

    private async handleSalesReport(entities: ChatEntity): Promise<HandlerResult> {
        // Mock Sales Report Generation
        const period = entities.dateRange ? "Belirtilen Tarih Aralığı" : "Son 30 Gün";

        return {
            success: true,
            message: `📈 **Satış Raporu (${period})**\n\n` +
                `• Toplam Satış: **1.245.000 ₺**\n` +
                `• Sipariş Sayısı: **342**\n` +
                `• İade Oranı: **%2.1**\n\n` +
                `En çok satış yapılan pazar yeri: **Trendyol (%45)**\n` +
                `Detaylı raporu e-posta adresinize gönderdim.`,
            data: {
                totalSales: 1245000,
                orderCount: 342,
                topMarketplace: "Trendyol"
            }
        };
    }

    private async handleProfitabilityAnalysis(entities: ChatEntity): Promise<HandlerResult> {
        // Mock Profitability Analysis
        // In a real scenario, this would import specific product cost if 'productName' entity exists

        let subject = "Genel Mağaza";
        if (entities.productName) {
            subject = entities.productName;
        }

        return {
            success: true,
            message: `💰 **Karlılık Analizi: ${subject}**\n\n` +
                `• Ortalama Kar Marjı: **%18**\n` +
                `• Net Kar: **224.000 ₺**\n` +
                `• Operasyonel Giderler: **45.000 ₺**\n\n` +
                `💡 **Öneri:** Düşük kar marjlı "Elektronik Aksesuar" kategorisinde fiyat optimizasyonu yapmanızı öneririm.`,

            // We could return a chart type here if the frontend supported it
            data: {
                margin: 18,
                netProfit: 224000
            }
        };
    }
}

export const analyticsHandler = new AnalyticsHandler();
