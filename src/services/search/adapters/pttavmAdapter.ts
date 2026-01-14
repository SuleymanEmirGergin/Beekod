import { SearchAdapter, SearchResultItem } from "../types.js";
import { getMarketplaceProvider } from "../../marketplace/index.js";
import { logger } from "../../../logger.js";

export class PttAVMAdapter implements SearchAdapter {
  name = "PttAVM" as const;

  async search(query: string): Promise<SearchResultItem[]> {
    try {
      const provider = getMarketplaceProvider("PttAVM");
      if (!provider || !provider.isConfigured()) {
        logger.warn("pttavm_adapter.provider_not_configured");
        return [];
      }

      logger.info("pttavm_adapter.search_start", { query });

      // Fetch listings via provider (only first page for speed)
      const isBarcode = /^\d+$/.test(query);
      const result = await provider.listListings({
        barcode: isBarcode ? query : undefined,
        page: 1,
        // pageSize is not valid, use defaults or specific provider params
      });
      if (!result.ok) {
        logger.error("pttavm_adapter.list_listings_failed", { error: result.error });
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
           url: `https://www.pttavm.com/product/${item.barcode}`, 
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
       logger.error("pttavm_adapter.search_failed", { error });
       return [];
    }
  }
}
