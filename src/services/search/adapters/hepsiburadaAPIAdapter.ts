import { SearchAdapter, SearchResultItem } from "../types.js";
import { hepsiburadaService } from "../../marketplace/hepsiburadaService.js";
import { logger } from "../../../logger.js";

export class HepsiburadaAPIAdapter implements SearchAdapter {
  name = "Hepsiburada" as const;

  async search(query: string): Promise<SearchResultItem[]> {
    try {
      if (!hepsiburadaService.isConfigured()) {
        logger.warn("hepsiburada_adapter.api_not_configured");
        return [];
      }

      // Fetch listings (limit 50)
      const result = await hepsiburadaService.getListings({ limit: 50 });
      const listings = result?.listings || result || [];

      if (!listings || listings.length === 0) return [];

      const queryLower = query.toLowerCase();
      const items: SearchResultItem[] = [];

      for (const listing of listings) {
        const productName = (listing.productName || listing.name || "").toLowerCase();

        if (productName.includes(queryLower)) {
          const sku = listing.hepsiburadaSku || listing.merchantSku || "";
          
          let brand = "";
          let description = "";

          // Fetch full details to get brand and description
          try {
            const detail = await hepsiburadaService.getProduct(sku);
            brand = detail.brand || detail.brandName || "";
            description = detail.description || detail.productDescription || "";
          } catch (e) {
            // Fallback if detail fetch fails
          }

          items.push({
             marketplace: this.name,
             title: listing.productName || listing.name || "",
             price: parseFloat(listing.price || 0),
             currency: "TRY",
             url: `https://www.hepsiburada.com/p-${sku}`,
             imageUrl: listing.imageUrl || "",
             image: listing.imageUrl || "",
             barcode: listing.barcode || sku,
             stockCount: listing.availableStock || listing.stock || 0,
             inStock: (listing.availableStock || listing.stock || 0) > 0,
             brand,
             description
          });
        }

        if (items.length >= 10) break;
      }

      return items;

    } catch (error) {
       logger.error("hepsiburada_adapter.search_failed", { error });
       return [];
    }
  }
}
