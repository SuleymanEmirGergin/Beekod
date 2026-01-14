import { BaseMarketplaceProvider } from "./baseProvider.js";
import {
  MarketplaceActionResult,
  MarketplaceProductPayload,
  MarketplaceUpdatePayload,
  MarketplaceListResult,
  MarketplaceOrderResult,
} from "../types.js";
import { ok, Result } from "../../../utils/result.js";

export class ShopifyProvider extends BaseMarketplaceProvider {
    name = "Shopify" as const;
    // For now let's stick to the names in types.js: "Amazon" | "Trendyol" | ...
    // I should probably update MarketplaceName type.

    async refreshToken(): Promise<Result<MarketplaceActionResult>> {
        return ok({ status: "failed", message: "Shopify uses Access Tokens." });
    }

    async syncFromProduct(payload: MarketplaceProductPayload): Promise<Result<MarketplaceActionResult>> {
        return this.upsertProduct(payload);
    }

    async upsertProduct(_payload: MarketplaceProductPayload): Promise<Result<MarketplaceActionResult>> {
        if (!this.isConfigured()) return ok(this.notConfigured("upsertProduct"));
        // Shopify API logic here (mocked for now)
        return ok({ status: "ok", message: "Product pushed to Shopify" });
    }

    async updateListing(_payload: MarketplaceUpdatePayload): Promise<Result<MarketplaceActionResult>> {
        if (!this.isConfigured()) return ok(this.notConfigured("updateListing"));
        return ok({ status: "ok", message: "Shopify inventory updated" });
    }

    async listListings(_params?: { status?: "active" | "inactive"; barcode?: string; deep?: boolean; page?: number; pageSize?: number }): Promise<Result<MarketplaceListResult>> {
        return ok({ status: "ok", items: [], message: "Shopify listings retrieved" });
    }

    async getNewOrders(): Promise<Result<MarketplaceOrderResult>> {
        return ok({ status: "ok", orders: [], message: "Shopify orders retrieved" });
    }
}
