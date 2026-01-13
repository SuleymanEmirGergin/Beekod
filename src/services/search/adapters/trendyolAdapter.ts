import { SearchAdapter, SearchResultItem } from "../types.js";
import { getMarketplaceProvider } from "../../marketplace/index.js";
import { logger } from "../../../logger.js";

export class TrendyolAdapter implements SearchAdapter {
  name = "Trendyol" as const;

  async search(query: string): Promise<SearchResultItem[]> {
    try {
      const provider = getMarketplaceProvider("Trendyol");
      if (!provider || !provider.isConfigured()) {
        logger.warn("trendyol_adapter.provider_not_configured");
        return [];
      }

      logger.info("trendyol_adapter.search_start", { query });

      // Use provider's listListings which handles variant grouping and rich data
      const result = await provider.listListings();
      if (!result.ok) {
        logger.error("trendyol_adapter.list_listings_failed", { error: result.error });
        return [];
      }

      const queryLower = query.toLowerCase();
      
      // Client-side filtering on names/titles
      const items: SearchResultItem[] = (result.value.items || [])
        .filter((item) => (item.title || "").toLowerCase().includes(queryLower))
        .map((item) => ({
          marketplace: this.name,
          title: item.title,
          price: item.price,
          currency: item.currency || "TRY",
          url: `https://www.trendyol.com/sr?q=${encodeURIComponent(item.title)}`, // Simplified search URL
          imageUrl: item.imageUrl || (item.images && item.images[0]) || "",
          image: item.imageUrl || (item.images && item.images[0]) || "",
          description: item.description,
          brand: item.brand,
          stockCount: item.stock,
          inStock: (item.stock || 0) > 0,
          barcode: item.barcode,
          attributes: item.attributes,
          variants: item.variants
        }))
        .slice(0, 10);

      logger.info("trendyol_adapter.search_success", { 
        found: result.value.items?.length, 
        filtered: items.length 
      });

      return items;

    } catch (error) {
      logger.error("trendyol_adapter.search_failed", { error });
      return [];
    }
  }
}
