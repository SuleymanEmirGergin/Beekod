import { ProductCard } from "../chatbot/types.js";
import { ImportResult } from "./productImportService.js";

// Search Provider Interface
export interface ISearchProvider {
    /**
     * Search for products across marketplaces.
     * @param query The search query string.
     * @returns A promise resolving to an array of ProductCards.
     */
    search(query: string): Promise<ProductCard[]>;
}

// Import Provider Interface
export interface IImportProvider {
    /**
     * Import a product from a specific URL.
     * @param url The product URL.
     * @param providerId Optional provider ID (e.g., 'shopify', 'woocommerce').
     * @returns A promise resolving to the import result.
     */
    importProduct(url: string, providerId?: "shopify" | "woocommerce"): Promise<ImportResult>;
}
