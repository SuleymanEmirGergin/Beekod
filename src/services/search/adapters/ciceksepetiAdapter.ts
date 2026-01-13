import { SearchAdapter, SearchResultItem } from "../types.js";
import { ciceksepetiService } from "../../marketplace/ciceksepetiService.js";
import { logger } from "../../../logger.js";

interface CiceksepetiAttribute {
  attributeName?: string;
  attributeValue?: string;
}

interface CiceksepetiProduct {
  productName?: string;
  productCode?: string;
  salePrice?: number;
  link?: string;
  mainImage?: string;
  images?: string[];
  description?: string;
  barcode?: string;
  stockQuantity?: number;
  quantity?: number;
  categoryName?: string;
  attributes?: CiceksepetiAttribute[];
}

interface CiceksepetiProductsResponse {
  products?: CiceksepetiProduct[];
  response?: { products?: CiceksepetiProduct[] };
}

export class CiceksepetiAdapter implements SearchAdapter {
  name = "Ciceksepeti" as const;

  async search(query: string): Promise<SearchResultItem[]> {
    try {
      if (!ciceksepetiService.isConfigured()) {
        logger.warn("ciceksepeti_adapter.api_not_configured");
        return [];
      }

      // Fetch products (limit to 100)
      const result = await ciceksepetiService.getProducts({ pageSize: 100 }) as CiceksepetiProductsResponse;
      const products: CiceksepetiProduct[] = result?.products || result?.response?.products || [];

      if (!products || products.length === 0) {
        return [];
      }

      const queryLower = query.toLowerCase();

      // Client-side filtering
      return products
        .filter((p) => (p.productName || "").toLowerCase().includes(queryLower))
        .map((p) => ({
           marketplace: this.name,
           title: p.productName || "",
           price: p.salePrice || 0,
           currency: "TRY",
           url: p.link || `https://www.ciceksepeti.com/${p.productCode || ""}`, 
           imageUrl: p.mainImage || (p.images && p.images.length > 0 ? p.images[0] : ""),
           image: p.mainImage || (p.images && p.images.length > 0 ? p.images[0] : ""),
           description: p.description || "",
           brand: p.attributes?.find((a) => a.attributeName === "Marka" || a.attributeName === "Brand")?.attributeValue || "",
           stockCount: p.stockQuantity || p.quantity || 0,
           inStock: (p.stockQuantity || p.quantity || 0) > 0,
           barcode: p.barcode,
           category: p.categoryName || ""
        }))
        .slice(0, 10);

    } catch (error) {
       logger.error("ciceksepeti_adapter.search_failed", { error });
       return [];
    }
  }
}
