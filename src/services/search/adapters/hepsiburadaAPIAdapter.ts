import axios from "axios";
import { SearchAdapter, SearchResultItem } from "../types.js";
import { logger } from "../../../logger.js";

// Hepsiburada Merchant Listing API
const HEPSIBURADA_API_URL = process.env.HEPSIBURADA_API_URL || "https://listing-external.hepsiburada.com";

export class HepsiburadaAPIAdapter implements SearchAdapter {
  name = "Hepsiburada" as const;

  private merchantId: string;
  private username: string;
  private password: string;

  constructor() {
    this.merchantId = process.env.HEPSIBURADA_MERCHANT_ID || "";
    this.username = process.env.HEPSIBURADA_API_USERNAME || "";
    this.password = process.env.HEPSIBURADA_API_PASSWORD || "";
  }

  async search(query: string): Promise<SearchResultItem[]> {
    try {
      if (!this.merchantId || !this.username || !this.password) {
        logger.warn("search.hepsiburada_api_not_configured");
        return [];
      }

      // Hepsiburada listing API uses HTTP Basic Auth
      const auth = Buffer.from(`${this.username}:${this.password}`).toString("base64");

      // Get listings from merchant
      const response = await axios.get(`${HEPSIBURADA_API_URL}/listings/merchantid/${this.merchantId}`, {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        params: {
          offset: 0,
          limit: 100, // Get more to filter by search query
        },
        timeout: 15000,
      });

      const items: SearchResultItem[] = [];
      const listings = response.data?.listings || response.data || [];

      // Filter locally by query (API doesn't support text search)
      const queryLower = query.toLowerCase();

      for (const listing of listings) {
        const productName = (listing.productName || listing.name || "").toLowerCase();

        // Simple text match
        if (productName.includes(queryLower)) {
          const price = parseFloat(listing.price || 0);
          const sku = listing.hepsiburadaSku || listing.merchantSku || "";

          items.push({
            marketplace: this.name,
            title: listing.productName || listing.name || "",
            price,
            currency: "TRY",
            url: `https://www.hepsiburada.com/p-${sku}`,
            imageUrl: listing.imageUrl || "",
            image: listing.imageUrl || "",
            barcode: listing.barcode || sku,
          });
        }

        // Stop if we have enough results
        if (items.length >= 10) break;
      }

      return items.slice(0, 10);
    } catch (error: any) {
      if (error.response?.status === 401) {
        logger.error("search.hepsiburada_api_auth_failed");
      } else {
        logger.error(`search.hepsiburada_api_failed`, { message: error.message });
      }
      return [];
    }
  }
}
