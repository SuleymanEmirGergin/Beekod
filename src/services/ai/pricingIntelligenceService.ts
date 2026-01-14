import { getProductByBarcode } from "../product/productService.js";
import { unifiedMarketplaceSearch } from "../search/unifiedMarketplaceSearch.js";
import { getGeminiProvider } from "../../ai/providers/index.js";
import { logger } from "../../logger.js";
import { ok, fail, Result } from "../../utils/result.js";

export interface BuyBoxAnalysis {
  barcode: string;
  productName: string;
  myPrice: number;
  costPrice: number;
  currentMargin: number;
  lowestCompetitorPrice: number;
  isLowest: boolean;
  competitors: Array<{ site: string; price: number; url: string }>;
  suggestedPrice: number;
  expectedMargin: number;
  strategy: string;
  aiInsight?: string;
}

/**
 * Higher level intelligence service for strategic pricing.
 */
export class PricingIntelligenceService {
  private targetMargin = 0.15; // 15% default target margin

  async analyzeBuyBoxStatus(barcode: string): Promise<Result<BuyBoxAnalysis>> {
    try {
      // 1. Get local product data
      const productRes = await getProductByBarcode(barcode);
      if (!productRes.ok) return fail(productRes.error);
      const product = productRes.value;

      // 2. Search for competitors
      const searchRes = await unifiedMarketplaceSearch(product.name);
      if (!searchRes.ok) return fail(searchRes.error);
      const competitors = searchRes.value;

      // 3. Analysis logic
      const validCompetitors = competitors.filter(c => c.price > 0);
      const lowestComp = validCompetitors.length > 0 
        ? Math.min(...validCompetitors.map(c => c.price))
        : null;

      const isLowest = lowestComp === null || product.price <= lowestComp;
      const costPrice = product.cost_price ?? 0;
      const margin = costPrice > 0 
        ? (product.price - costPrice) / product.price 
        : 0;

      // 4. Calculate optimal price (Buy-Box warrior logic)
      let suggestedPrice = product.price;
      if (lowestComp && product.price > lowestComp) {
        // We are more expensive. Can we match?
        const breakEven = (product.cost_price || 0) * 1.1; // Min 10% safety
        suggestedPrice = Math.max(lowestComp - 0.10, breakEven);
      } else if (lowestComp && product.price < lowestComp * 0.9) {
        // We are too cheap. Can we raise?
        suggestedPrice = lowestComp - 0.50;
      }

      const expectedMargin = costPrice > 0 
        ? (suggestedPrice - costPrice) / suggestedPrice 
        : 0;

      // 5. Ask Gemini for a "Strategic" reason
      const ai = getGeminiProvider();
      const prompt = `
        Ürün: ${product.name}
        Maliyet: ${product.cost_price} ${product.currency}
        Mevcut Satış Fiyatım: ${product.price} ${product.currency}
        Pazardaki En Düşük Fiyat: ${lowestComp || 'Rakip bulunamadı'}
        Stok Durumum: ${product.stock}
        Kategori: ${product.category}

        Bu ürünü "Revenue & Profit Optimization" açısından analiz et. 
        Eğer fiyat düşürürsek kâr ne kadar etkilenir? 
        Pazar doygunluğu nasıl görünüyor?
        Kısa, profesyonel ve aksiyon odaklı bir tavsiye ver.
      `;

      let aiInsight = "";
      try {
        const aiResp = await ai.respond({
            message: prompt,
            toolResults: [],
            style: 'short'
        });
        aiInsight = aiResp.answer;
      } catch (e) {
        logger.warn("pricing_intel.ai_failed", { error: String(e) });
      }

      return ok({
        barcode: product.barcode,
        productName: product.name,
        myPrice: product.price,
        costPrice: costPrice,
        currentMargin: Math.round(margin * 100),
        lowestCompetitorPrice: lowestComp || 0,
        isLowest,
        competitors: validCompetitors.slice(0, 3).map(c => ({ site: c.marketplace, price: c.price, url: c.url })),
        suggestedPrice: Number(suggestedPrice.toFixed(2)),
        expectedMargin: Math.round(expectedMargin * 100),
        strategy: isLowest ? "SKU_HARVESTING" : "BUYBOX_CHASE",
        aiInsight
      });

    } catch (error) {
      logger.error("pricing_intel.analyze_failed", { barcode, error });
      return fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

export const pricingIntelligenceService = new PricingIntelligenceService();
