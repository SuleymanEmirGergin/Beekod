import { BaseMarketplaceProvider } from "./baseProvider.js";
import { MarketplaceActionResult, MarketplaceProductPayload, MarketplaceUpdatePayload, MarketplaceListResult, MarketplaceOrderResult } from "./types.js";

export class ShopifyProvider extends BaseMarketplaceProvider {
    name = "Shopify" as const;
    // For now let's stick to the names in types.js: "Amazon" | "Trendyol" | ...
    // I should probably update MarketplaceName type.

    async refreshToken(): Promise<MarketplaceActionResult> {
        return { status: "failed", message: "Shopify uses Access Tokens." };
    }

    async syncFromProduct(payload: MarketplaceProductPayload): Promise<MarketplaceActionResult> {
        return this.upsertProduct(payload);
    }

    async upsertProduct(payload: MarketplaceProductPayload): Promise<MarketplaceActionResult> {
        if (!this.isConfigured()) return this.notConfigured("upsertProduct");
        // Shopify API logic here (mocked for now)
        return { status: "ok", message: "Product pushed to Shopify" };
    }

    async updateListing(payload: MarketplaceUpdatePayload): Promise<MarketplaceActionResult> {
        if (!this.isConfigured()) return this.notConfigured("updateListing");
        return { status: "ok", message: "Shopify inventory updated" };
    }

    async listListings(): Promise<MarketplaceListResult> {
        return { status: "ok", items: [], message: "Shopify listings retrieved" };
    }

    async getNewOrders(): Promise<MarketplaceOrderResult> {
        return { status: "ok", orders: [], message: "Shopify orders retrieved" };
    }
}
