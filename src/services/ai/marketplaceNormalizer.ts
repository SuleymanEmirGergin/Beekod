import { getGeminiProvider } from "../../ai/providers/gemini/GeminiProvider.js";
import { logger } from "../../logger.js";

export class MarketplaceNormalizer {
  private provider = getGeminiProvider();

  /**
   * Bir ürünün başlık, açıklama ve özniteliklerini standart bir formata sokar.
   */
  async normalizeProduct(item: any): Promise<any> {
    try {
      const prompt = `You are an ecommerce data scientist. Convert the following marketplace product data into a standardized format.
      Standardize attribute names (e.g., 'Boyut' -> 'Size', 'Renk' -> 'Color').
      Clean up the title for clarity.

      Product Data:
      Title: ${item.title}
      Brand: ${item.brand || "N/A"}
      Attributes: ${JSON.stringify(item.attributes || {})}

      Return ONLY a JSON object:
      {
        "standardizedTitle": "cleaned title",
        "standardizedAttributes": { "Key": "Value" },
        "standardizedBrand": "standard brand name"
      }`;

      const text = await this.provider.generate(prompt);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          ...item,
          title: parsed.standardizedTitle || item.title,
          brand: parsed.standardizedBrand || item.brand,
          attributes: parsed.standardizedAttributes || item.attributes
        };
      }
    } catch (error) {
      logger.error("normalizer.normalizeProduct_failed", { error, barcode: item.barcode });
    }
    return item;
  }

  /**
   * Benzer ürünleri tespit eder ve tek bir "Master Product" altında birleştirir.
   */
  async deduplicateResults(items: any[]): Promise<any[]> {
    if (items.length <= 1) return items;

    // Önce barkod ile kolay birleştirme
    const barcodeMap = new Map<string, any[]>();
    const noBarcodeItems: any[] = [];

    for (const item of items) {
      if (item.barcode) {
        if (!barcodeMap.has(item.barcode)) barcodeMap.set(item.barcode, []);
        barcodeMap.get(item.barcode)!.push(item);
      } else {
        noBarcodeItems.push(item);
      }
    }

    const mergedItems: any[] = [];

    // Barkodu aynı olanları birleştir
    for (const group of barcodeMap.values()) {
      mergedItems.push(this.mergeProductGroup(group));
    }

    // Barkodu olmayanlar için Gemini ile benzerlik kontrolü (Opsiyonel/Gelecekte daha performanslı yapılabilir)
    // Şimdilik barkodu olmayanları olduğu gibi ekliyoruz veya başlık benzerliğine bakıyoruz.
    mergedItems.push(...this.mergeByTitleSimilarity(noBarcodeItems));

    return mergedItems;
  }

  private mergeProductGroup(group: any[]): any {
    if (group.length === 1) return group[0];

    // En iyi versiyonu seç (Resmi olan, en detaylı olan vb.)
    const bestItem = group.sort((a, b) => {
      const aScore = (a.imageUrl ? 2 : 0) + (Object.keys(a.attributes || {}).length * 0.5);
      const bScore = (b.imageUrl ? 2 : 0) + (Object.keys(b.attributes || {}).length * 0.5);
      return bScore - aScore;
    })[0];

    // Diğer marketplace linklerini ve fiyatlarını saklamak için bir yapı eklenebilir
    // Şimdilik sadece en iyiyi dönüyoruz.
    return bestItem;
  }

  private mergeByTitleSimilarity(items: any[]): any[] {
    // Şimdilik basitçe başlıkları aynı olanları birleştir (normalize edilmiş halleriyle)
    const titleMap = new Map<string, any[]>();
    
    for (const item of items) {
      if (!item.title) continue;
      const normTitle = item.title.toLowerCase().trim();
      if (!titleMap.has(normTitle)) titleMap.set(normTitle, []);
      titleMap.get(normTitle)!.push(item);
    }

    return Array.from(titleMap.values()).map(group => this.mergeProductGroup(group));
  }
}

export const marketplaceNormalizer = new MarketplaceNormalizer();
