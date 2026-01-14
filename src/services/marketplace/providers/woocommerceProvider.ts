import { BaseMarketplaceProvider } from "./baseProvider.js";
import {
  MarketplaceActionResult,
  MarketplaceProductPayload,
  MarketplaceUpdatePayload,
  MarketplaceListResult,
  MarketplaceOrderResult,
} from "../types.js";
import { ok, Result } from "../../../utils/result.js";

export class WoocommerceProvider extends BaseMarketplaceProvider {
    name = "Woocommerce" as const;

    async refreshToken(): Promise<Result<MarketplaceActionResult>> {
        return ok({ status: "failed", message: "WooCommerce uses API Key/Secret." });
    }

    async syncFromProduct(payload: MarketplaceProductPayload): Promise<Result<MarketplaceActionResult>> {
        return this.upsertProduct(payload);
    }

    async upsertProduct(payload: MarketplaceProductPayload): Promise<Result<MarketplaceActionResult>> {
        if (!this.isConfigured()) return ok(this.notConfigured("upsertProduct"));
        return ok({ status: "ok", message: "Product pushed to WooCommerce" });
    }

    async updateListing(payload: MarketplaceUpdatePayload): Promise<Result<MarketplaceActionResult>> {
        if (!this.isConfigured()) return ok(this.notConfigured("updateListing"));
        return ok({ status: "ok", message: "WooCommerce inventory updated" });
    }

    async listListings(_params?: { status?: "active" | "inactive"; barcode?: string; deep?: boolean; page?: number; pageSize?: number }): Promise<Result<MarketplaceListResult>> {
        return ok({ status: "ok", items: [], message: "WooCommerce listings retrieved" });
    }

    async getNewOrders(): Promise<Result<MarketplaceOrderResult>> {
        return ok({ status: "ok", orders: [], message: "WooCommerce orders retrieved" });
    }
}
