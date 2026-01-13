import {
    MarketplaceActionResult,
    MarketplaceListResult,
    MarketplaceProductPayload,
    MarketplaceUpdatePayload,
} from "./types.js";
import { BaseMarketplaceProvider } from "./baseProvider.js";

export class AmazonProvider extends BaseMarketplaceProvider {
    name = "Amazon" as const;

    async refreshToken(): Promise<MarketplaceActionResult> {
        return {
            status: "failed",
            message: "Amazon SP-API token refresh logic not implemented in stub.",
        };
    }

    async upsertProduct(payload: MarketplaceProductPayload): Promise<MarketplaceActionResult> {
        if (!this.isConfigured()) {
            return this.notConfigured("upsertProduct");
        }
        // Stub for Amazon SP-API Listings Items API
        return {
            status: "ok",
            message: `Amazon listing for ${payload.barcode} created (stub).`,
        };
    }

    async updateListing(payload: MarketplaceUpdatePayload): Promise<MarketplaceActionResult> {
        if (!this.isConfigured()) {
            return this.notConfigured("updateListing");
        }
        // Stub for Amazon SP-API Listings Items API (PATCH)
        return {
            status: "ok",
            message: `Amazon listing for ${payload.barcode} updated (stub).`,
        };
    }

    async syncFromProduct(payload: MarketplaceProductPayload): Promise<MarketplaceActionResult> {
        return this.updateListing({
            barcode: payload.barcode,
            price: payload.price,
            stock: payload.stock,
            title: payload.name,
        });
    }

    async listListings(params?: { status?: "active" | "inactive"; barcode?: string }): Promise<MarketplaceListResult> {
        if (!this.isConfigured()) {
            return {
                status: "not_configured",
                message: `${this.name} provider not configured.`,
                items: [],
            };
        }
        return {
            status: "ok",
            message: "Stub listings returned.",
            items: [],
        };
    }

    async getNewOrders(params?: { startDate?: string; endDate?: string }): Promise<any> {
        if (!this.isConfigured()) {
            return { status: "not_configured", message: "Amazon not configured", orders: [] };
        }
        return {
            status: "ok",
            message: "Synced 0 orders (stub)",
            orders: [],
        };
    }
}
