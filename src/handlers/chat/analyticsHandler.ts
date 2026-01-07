import { ParsedMessage } from "../../services/nlp.js";
import { t } from "../../i18n.js";
import { logger } from "../../logger.js";
import { ChatContext, IntentHandlerResult } from "./index.js";
import { getDashboardStats, getRevenueTimeline, getProfitMargins } from "../../services/analyticsService.js";
import { getLowStockProducts } from "../../services/productService.js";
import { getAdminSettings } from "../../services/adminSettingsService.js";

/**
 * Analytics intent handler
 * Handles: "Bu ay satışlarım nasıl?", "En çok satan ürünlerim?", "Hangi ürünler stoğu bitmek üzere?"
 */
export async function analyticsHandler(parsed: ParsedMessage, context: ChatContext): Promise<IntentHandlerResult> {
  const { intent, locale } = parsed;
  const intentStr = String(intent);

  try {
    // Monthly sales query
    if (intentStr === "analytics.monthly_sales" || intentStr === "analytics.sales") {
      const stats = await getDashboardStats();
      const timeline = await getRevenueTimeline(30);

      const lastMonthRevenue = timeline.reduce((sum, day: any) => sum + (Number(day.revenue) || 0), 0);
      const avgDailyRevenue = lastMonthRevenue / 30;

      const reply =
        `📊 **Son 30 Günlük Satış Raporu**\n\n` +
        `💰 Toplam Ciro: ${lastMonthRevenue.toFixed(2)} TL\n` +
        `📈 Günlük Ortalama: ${avgDailyRevenue.toFixed(2)} TL\n` +
        `📦 Toplam Ürün: ${stats.totalProducts}\n` +
        `⚠️ Düşük Stok: ${stats.lowStockCount} ürün\n\n` +
        `Güzel gidiyoruz kanka! 🚀`;

      return {
        reply,
        success: true,
        data: { stats, timeline, totalRevenue: lastMonthRevenue, avgDailyRevenue },
      };
    }

    // Top products query
    if (intentStr === "analytics.top_products") {
      const stats = await getDashboardStats();
      const topProducts = stats.topPerformers.slice(0, 5);

      let reply = `🏆 **En Çok Satan 5 Ürün**\n\n`;
      topProducts.forEach((product: any, index: number) => {
        reply += `${index + 1}. ${product.name}\n`;
        reply += `   💰 Ciro: ${product.totalRevenue.toFixed(2)} TL\n`;
        reply += `   📦 Satış: ${product.totalSales} adet\n\n`;
      });

      reply += `Devam böyle! 💪`;

      return {
        reply,
        success: true,
        data: { topProducts },
      };
    }

    // Low stock alert query
    if (intentStr === "analytics.low_stock") {
      const settings = await getAdminSettings();
      const lowStockProducts = await getLowStockProducts(settings.lowStockThreshold, 10);

      if (lowStockProducts.length === 0) {
        return {
          reply: `✅ Harika! Stoğu bitmek üzere olan ürün yok.\n\nHer şey kontrol altında! 👍`,
          success: true,
        };
      }

      let reply = `⚠️ **Stoğu Bitmek Üzere Olan Ürünler**\n\n`;
      lowStockProducts.forEach((product: any) => {
        reply += `📦 ${product.name}\n`;
        reply += `   Stok: ${product.stock} adet (Eşik: ${product.alert_threshold || settings.lowStockThreshold})\n`;
        reply += `   Barkod: ${product.barcode}\n\n`;
      });

      reply += `Hemen sipariş ver kanka! 🚨`;

      return {
        reply,
        success: true,
        data: { lowStockProducts },
      };
    }

    // Profit margins query
    if (intentStr === "analytics.profit_margins") {
      const profitData = await getProfitMargins();
      const topProfitable = profitData.slice(0, 5);

      let reply = `💎 **En Kârlı 5 Ürün**\n\n`;
      topProfitable.forEach((product: any, index: number) => {
        reply += `${index + 1}. ${product.name}\n`;
        reply += `   📊 Kâr Marjı: %${product.profit_margin_percent}\n`;
        reply += `   💰 Birim Kâr: ${product.profit.toFixed(2)} TL\n`;
        reply += `   📦 Satış: ${product.total_sold} adet\n\n`;
      });

      reply += `Bu ürünlere odaklan! 🎯`;

      return {
        reply,
        success: true,
        data: { profitData: topProfitable },
      };
    }

    // Revenue timeline query
    if (intentStr === "analytics.revenue_timeline") {
      const days = (parsed as any).params?.days || 30;
      const timeline = await getRevenueTimeline(days);

      const totalRevenue = timeline.reduce((sum, day: any) => sum + (Number(day.revenue) || 0), 0);
      const avgRevenue = totalRevenue / days;

      const reply =
        `📈 **Son ${days} Günlük Gelir Grafiği**\n\n` +
        `💰 Toplam: ${totalRevenue.toFixed(2)} TL\n` +
        `📊 Ortalama: ${avgRevenue.toFixed(2)} TL/gün\n\n` +
        `Grafik verileri hazır! 📊`;

      return {
        reply,
        success: true,
        data: { timeline, totalRevenue, avgRevenue },
      };
    }

    return {
      reply: t(locale, "unknown_intent"),
      success: false,
    };
  } catch (error) {
    logger.error("chat.analytics_handler_failed", { intent, err: error });
    return {
      reply: `Bir hata oluştu kanka. Tekrar dener misin? 😅`,
      success: false,
    };
  }
}
