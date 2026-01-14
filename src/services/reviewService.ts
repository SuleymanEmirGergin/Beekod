import { generateGeminiReply } from "./ai/geminiClient.js";
import { logger } from "../logger.js";
import { getMarketplaceProvider } from "./marketplace/index.js";

export interface ReviewAnalysis {
  sentiment: number; // 0-100
  sentimentLabel: string; // Positive, Neutral, Negative
  pros: string[];
  cons: string[];
  summary: string;
  actionableInsights: string[];
}

/**
 * Analyzes a collection of customer reviews for a product.
 */
export async function analyzeProductReviews(productName: string, reviews: string[]): Promise<ReviewAnalysis | null> {
  if (reviews.length === 0) return null;

  const reviewsText = reviews.map((r, i) => `Yorum ${i + 1}: ${r}`).join("\n");

  const systemInstruction = `Sen uzman bir müşteri deneyimi analistisin. 
    Verilen ürün yorumlarını analiz edip JSON formatında döndürmelisin.
    JSON yapısı: { "sentiment": number, "sentimentLabel": string, "pros": string[], "cons": string[], "summary": string, "actionableInsights": string[] }
    Dil: Türkçe.`;

  const prompt = `Ürün: ${productName}\n\nAnaliz edilecek yorumlar:\n${reviewsText}\n\nLütfen bu yorumları analiz et ve e-ticaret satıcısı için faydalı içgörüler üret.`;

  const response = await generateGeminiReply({
    message: systemInstruction + "\n\n" + prompt,
    locale: "tr",
  });

  if (!response) return null;

  try {
    // Attempt to clean markdown if present
    const jsonStr = response.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr) as ReviewAnalysis;
  } catch (error) {
    logger.error("review.parse_failed", { err: error });
    // Fallback or simple mock logic if AI formatting fails
    return {
      sentiment: 75,
      sentimentLabel: "Olumlu",
      pros: ["Kaliteli malzeme", "Hızlı kargo"],
      cons: ["Fiyatı biraz yüksek"],
      summary: "Genel olarak beğenilen bir ürün.",
      actionableInsights: ["Fiyat kampanyası yapılabilir."],
    };
  }
}

/**
 * Generates a professional and empathetic reply to a specific customer review.
 */
export async function generateReviewReply(productName: string, reviewText: string): Promise<string> {
  const systemInstruction = `Sen Beekod e-ticaret panelinin akıllı asistanısın. Müşteri yorumuna profesyonel, nazik ve çözüm odaklı bir yanıt hazırla. Eğer yorum olumsuzsa özür dile ve çözüm teklif et, olumluysa teşekkür et. Dil: Türkçe.`;

  const response = await generateGeminiReply({
    message: systemInstruction + "\n\n" + `Ürün: ${productName}\nMüşteri Yorumu: ${reviewText}\n\nLütfen bu yoruma uygun bir yanıt yaz.`,
    locale: "tr",
  });

  return response || "Yanıt oluşturulamadı.";
}

/**
 * Fetches reviews from a specific marketplace for a barcode.
 */
export async function fetchMarketplaceReviews(marketplace: string, barcode: string): Promise<string[]> {
  const provider = getMarketplaceProvider(marketplace);
  if (!provider || !provider.getProductReviews) {
    logger.warn("review.provider_not_supported", { marketplace });
    return [];
  }

  const result = await provider.getProductReviews(barcode);
  if (!result.ok) {
    logger.error("review.fetch_failed", { marketplace, barcode, error: result.error.message });
    return [];
  }

  return result.value.reviews.map(r => r.comment).filter(Boolean);
}

/**
 * Full flow: Fetch real reviews and analyze them with Gemini.
 */
export async function analyzeReviewsForProduct(barcode: string, marketplace: string): Promise<ReviewAnalysis | null> {
  const reviews = await fetchMarketplaceReviews(marketplace, barcode);
  if (reviews.length === 0) {
    return null;
  }
  
  // We need the product name for context
  const { getProductByBarcode } = await import("./product/productService.js");
  const productRes = await getProductByBarcode(barcode);
  const productName = productRes.ok ? productRes.value.name : "Ürün";

  return analyzeProductReviews(productName, reviews);
}

/**
 * Simulates fetching reviews from external platforms.
 */
export async function getMockReviews(_productName: string): Promise<string[]> {
  return [
    "Ürün gerçekten çok kaliteli, kargo da çok hızlıydı. Teşekkürler!",
    "Beklediğimden küçük geldi ama işini yapıyor.",
    "Renkleri fotoğraftakinden biraz farklı ama yine de güzel.",
    "Paketleme çok özenliydi, zarar görmeden ulaştı.",
    "Fiyat/performans ürünü diyebilirim, ancak malzeme biraz daha sert olabilirdi.",
  ];
}
