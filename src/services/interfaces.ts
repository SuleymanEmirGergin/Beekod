import { ProductCard } from "../chatbot/types.js";
import { ImportResult } from "./productImportService.js";
import { ImportDraft } from "./dto/import.js";

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
     * Generate a draft for import (scrapes & maps without saving).
     * @param url The product URL.
     * @returns A promise resolving to the ImportDraft.
     */
    getImportDraft(url: string): Promise<ImportDraft>;

    /**
     * Import a product from a specific URL (Full Scrape -> Save -> Push).
     * @param url The product URL.
     * @param providerId Optional provider ID (e.g., 'shopify', 'woocommerce').
     * @returns A promise resolving to the import result.
     */
    importProduct(url: string, providerId?: "shopify" | "woocommerce"): Promise<ImportResult>;
}
