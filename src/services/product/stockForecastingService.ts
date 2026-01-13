import { pool } from "../../db.js";
import { logger } from "../../logger.js";
import { getProductByBarcode } from "./productService.js";
import { generateGeminiReply } from "../ai/geminiClient.js";

export interface StockForecast {
  barcode: string;
  currentStock: number;
  dailyVelocity: number; // Average items sold per day (last 30 days)
  daysRemaining: number;
  estimatedRunOutDate: Date | null;
  reorderSuggestion: number; // Suggested quantity to reorder
  aiInsight?: string;
}

export class StockForecastingService {
  /**
   * Belirli bir ürün için stok tahmini yapar.
   */
  async getForecast(barcode: string): Promise<StockForecast | null> {
    const productResult = await getProductByBarcode(barcode);
    if (!productResult.ok) return null;

    const product = productResult.value;
    const currentStock = product.stock;

    try {
      // Son 30 günlük satış verisini çek (sku = barcode varsayımıyla)
      const salesQuery = `
                SELECT SUM(quantity) as total_sold
                FROM order_items oi
                JOIN orders o ON oi.order_id = o.id
                WHERE (oi.sku = ? OR oi.product_name = ?)
                AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            `;

      const [rows] = await pool.query(salesQuery, [barcode, product.name]) as [any[], any];
      const totalSold = rows[0]?.total_sold || 0;
      const dailyVelocity = totalSold / 30;

      let daysRemaining = Infinity;
      let estimatedRunOutDate: Date | null = null;

      if (dailyVelocity > 0) {
        daysRemaining = Math.floor(currentStock / dailyVelocity);
        estimatedRunOutDate = new Date();
        estimatedRunOutDate.setDate(estimatedRunOutDate.getDate() + daysRemaining);
      }

      // Reorder suggestion: 30 günlük satış kadar almayı öner (veya min 10 adet)
      const reorderSuggestion = Math.max(10, Math.ceil(dailyVelocity * 30));

      const forecast: StockForecast = {
        barcode,
        currentStock,
        dailyVelocity: parseFloat(dailyVelocity.toFixed(2)),
        daysRemaining,
        estimatedRunOutDate,
        reorderSuggestion
      };

      // AI ile derinlemesine analiz
      forecast.aiInsight = await this.generateAIInsight(product.name, currentStock, dailyVelocity, daysRemaining);

      return forecast;
    } catch (error) {
      logger.error("stock.forecast_failed", { barcode, err: error });
      return null;
    }
  }

  private async generateAIInsight(
    name: string, 
    stock: number, 
    velocity: number, 
    days: number
  ): Promise<string> {
    const prompt = `
            Ürün: ${name}
            Mevcut Stok: ${stock}
            Günlük Satış Hızı: ${velocity} adet/gün
            Tahmini Stok Bitiş Süresi: ${days === Infinity ? "Satış yok" : `${days} gün`}
            
            Bu verilere göre stok yönetimi için 1-2 cümlelik kısa bir AI yorumu yap. 
            Eğer stok 7 günden önce bitecekse "ACİL" uyarısı ekle.
        `;

    try {
      const insight = await generateGeminiReply({
        message: prompt,
        locale: "tr"
      });
      return insight || "Veri yetersiz.";
    } catch {
      return "Analiz yapılamadı.";
    }
  }

  /**
   * Tüm kritik (stoku azalan) ürünler için toplu tahmin raporu.
   */
  async getBulkForecast(limit = 10): Promise<StockForecast[]> {
    // Burada basitlik için tüm ürünleri değil, en çok satan veya stoku az olanları seçebiliriz
    const [rows] = await pool.query(
      "SELECT barcode FROM products WHERE stock < 20 ORDER BY stock ASC LIMIT ?",
      [limit]
    ) as [any[], any];

    const forecasts: StockForecast[] = [];
    for (const row of rows) {
      const f = await this.getForecast(row.barcode);
      if (f) forecasts.push(f);
    }

    return forecasts;
  }
}

export const stockForecastingService = new StockForecastingService();
