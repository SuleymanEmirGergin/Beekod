import { getProductByBarcode } from "../product/productService.js";
import { getMarketplaceProvider } from "../marketplace/index.js";
import { SearchResultItem } from "../search/types.js";
import { logger } from "../../logger.js";
import { isSuccess } from "../../utils/result.js";

export type MarketPosition = "lowest" | "average" | "highest" | "competitive";

export interface CompetitionAnalysis {
  barcode: string;
  ourPrice: number;
  lowestPrice: number;
  marketPosition: MarketPosition;
  competitorCount: number;
  winningSeller?: string;
  isWinningBuyBox: boolean;
}

export class CompetitionService {
  /**
   * Belirli bir ürün için rakip analizi yapar.
   */
  async analyzeCompetition(barcode: string): Promise<CompetitionAnalysis | null> {
    const productResult = await getProductByBarcode(barcode);
    if (!productResult.ok) {
      logger.warn("competition.analyze_failed_no_product", { barcode });
      return null;
    }

    const ourProduct = productResult.value;
    const ourPrice = ourProduct.price;

    // Trendyol üzerinden rekabet verisini çekmeyi dene
    const trendyol = getMarketplaceProvider("Trendyol");
    let lowestPrice = ourPrice;
    let competitorCount = 0;
    let winningSeller = "Siz";
    let isWinningBuyBox = true;

    if (trendyol && trendyol.getPriceCompetition) {
      const compResult = await trendyol.getPriceCompetition([barcode]);
      if (isSuccess(compResult) && compResult.value.length > 0) {
          const data = compResult.value[0];
          lowestPrice = data.lowestPrice;
          competitorCount = data.competitorCount || 0;
          winningSeller = data.winningSeller || "Bilinmiyor";
          isWinningBuyBox = ourPrice <= lowestPrice;
      }
    }

    const marketPosition = this.calculatePosition(ourPrice, lowestPrice);

    return {
      barcode,
      ourPrice,
      lowestPrice,
      marketPosition,
      competitorCount,
      winningSeller,
      isWinningBuyBox
    };
  }

  /**
   * Arama sonuçlarını bizim fiyatlarımızla zenginleştirir.
   */
  async enrichSearchResults(items: SearchResultItem[]): Promise<SearchResultItem[]> {
    const enrichedItems = [...items];

    for (const item of enrichedItems) {
      if (!item.barcode) continue;

      const analysis = await this.analyzeCompetition(item.barcode);
      if (analysis) {
        item.buyBoxPrice = analysis.lowestPrice;
        item.competitorCount = analysis.competitorCount;
        item.isWinningBuyBox = analysis.isWinningBuyBox;
        item.marketPosition = analysis.marketPosition;
      }
    }

    return enrichedItems;
  }

  private calculatePosition(ourPrice: number, lowestPrice: number): MarketPosition {
    if (ourPrice < lowestPrice) return "lowest";
    if (ourPrice === lowestPrice) return "lowest";
    if (ourPrice <= lowestPrice * 1.05) return "competitive";
    if (ourPrice > lowestPrice * 1.2) return "highest";
    return "average";
  }
}

export const competitionService = new CompetitionService();
