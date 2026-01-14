import {
    MarketplaceActionResult,
    MarketplaceListResult,
    MarketplaceProductPayload,
    MarketplaceUpdatePayload,
    MarketplaceOrderResult,
} from "../types.js";
import { BaseMarketplaceProvider } from "./baseProvider.js";
import { ok, Result } from "../../../utils/result.js";

export class AmazonProvider extends BaseMarketplaceProvider {
    name = "Amazon" as const;

    async refreshToken(): Promise<Result<MarketplaceActionResult>> {
        return ok({
            status: "failed",
            message: "Amazon SP-API token refresh logic not implemented in stub.",
        });
    }

    async upsertProduct(payload: MarketplaceProductPayload): Promise<Result<MarketplaceActionResult>> {
        if (!this.isConfigured()) {
            return ok(this.notConfigured("upsertProduct"));
        }
        // Stub for Amazon SP-API Listings Items API
        return ok({
            status: "ok",
            message: `Amazon listing for ${payload.barcode} created (stub).`,
        });
    }

    async updateListing(payload: MarketplaceUpdatePayload): Promise<Result<MarketplaceActionResult>> {
        if (!this.isConfigured()) {
            return ok(this.notConfigured("updateListing"));
        }
        // Stub for Amazon SP-API Listings Items API (PATCH)
        return ok({
            status: "ok",
            message: `Amazon listing for ${payload.barcode} updated (stub).`,
        });
    }

    async syncFromProduct(payload: MarketplaceProductPayload): Promise<Result<MarketplaceActionResult>> {
        return this.updateListing({
            barcode: payload.barcode,
            price: payload.price,
            stock: payload.stock,
            title: payload.name,
        });
    }

    async listListings(_params?: { status?: "active" | "inactive"; barcode?: string; deep?: boolean; page?: number; pageSize?: number }): Promise<Result<MarketplaceListResult>> {
        if (!this.isConfigured()) {
            return ok({
                status: "not_configured",
                message: `${this.name} provider not configured.`,
                items: [],
            });
        }
        return ok({
            status: "ok",
            message: "Stub listings returned.",
            items: [],
        });
    }
    async getNewOrders(_params?: { startDate?: string; endDate?: string }): Promise<Result<MarketplaceOrderResult>> {
        if (!this.isConfigured()) {
            return ok({ status: "not_configured", message: "Amazon not configured", orders: [] });
        }
        return ok({
            status: "ok",
            message: "Synced 0 orders (stub)",
            orders: [],
        });
    }
}
