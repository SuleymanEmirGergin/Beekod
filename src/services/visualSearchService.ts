import { analyzeImage } from "./ai/geminiClient.js";
import { searchProductsByName } from "./product/productService.js";
import { Product } from "../types.js";
import { logger } from "../logger.js";

export interface VisualSearchMatch {
  product: Product;
  confidence: number;
}

/**
 * Searches for products based on an image.
 */
export async function runVisualSearch(imageBuffer: Buffer, mimeType: string): Promise<VisualSearchMatch[]> {
  // 1. Ask Gemini Vision to identify the product
  const prompt = `Bu fotoğraftaki ürünü tanımla. 
    Lütfen sadece ürünün adını ve en belirgin özelliklerini (marka, model, renk vb.) döndür. 
    Eğer bir barkod görüyorsan onu da belirt.
    Cevabı şu formatta ver: { "name": "...", "keywords": ["...", "..."], "barcode": "..." }
    Dil: Türkçe.`;

  const aiResponse = await analyzeImage({
    buffer: imageBuffer,
    mimeType,
    prompt,
    locale: "tr",
  });
  if (!aiResponse) return [];

  try {
    const jsonStr = aiResponse.replace(/```json|```/g, "").trim();
    const info = JSON.parse(jsonStr);

    // 2. Search by name/keywords in the database
    // For simplicity, we search by the name Gemini suggested
    const searchResult = await searchProductsByName(info.name, 5);
    if (!searchResult.ok) return [];
    const searchResults = searchResult.value;

    // 3. Map to match objects
    return searchResults.map((p) => ({
      product: p,
      confidence: 0.9, // Simplified confidence
    }));
  } catch (error) {
    logger.error("visual.search_failed", { err: error });
    return [];
  }
}
