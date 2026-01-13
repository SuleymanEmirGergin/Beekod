import { getProductByBarcode, updatePrice, getAllProducts } from "../product/productService.js";
import { getCompetitorPrices } from "../pricingService.js";
import { logger } from "../../logger.js";
import { isSuccess } from "../../utils/result.js";
import { query } from "../../db.js";

export interface PricingStrategy {
  type: "buybox" | "competitive" | "fixed";
  minMargin: number; // e.g., 0.1 for 10%
  fixedPrice?: number;
}

export class AutonomousPricingService {
  /**
   * Belirli bir ürün için otonom fiyatlandırmayı çalıştırır.
   */
  async processProduct(barcode: string, strategy: PricingStrategy): Promise<boolean> {
    const productResult = await getProductByBarcode(barcode);
    if (!productResult.ok) return false;

    const product = productResult.value;
    const costPrice = product.cost_price || 0;
    
    if (costPrice === 0) {
      logger.warn("pricing.autonomous_failed_no_cost", { barcode });
      return false;
    }

    const competitors = await getCompetitorPrices(barcode);
    if (competitors.length === 0) {
      logger.info("pricing.autonomous_no_competitors", { barcode });
      return false;
    }

    const lowestCompetitorPrice = Math.min(...competitors.map(c => c.price));
    
    let targetPrice = product.price;

    if (strategy.type === "buybox") {
      // Buy-Box: Rakibin 0.01 TL altına inmeyi dene
      targetPrice = lowestCompetitorPrice - 0.01;
    } else if (strategy.type === "competitive") {
      // Competitive: Rakiple aynı fiyatta kal
      targetPrice = lowestCompetitorPrice;
    } else if (strategy.type === "fixed") {
      targetPrice = strategy.fixedPrice || product.price;
    }

    // Minimum kâr marjı kontrolü
    // Formül: (Fiyat - Maliyet) / Fiyat >= Marj
    // Yani: Fiyat >= Maliyet / (1 - Marj)
    const minAllowedPrice = costPrice / (1 - strategy.minMargin);

    if (targetPrice < minAllowedPrice) {
      logger.warn("pricing.autonomous_margin_limit", { 
        barcode, 
        targetPrice, 
        minAllowedPrice,
        reason: "Kâr marjı çok düşük kalıyor, fiyat koruması devreye girdi."
      });
      targetPrice = minAllowedPrice;
    }

    // Eğer fiyat değişmiyorsa (küçük farklar hariç) güncelleme yapma
    if (Math.abs(targetPrice - product.price) < 0.01) {
      return true;
    }

    const updateResult = await updatePrice(barcode, targetPrice);
    if (updateResult.ok) {
      logger.info("pricing.autonomous_updated", { 
        barcode, 
        oldPrice: product.price, 
        newPrice: targetPrice,
        reason: strategy.type
      });
      await this.logPriceChange(barcode, product.price, targetPrice, strategy.type);
      return true;
    }

    return false;
  }

  /**
   * Tüm ürünler için otonom fiyatlandırmayı tetikler.
   */
  async processAllProducts(): Promise<{ processed: number; success: number }> {
    const productsResult = await getAllProducts(500);
    if (!productsResult.ok) return { processed: 0, success: 0 };

    const products = productsResult.value;
    let successCount = 0;

    for (const product of products) {
      // Varsayılan strateji: %15 kâr marjı ile Buy-Box protection
      const result = await this.processProduct(product.barcode, {
        type: "buybox",
        minMargin: 0.15
      });
      if (result) successCount++;
    }

    return {
      processed: products.length,
      success: successCount
    };
  }

  private async logPriceChange(barcode: string, oldPrice: number, newPrice: number, reason: string) {
    try {
      await query(
        `INSERT INTO price_history (barcode, old_price, new_price, change_reason, changed_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [barcode, oldPrice, newPrice, `Autonomous: ${reason}`]
      );
    } catch (err) {
      logger.error("pricing.history_log_failed", { barcode, err });
    }
  }
}

export const autonomousPricingService = new AutonomousPricingService();
