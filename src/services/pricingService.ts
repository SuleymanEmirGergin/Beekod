import { getProductByBarcode } from "./productService.js";
import { generateGeminiReply } from "./geminiService.js";
import { logger } from "../logger.js";

export interface CompetitorPrice {
  platform: string;
  price: number;
  currency: string;
  url?: string;
}

export interface PriceSuggestion {
  currentPrice: number;
  suggestedPrice: number;
  currency: string;
  reason: string;
  competitors: CompetitorPrice[];
  profitMarginChange?: number;
  aiInsight?: string;
}

/**
 * Simulates fetching competitor prices from popular platforms.
 * In a real-world scenario, this would use a scraper or a pricing API.
 */
export async function getCompetitorPrices(barcode: string): Promise<CompetitorPrice[]> {
  const product = await getProductByBarcode(barcode);
  if (!product) return [];

  const basePrice = product.price;

  // Simulate some randomness
  return [
    { platform: "Trendyol", price: basePrice * (0.9 + Math.random() * 0.2), currency: product.currency },
    { platform: "Hepsiburada", price: basePrice * (0.92 + Math.random() * 0.15), currency: product.currency },
    { platform: "Amazon.com.tr", price: basePrice * (0.88 + Math.random() * 0.25), currency: product.currency },
  ].map((p) => ({ ...p, price: parseFloat(p.price.toFixed(2)) }));
}

export async function getPriceSuggestion(barcode: string): Promise<PriceSuggestion | null> {
  const product = await getProductByBarcode(barcode);
  if (!product) return null;

  const competitors = await getCompetitorPrices(barcode);
  if (competitors.length === 0) return null;

  const lowestCompetitor = Math.min(...competitors.map((c) => c.price));

  let suggestedPrice = product.price;
  let reason = "Fiyatınız şu an rekabetçi.";

  if (product.price > lowestCompetitor) {
    suggestedPrice = lowestCompetitor - 0.01;
    reason = `En düşük rakibe (${lowestCompetitor} ${product.currency}) göre fiyatınız yüksek. Pazar liderliği (Buybox) için fiyat düşürmenizi öneririm.`;
  } else if (product.price < lowestCompetitor * 0.85) {
    suggestedPrice = lowestCompetitor * 0.95;
    reason =
      "Rakiplerinizden çok daha ucuza satıyorsunuz. Kâr marjınızı artırmak için fiyatınızı rekabetçi bir seviyeye çekebilirsiniz.";
  }

  return {
    currentPrice: product.price,
    suggestedPrice: parseFloat(suggestedPrice.toFixed(2)),
    currency: product.currency,
    reason,
    competitors,
  };
}

/**
 * AI Powered Dynamic Pricing Analysis
 * Uses Gemini to consider more factors like stock scarcity and market trends
 */
export async function generateDynamicPricingAI(barcode: string): Promise<PriceSuggestion | null> {
  const product = await getProductByBarcode(barcode);
  if (!product) return null;

  const competitors = await getCompetitorPrices(barcode);
  const baseSuggestion = await getPriceSuggestion(barcode);

  if (!baseSuggestion) return null;

  const prompt = `
        Ürün: ${product.name}
        Mevcut Fiyat: ${product.price} ${product.currency}
        Mevcut Stok: ${product.stock}
        Rakip Fiyatları: ${competitors.map((c) => `${c.platform}: ${c.price}`).join(", ")}
        Klasik Öneri: ${baseSuggestion.suggestedPrice} ${baseSuggestion.currency} (${baseSuggestion.reason})

        Bu verileri analiz et ve "Revenue Optimization" odaklı fütüristik bir fiyat önerisi yap.
        Hedefimiz: Kâr marjını ve stok devir hızını (inventory turnover) dengeleyerek toplam geliri maksimize etmek.
        
        Stratejik Faktörler:
        1. Stok azsa (örn. < 10) ve talep varsa: Fiyatı rakiplerin üzerine çekerek kârı maksimize et.
        2. Stok çoksa (> 100): Rakiplerin altına inerek nakit akışını hızlandır.
        3. Rakip yoksa: Premium fiyatlandırma uygula.
        
        Yanıtını kısa tut ve şu formatta ver:
        ÖNERİ: [Fiyat] [Para Birimi]
        NEDEN: [Kısa teknik gerekçe]
        İPUCU: [Ürünle ilgili satış artırıcı AI stratejisi]
    `;

  try {
    const aiResponse = await generateGeminiReply({
      message: prompt,
      locale: "tr",
    });

    if (aiResponse) {
      const priceMatch = aiResponse.match(/ÖNERİ:\s*([\d.,]+)/);
      const reasonMatch = aiResponse.match(/NEDEN:\s*(.*)/);
      const tipMatch = aiResponse.match(/İPUCU:\s*(.*)/);

      if (priceMatch) {
        const aiPrice = parseFloat(priceMatch[1].replace(",", "."));
        return {
          ...baseSuggestion,
          suggestedPrice: aiPrice,
          aiInsight: aiResponse,
          reason: reasonMatch ? reasonMatch[1].trim() : baseSuggestion.reason,
        };
      }
    }
  } catch (error) {
    logger.error("pricing.ai_failed", { barcode, err: error });
  }

  return baseSuggestion;
}

/**
 * Compatibility helper for generic pricing analysis
 */
export async function analyzePricing(input: { productName: string; myCost?: number; locale?: string }) {
  const avgMarketPrice = 100 * (0.8 + Math.random() * 0.4);
  const min = avgMarketPrice * 0.85;
  const max = avgMarketPrice * 1.25;

  return {
    marketStats: {
      min: parseFloat(min.toFixed(2)),
      max: parseFloat(max.toFixed(2)),
      avg: parseFloat(avgMarketPrice.toFixed(2)),
      competitorCount: 3,
    },
    competitors: [
      { name: "Trendyol", price: parseFloat((avgMarketPrice * 1.05).toFixed(2)), currency: "TL" },
      { name: "Hepsiburada", price: parseFloat((avgMarketPrice * 0.98).toFixed(2)), currency: "TL" },
      { name: "Amazon", price: parseFloat((avgMarketPrice * 0.92).toFixed(2)), currency: "TL" },
    ],
    insights: "Fiyatınız pazar ortalamasına yakın. %2 indirimle üst sıralara çıkabilirsiniz.",
    recommendation: "Pazar liderliği için fiyatınızı 94.90 TL seviyesine çekmenizi öneririz.",
  };
}
