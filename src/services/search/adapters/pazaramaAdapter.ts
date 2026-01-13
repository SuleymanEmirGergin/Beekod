import { SearchAdapter, SearchResultItem } from "../types.js";
import { getMarketplaceProvider } from "../../marketplace/index.js";
import { logger } from "../../../logger.js";

export class PazaramaAdapter implements SearchAdapter {
  name = "Pazarama" as const;

  async search(query: string): Promise<SearchResultItem[]> {
    try {
      const provider = getMarketplaceProvider("Pazarama");
      if (!provider || !provider.isConfigured()) {
        logger.warn("pazarama_adapter.provider_not_configured");
        return [];
      }

      logger.info("pazarama_adapter.search_start", { query });

      // Fetch listings via provider
      const result = await provider.listListings();
      if (!result.ok) {
        logger.error("pazarama_adapter.list_listings_failed", { error: result.error });
        return [];
      }

      const queryLower = query.toLowerCase();

      // Client-side filtering
      return (result.value.items || [])
        .filter((item) => (item.title || "").toLowerCase().includes(queryLower))
        .map((item) => ({
           marketplace: this.name,
           title: item.title,
           price: item.price,
           currency: item.currency || "TRY",
           url: `https://www.pazarama.com/p-${item.barcode}`, 
           imageUrl: item.imageUrl || (item.images && item.images[0]) || "",
           image: item.imageUrl || (item.images && item.images[0]) || "",
           stockCount: item.stock,
           inStock: (item.stock || 0) > 0,
           barcode: item.barcode,
           brand: item.brand,
           description: item.description,
           category: item.category,
           attributes: item.attributes,
           variants: item.variants
        }))
        .slice(0, 10);

    } catch (error) {
       logger.error("pazarama_adapter.search_failed", { error });
       return [];
    }
  }
}
