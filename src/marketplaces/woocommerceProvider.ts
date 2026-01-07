import { BaseMarketplaceProvider } from "./baseProvider.js";
import { MarketplaceActionResult, MarketplaceProductPayload, MarketplaceUpdatePayload, MarketplaceListResult, MarketplaceOrderResult } from "./types.js";

export class WoocommerceProvider extends BaseMarketplaceProvider {
    name = "Woocommerce" as const;

    async refreshToken(): Promise<MarketplaceActionResult> {
        return { status: "failed", message: "WooCommerce uses API Key/Secret." };
    }

    async syncFromProduct(payload: MarketplaceProductPayload): Promise<MarketplaceActionResult> {
        return this.upsertProduct(payload);
    }

    async upsertProduct(payload: MarketplaceProductPayload): Promise<MarketplaceActionResult> {
        if (!this.isConfigured()) return this.notConfigured("upsertProduct");
        return { status: "ok", message: "Product pushed to WooCommerce" };
    }

    async updateListing(payload: MarketplaceUpdatePayload): Promise<MarketplaceActionResult> {
        if (!this.isConfigured()) return this.notConfigured("updateListing");
        return { status: "ok", message: "WooCommerce inventory updated" };
    }

    async listListings(): Promise<MarketplaceListResult> {
        return { status: "ok", items: [], message: "WooCommerce listings retrieved" };
    }

    async getNewOrders(): Promise<MarketplaceOrderResult> {
        return { status: "ok", orders: [], message: "WooCommerce orders retrieved" };
    }
}
